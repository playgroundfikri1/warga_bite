import { requireAdminProfile } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import {
  SubscriptionsClient,
  type SellerWithComplex,
  type SubscriptionLogRow,
} from "@/components/dashboard/subscriptions-client";

export default async function SubscriptionsPage() {
  const { profile } = await requireAdminProfile();
  const supabase = await createClient();

  let sellersQuery = supabase
    .from("profiles")
    .select("*, complexes(name, monthly_subscription_price)")
    .eq("is_seller", true)
    .order("subscription_expires_at", { ascending: true });

  let logsQuery = supabase
    .from("seller_subscriptions")
    .select("*, seller:profiles!seller_subscriptions_seller_id_fkey(full_name, shop_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!profile.is_super_admin) {
    sellersQuery = sellersQuery.eq("complex_id", profile.complex_id);
    logsQuery = logsQuery.eq("complex_id", profile.complex_id);
  }

  const [{ data: sellersData }, { data: logsData }] = await Promise.all([
    sellersQuery,
    logsQuery,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Kelola Langganan Seller
        </h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Setelah masa Gratis 30 Hari berakhir, toko otomatis disembunyikan
          oleh sistem sampai Admin melakukan perpanjangan.
        </p>
      </div>

      <SubscriptionsClient
        sellers={(sellersData ?? []) as unknown as SellerWithComplex[]}
        logs={(logsData ?? []) as unknown as SubscriptionLogRow[]}
      />
    </div>
  );
}
