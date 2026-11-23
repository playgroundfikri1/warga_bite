import { requireAdminProfile } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import {
  OrdersClient,
  type OrderRow,
} from "@/components/dashboard/orders-client";

export default async function OrdersPage() {
  const { profile } = await requireAdminProfile();
  const supabase = await createClient();

  let ordersQuery = supabase
    .from("orders")
    .select(
      "*, customer:profiles!orders_customer_id_fkey(full_name, house_block), seller:profiles!orders_seller_id_fkey(full_name, shop_name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (!profile.is_super_admin) {
    ordersQuery = ordersQuery.eq("seller_complex_id", profile.complex_id);
  }

  const { data } = await ordersQuery;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Monitor Pesanan COD
        </h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Pantau seluruh transaksi COD secara real-time dan unduh laporan
          dalam format CSV atau Excel.
        </p>
      </div>

      <OrdersClient
        initialOrders={(data ?? []) as unknown as OrderRow[]}
        complexId={profile.complex_id}
        isSuperAdmin={profile.is_super_admin}
      />
    </div>
  );
}
