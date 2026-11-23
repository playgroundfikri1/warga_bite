import { supabase } from "@/lib/supabase";
import type {
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductCategory,
  Review,
} from "@/types/database";

function fail(error: { message: string } | null): never {
  throw new Error(error?.message ?? "Terjadi kesalahan");
}

interface RpcResult {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

function unwrap(data: unknown): RpcResult {
  const r = data as RpcResult;
  if (!r?.success) throw new Error(r?.message ?? "Terjadi kesalahan");
  return r;
}

// ---------- Checkout COD ----------
export interface CheckoutLine {
  productId: string;
  quantity: number;
}

export async function placeOrder(
  lines: CheckoutLine[],
  notes?: string
): Promise<{ orderId: string; orderCode: string; total: number }> {
  const { data, error } = await supabase.rpc("place_order", {
    p_items: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
    p_notes: notes ?? null,
  });
  if (error) fail(error);
  const r = unwrap(data);
  return {
    orderId: r.order_id as string,
    orderCode: r.order_code as string,
    total: r.total_amount as number,
  };
}

// ---------- Daftar & detail pesanan ----------
export type OrderRole = "customer" | "seller" | "courier";

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  seller?: { shop_name: string | null; full_name: string } | null;
}

const ORDER_SELECT = "*, order_items(*), seller:profiles!orders_seller_id_fkey(shop_name, full_name)";

export async function listOrders(
  userId: string,
  role: OrderRole,
  statuses?: OrderStatus[]
): Promise<OrderWithItems[]> {
  const column = role === "customer" ? "customer_id" : role === "seller" ? "seller_id" : "courier_id";
  let q = supabase.from("orders").select(ORDER_SELECT).eq(column, userId);
  if (statuses?.length) q = q.in("order_status", statuses);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) fail(error);
  return (data ?? []) as unknown as OrderWithItems[];
}

export async function getOrder(orderId: string): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .maybeSingle();
  if (error) fail(error);
  return (data as unknown as OrderWithItems) ?? null;
}

/** Real-time: callback dipanggil saat pesanan milik user berubah. Kembalikan fungsi unsubscribe. */
export function subscribeOrders(
  userId: string,
  role: OrderRole,
  onChange: () => void
): () => void {
  const column = role === "customer" ? "customer_id" : role === "seller" ? "seller_id" : "courier_id";
  const channel = supabase
    .channel(`orders-${role}-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders", filter: `${column}=eq.${userId}` },
      onChange
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------- Status oleh penjual ----------
export async function advanceOrderStatus(
  orderId: string,
  status: "PREPARING" | "SENT" | "CANCELLED"
): Promise<void> {
  const { data, error } = await supabase.rpc("advance_order_status", {
    p_order_id: orderId,
    p_new_status: status,
  });
  if (error) fail(error);
  unwrap(data);
}

// ---------- Serah terima (QR / kode + 2 foto wajib) ----------
export type ProofKind = "food" | "house";

/** Unggah foto bukti ke bucket privat `handoff-proofs`; kembalikan path storage. */
export async function uploadHandoffProof(
  senderId: string,
  orderId: string,
  kind: ProofKind,
  localUri: string
): Promise<string> {
  const path = `${senderId}/${orderId}/${kind}.jpg`;
  const buf = await (await fetch(localUri)).arrayBuffer();
  const { error } = await supabase.storage
    .from("handoff-proofs")
    .upload(path, buf, { contentType: "image/jpeg", upsert: true });
  if (error) fail(error);
  return path;
}

/** Cari pesanan dari hasil scan QR (UUID) atau kode manual (mis. WB-241123-AB12CD). */
export async function findOrderByHandoffCode(identifier: string): Promise<Order | null> {
  const id = identifier.trim();
  const isUuid = /^[0-9a-f-]{36}$/i.test(id);
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq(isUuid ? "qr_handoff_token" : "order_code", isUuid ? id.toLowerCase() : id.toUpperCase())
    .maybeSingle();
  if (error) fail(error);
  return (data as Order) ?? null;
}

export async function completeOrderWithProof(
  identifier: string,
  foodPhotoPath: string,
  housePhotoPath: string
): Promise<void> {
  const { data, error } = await supabase.rpc("complete_order_with_proof", {
    p_identifier: identifier.trim(),
    p_food_photo_path: foodPhotoPath,
    p_house_photo_path: housePhotoPath,
  });
  if (error) fail(error);
  unwrap(data);
}

export async function getProofUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("handoff-proofs")
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

// ---------- Reorder aman ----------
export interface ReorderItem {
  product_id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  seller_id: string;
  shop_name: string | null;
  can_order: boolean;
  reason: string | null;
}

export async function getReorderItems(orderId: string): Promise<ReorderItem[]> {
  const { data, error } = await supabase.rpc("get_reorder_items", { p_order_id: orderId });
  if (error) fail(error);
  return (data ?? []) as ReorderItem[];
}

// ---------- CRUD menu penjual ----------
export async function listMyProducts(sellerId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) fail(error);
  return (data ?? []) as Product[];
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  category: ProductCategory;
  image_url?: string | null;
  is_available?: boolean;
}

export async function addProduct(
  sellerId: string,
  complexId: string,
  input: ProductInput
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({ ...input, seller_id: sellerId, complex_id: complexId })
    .select()
    .single();
  if (error) fail(error);
  return data as Product;
}

export async function updateProduct(
  productId: string,
  patch: Partial<ProductInput>
): Promise<void> {
  const { error } = await supabase.from("products").update(patch).eq("id", productId);
  if (error) fail(error);
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) fail(error);
}

/** Unggah foto menu ke bucket publik `product-images` (folder = uid penjual). */
export async function uploadProductImage(sellerId: string, localUri: string): Promise<string> {
  const path = `${sellerId}/${Date.now()}.jpg`;
  const buf = await (await fetch(localUri)).arrayBuffer();
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, buf, { contentType: "image/jpeg", upsert: true });
  if (error) fail(error);
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export async function setShopOpen(sellerId: string, open: boolean): Promise<void> {
  const { error } = await supabase.from("profiles").update({ is_shop_open: open }).eq("id", sellerId);
  if (error) fail(error);
}

// ---------- Rating & ulasan ----------
export async function getMyReview(orderId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) fail(error);
  return (data as Review) ?? null;
}

export async function submitReview(
  order: Pick<Order, "id" | "customer_id" | "seller_id">,
  rating: number,
  comment?: string
): Promise<void> {
  const { error } = await supabase.from("reviews").insert({
    order_id: order.id,
    customer_id: order.customer_id,
    seller_id: order.seller_id,
    rating,
    comment: comment?.trim() || null,
  });
  if (error) fail(error);
}
