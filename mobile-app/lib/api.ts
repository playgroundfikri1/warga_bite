import { supabase } from "@/lib/supabase";
import type {
  City,
  Complex,
  PostalCode,
  Profile,
  Province,
  SellerSubscription,
} from "@/types/database";

function fail(error: { message: string } | null): never {
  throw new Error(error?.message ?? "Terjadi kesalahan");
}

// ---------- Wilayah ----------
export async function listProvinces(): Promise<Province[]> {
  const { data, error } = await supabase.from("provinces").select("*").order("name");
  if (error) fail(error);
  return data as Province[];
}

export async function listCities(provinceId: string): Promise<City[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("province_id", provinceId)
    .order("name");
  if (error) fail(error);
  return data as City[];
}

export async function listPostalCodes(cityId: string): Promise<PostalCode[]> {
  const { data, error } = await supabase
    .from("postal_codes")
    .select("*")
    .eq("city_id", cityId)
    .order("postal_code");
  if (error) fail(error);
  return data as PostalCode[];
}

// ---------- Komplek ----------
export async function listComplexes(): Promise<Complex[]> {
  const { data, error } = await supabase.from("complexes").select("*").order("name");
  if (error) fail(error);
  return data as Complex[];
}

export interface NewComplexInput {
  province_id: string;
  city_id: string;
  postal_code: string;
  name: string;
  cluster_name?: string;
  rt?: string;
  rw?: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  max_delivery_radius_km?: number;
  monthly_subscription_price?: number;
  is_courier_enabled?: boolean;
  allow_cross_complex?: boolean;
  created_by: string;
}

export async function addComplex(input: NewComplexInput): Promise<Complex> {
  const { lat, lng, ...rest } = input;
  const row: Record<string, unknown> = {
    ...rest,
    max_delivery_radius_km: rest.max_delivery_radius_km ?? 10,
    monthly_subscription_price: rest.monthly_subscription_price ?? 25000,
    is_courier_enabled: rest.is_courier_enabled ?? true,
    allow_cross_complex: rest.allow_cross_complex ?? true,
  };
  if (lat != null && lng != null) row.location = `SRID=4326;POINT(${lng} ${lat})`;
  const { data, error } = await supabase.from("complexes").insert(row).select().single();
  if (error) fail(error);
  return data as Complex;
}

// ---------- Auth & Registrasi ----------
export interface RegisterInput {
  email: string;
  password: string;
  complex_id: string;
  full_name: string;
  phone: string;
  house_block: string;
  full_address: string;
}

/** Data registrasi disimpan di user_metadata agar profil bisa dibuat setelah OTP terverifikasi. */
export async function registerAccount(input: RegisterInput): Promise<void> {
  const { email, password, ...meta } = input;
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: meta },
  });
  if (error) fail(error);
}

export async function verifySignupOtp(email: string, token: string): Promise<void> {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token,
    type: "signup",
  });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("expired") || m.includes("invalid")) {
      throw new Error("Kode OTP salah atau sudah kedaluwarsa.");
    }
    fail(error);
  }
  if (data.user) await ensureProfile();
}

export async function resendSignupOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim().toLowerCase(),
  });
  if (error) fail(error);
}

/**
 * Membuat profil `pending` (Mode Browse-Only) dari user_metadata bila belum ada.
 * Aman dipanggil berulang kali.
 */
export async function ensureProfile(): Promise<Profile | null> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return existing as Profile;

  const m = (user.user_metadata ?? {}) as Partial<RegisterInput>;
  if (!m.complex_id || !m.full_name) return null;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      complex_id: m.complex_id,
      full_name: m.full_name,
      email: user.email ?? m.email ?? "",
      phone: m.phone ?? "",
      house_block: m.house_block ?? "",
      full_address: m.full_address ?? "",
      verification_status: "pending",
      is_customer: true,
    })
    .select()
    .single();
  if (error) fail(error);
  return data as Profile;
}

export async function updateAddress(
  userId: string,
  patch: Pick<Profile, "house_block" | "full_address" | "phone">
): Promise<void> {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) fail(error);
}

// ---------- Katalog ----------
export interface CatalogItem {
  product_id: string;
  product_name: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  seller_id: string;
  shop_name: string | null;
  complex_name: string;
  distance_km: number | null;
}

/** Katalog komplek sendiri (hanya penjual aktif, toko buka, langganan aktif — difilter di RPC). */
export async function listCatalog(complexId: string): Promise<CatalogItem[]> {
  const { data, error } = await supabase.rpc("get_products_within_radius", {
    user_lat: 0,
    user_lng: 0,
    radius_km: 10,
    only_my_complex: true,
    my_complex_id: complexId,
  });
  if (error) fail(error);
  return (data ?? []) as CatalogItem[];
}

export interface ProductDetail {
  product_id: string;
  product_name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  complex_id: string;
  complex_name: string;
  seller_id: string;
  shop_name: string | null;
  shop_description: string | null;
  is_shop_open: boolean;
  seller_house_block: string | null; // null saat pembeli pending (dimasking server)
  seller_phone: string | null;
  seller_subscription_active: boolean;
  rating_avg: number | null;
  rating_count: number;
}

export async function getProductDetail(productId: string): Promise<ProductDetail | null> {
  const { data, error } = await supabase.rpc("get_product_detail", {
    p_product_id: productId,
  });
  if (error) fail(error);
  const row = Array.isArray(data) ? data[0] : data;
  return (row as ProductDetail | undefined) ?? null;
}

// ---------- Seller ----------
export async function requestSeller(
  userId: string,
  shopName: string,
  shopDescription: string
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      shop_name: shopName.trim(),
      shop_description: shopDescription.trim(),
      seller_request_status: "pending",
    })
    .eq("id", userId);
  if (error) fail(error);
}

export async function listMySubscriptions(userId: string): Promise<SellerSubscription[]> {
  const { data, error } = await supabase
    .from("seller_subscriptions")
    .select("*")
    .eq("seller_id", userId)
    .order("starts_at", { ascending: false });
  if (error) fail(error);
  return data as SellerSubscription[];
}

/** Status tampilan langganan untuk SubscriptionBanner. */
export type SubscriptionView =
  | { kind: "none" }
  | { kind: "trial" | "active"; daysLeft: number; warn: boolean }
  | { kind: "expired" };

export function getSubscriptionView(profile: Profile): SubscriptionView {
  if (!profile.is_seller || !profile.subscription_expires_at) return { kind: "none" };
  const ms = new Date(profile.subscription_expires_at).getTime() - Date.now();
  if (ms <= 0) return { kind: "expired" };
  const daysLeft = Math.ceil(ms / 86_400_000);
  return {
    kind: profile.subscription_status === "trial" ? "trial" : "active",
    daysLeft,
    warn: daysLeft <= 5,
  };
}
