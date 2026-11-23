import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  CreditCard,
  Download,
  ShoppingBag,
  Store,
} from "lucide-react";
import { requireAdminProfile } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatRupiah,
  getRemainingSubscriptionDays,
  isSubscriptionActive,
} from "@/lib/utils";
import {
  DailyTransactionsChart,
  type DailyChartPoint,
} from "@/components/dashboard/overview-charts";
import type { Order, Profile } from "@/types/database";

export default async function DashboardOverviewPage() {
  const { profile } = await requireAdminProfile();
  const supabase = await createClient();

  let ordersQuery = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  let sellersQuery = supabase
    .from("profiles")
    .select("*")
    .eq("is_seller", true)
    .order("subscription_expires_at", { ascending: true });

  if (!profile.is_super_admin) {
    ordersQuery = ordersQuery.eq("seller_complex_id", profile.complex_id);
    sellersQuery = sellersQuery.eq("complex_id", profile.complex_id);
  }

  const [{ data: ordersData }, { data: sellersData }] = await Promise.all([
    ordersQuery,
    sellersQuery,
  ]);

  const orders = (ordersData ?? []) as Order[];
  const sellers = (sellersData ?? []) as Profile[];

  const totalCodAmount = orders
    .filter((o) => o.order_status !== "CANCELLED")
    .reduce((sum, o) => sum + o.total_amount, 0);

  const activeOrdersCount = orders.filter((o) =>
    ["CONFIRMED", "PREPARING", "SENT"].includes(o.order_status)
  ).length;

  const activeSubscribedSellers = sellers.filter((s) =>
    isSubscriptionActive(s.subscription_expires_at)
  );

  const expiringOrTrialSellers = sellers.filter((s) => {
    const days = getRemainingSubscriptionDays(s.subscription_expires_at);
    return (
      (s.subscription_status === "trial" && days > 0) ||
      (days > 0 && days <= 7)
    );
  });

  const dayBuckets = new Map<string, DailyChartPoint>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
    dayBuckets.set(key, { date: label, total: 0, count: 0 });
  }

  for (const order of orders) {
    if (order.order_status === "CANCELLED") continue;
    const key = order.created_at.slice(0, 10);
    const bucket = dayBuckets.get(key);
    if (bucket) {
      bucket.total += order.total_amount;
      bucket.count += 1;
    }
  }

  const chartData = Array.from(dayBuckets.values());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">
            Dashboard Ringkasan
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Pantau transaksi COD, status langganan penjual (Gratis 30 Hari →
            Berlangganan), dan pesanan aktif.
          </p>
        </div>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#1E293B] hover:bg-[#F8FAFC] transition"
        >
          <Download className="h-4 w-4 text-[#EA580C]" />
          Export CSV / Excel
        </Link>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                Total Transaksi COD
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#EA580C]">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1E293B] mt-3">
              {formatRupiah(totalCodAmount)}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Dari {orders.length} total pesanan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                Seller Langganan Aktif
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#16A34A]">
                <Store className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1E293B] mt-3">
              {activeSubscribedSellers.length}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Dari {sellers.length} penjual terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                Seller Trial / Akan Habis
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#D97706]">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1E293B] mt-3">
              {expiringOrTrialSellers.length}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Perlu follow-up perpanjangan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                Pesanan Aktif
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1E293B] mt-3">
              {activeOrdersCount}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Dikonfirmasi, Dimasak, Diantar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grafik Harian */}
      <DailyTransactionsChart data={chartData} />

      {/* Ringkasan Langganan Penjual */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Status Langganan Penjual</CardTitle>
            <p className="text-xs text-[#64748B] mt-1">
              Penjual yang masa aktifnya habis otomatis disembunyikan dari
              katalog warga oleh RLS.
            </p>
          </div>
          <Link
            href="/dashboard/subscriptions"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#EA580C] hover:underline"
          >
            Kelola Semua <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {sellers.length === 0 ? (
            <p className="text-sm text-[#64748B] py-6 text-center">
              Belum ada penjual yang disetujui.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-[#E2E8F0] text-xs uppercase text-[#64748B]">
                  <tr>
                    <th className="py-3 pr-4">Nama Toko</th>
                    <th className="py-3 px-4">Pemilik &amp; Blok</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Sisa Hari</th>
                    <th className="py-3 pl-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {sellers.slice(0, 8).map((seller) => {
                    const days = getRemainingSubscriptionDays(
                      seller.subscription_expires_at
                    );
                    const active = isSubscriptionActive(
                      seller.subscription_expires_at
                    );
                    const statusVariant = !active
                      ? "danger"
                      : seller.subscription_status === "trial" || days <= 7
                        ? "warning"
                        : "success";
                    const statusLabel = !active
                      ? "Expired"
                      : seller.subscription_status === "trial"
                        ? "Trial 30 Hari"
                        : "Aktif";

                    return (
                      <tr key={seller.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 pr-4 font-semibold text-[#1E293B]">
                          {seller.shop_name || "Toko Warga"}
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">
                          {seller.full_name} • {seller.house_block}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusVariant}>{statusLabel}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[#1E293B]">
                            <Clock className="h-3.5 w-3.5 text-[#94A3B8]" />
                            {active ? `${days} hari` : "Habis"}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-right">
                          <Link
                            href="/dashboard/subscriptions"
                            className="inline-flex items-center rounded-xl bg-[#EA580C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#F97316] transition"
                          >
                            Perpanjang +30 Hari
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
