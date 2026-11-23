"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, MessageCircle, Receipt, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  formatRupiah,
  formatWhatsAppUrl,
  getRemainingSubscriptionDays,
  isSubscriptionActive,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Profile, SellerSubscription } from "@/types/database";

export interface SellerWithComplex extends Profile {
  complexes?: { name: string; monthly_subscription_price: number } | null;
}

export interface SubscriptionLogRow extends SellerSubscription {
  seller?: { full_name: string; shop_name: string | null } | null;
}

type FilterKey = "all" | "trial" | "active" | "expiring" | "expired";

interface Props {
  sellers: SellerWithComplex[];
  logs: SubscriptionLogRow[];
}

export function SubscriptionsClient({ sellers, logs }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedSeller, setSelectedSeller] =
    useState<SellerWithComplex | null>(null);
  const [durationDays, setDurationDays] = useState("30");
  const [amountPaid, setAmountPaid] = useState("25000");
  const [notes, setNotes] = useState("Perpanjangan langganan bulanan");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredSellers = useMemo(() => {
    return sellers.filter((s) => {
      const days = getRemainingSubscriptionDays(s.subscription_expires_at);
      const active = isSubscriptionActive(s.subscription_expires_at);

      if (filter === "trial") {
        return active && s.subscription_status === "trial";
      }
      if (filter === "active") {
        return active && s.subscription_status === "active";
      }
      if (filter === "expiring") {
        return active && days <= 7;
      }
      if (filter === "expired") {
        return !active;
      }
      return true;
    });
  }, [sellers, filter]);

  const totalRevenue = useMemo(
    () => logs.reduce((sum, item) => sum + item.amount_paid, 0),
    [logs]
  );

  function openExtendModal(seller: SellerWithComplex) {
    setSelectedSeller(seller);
    setDurationDays("30");
    setAmountPaid(
      String(seller.complexes?.monthly_subscription_price ?? 25000)
    );
    setNotes("Perpanjangan langganan bulanan via Admin");
  }

  async function handleExtendSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSeller) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        "extend_seller_subscription",
        {
          p_seller_id: selectedSeller.id,
          p_duration_days: Number(durationDays) || 30,
          p_amount_paid: Number(amountPaid) || 0,
          p_notes: notes.trim() || "Perpanjangan bulanan",
        }
      );

      if (error) {
        setFeedback({ type: "error", text: error.message });
        return;
      }

      const result = data as { success?: boolean; message?: string } | null;
      if (!result?.success) {
        setFeedback({
          type: "error",
          text: result?.message || "Gagal memperpanjang langganan penjual.",
        });
        return;
      }

      try {
        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedSeller.id,
            title: "Langganan Toko Diperpanjang!",
            body: `Toko ${selectedSeller.shop_name || "Anda"} aktif kembali selama ${durationDays} hari ke depan.`,
          }),
        });
      } catch {
        // Best effort push notification
      }

      setFeedback({
        type: "success",
        text: `Langganan ${selectedSeller.shop_name || selectedSeller.full_name} berhasil diperpanjang +${durationDays} hari.`,
      });
      setSelectedSeller(null);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const filterTabs: { key: FilterKey; label: string }[] = [
    { key: "all", label: `Semua (${sellers.length})` },
    { key: "trial", label: "Trial 30 Hari" },
    { key: "active", label: "Aktif Berbayar" },
    { key: "expiring", label: "Akan Habis (< 7 Hari)" },
    { key: "expired", label: "Expired (Tersembunyi)" },
  ];

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]"
              : "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition border ${
              filter === tab.key
                ? "border-[#EA580C] bg-[#EA580C] text-white"
                : "border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#1E293B]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabel Penjual */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Masa Aktif Penjual</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSellers.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#64748B]">
              Tidak ada penjual pada filter ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-[#E2E8F0] text-xs uppercase text-[#64748B]">
                  <tr>
                    <th className="py-3 pr-4">Toko &amp; Komplek</th>
                    <th className="py-3 px-4">Pemilik</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Berakhir</th>
                    <th className="py-3 px-4">Sisa Hari</th>
                    <th className="py-3 pl-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredSellers.map((seller) => {
                    const days = getRemainingSubscriptionDays(
                      seller.subscription_expires_at
                    );
                    const active = isSubscriptionActive(
                      seller.subscription_expires_at
                    );
                    const badgeVariant = !active
                      ? "danger"
                      : seller.subscription_status === "trial" || days <= 7
                        ? "warning"
                        : "success";
                    const badgeLabel = !active
                      ? "Expired"
                      : seller.subscription_status === "trial"
                        ? "Trial 30 Hari"
                        : "Aktif";

                    return (
                      <tr key={seller.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-[#1E293B]">
                            {seller.shop_name || "Toko Warga"}
                          </p>
                          <p className="text-xs text-[#64748B]">
                            {seller.complexes?.name ?? "-"}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">
                          {seller.full_name} • {seller.house_block}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">
                          {seller.subscription_expires_at
                            ? new Date(
                                seller.subscription_expires_at
                              ).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#1E293B]">
                          {active ? `${days} hari` : "Habis"}
                        </td>
                        <td className="py-3 pl-4">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={formatWhatsAppUrl(
                                seller.phone,
                                active
                                  ? `Halo ${seller.full_name}, masa aktif toko "${seller.shop_name || ""}" di WargaBite tinggal ${days} hari lagi. Hubungi kami jika ingin perpanjang langganan ya.`
                                  : `Halo ${seller.full_name}, masa aktif toko "${seller.shop_name || ""}" di WargaBite sudah habis sehingga menu disembunyikan sementara. Yuk perpanjang agar tampil lagi di katalog komplek!`
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-8 items-center gap-1 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-2.5 text-xs font-semibold text-[#16A34A] hover:bg-[#DCFCE7]"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Ingatkan WA
                            </a>
                            <Button
                              size="sm"
                              onClick={() => openExtendModal(seller)}
                            >
                              <CalendarPlus className="h-3.5 w-3.5" />
                              Perpanjang +30 Hari
                            </Button>
                          </div>
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

      {/* Log Pemasukan Langganan */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#EA580C]" />
            <CardTitle>Log Pemasukan &amp; Riwayat Aktivasi Langganan</CardTitle>
          </div>
          <Badge variant="success">
            Total Pemasukan: {formatRupiah(totalRevenue)}
          </Badge>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#64748B]">
              Belum ada catatan riwayat langganan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-[#E2E8F0] text-xs uppercase text-[#64748B]">
                  <tr>
                    <th className="py-3 pr-4">Tanggal</th>
                    <th className="py-3 px-4">Toko / Penjual</th>
                    <th className="py-3 px-4">Paket</th>
                    <th className="py-3 px-4">Durasi</th>
                    <th className="py-3 px-4">Nominal</th>
                    <th className="py-3 pl-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 pr-4 text-[#64748B]">
                        {new Date(log.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#1E293B]">
                        {log.seller?.shop_name || log.seller?.full_name || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            log.plan_type === "trial_30d" ? "warning" : "success"
                          }
                        >
                          {log.plan_type === "trial_30d"
                            ? "Gratis 30 Hari"
                            : "Berbayar"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">
                        {log.duration_days} hari
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#1E293B]">
                        {formatRupiah(log.amount_paid)}
                      </td>
                      <td className="py-3 pl-4 text-[#64748B]">
                        {log.payment_notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Perpanjang Langganan */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#1E293B]">
                  Perpanjang Langganan Penjual
                </h2>
                <p className="text-xs text-[#64748B]">
                  {selectedSeller.shop_name || selectedSeller.full_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSeller(null)}
                className="rounded-lg p-1 text-[#64748B] hover:bg-[#F8FAFC]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExtendSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1E293B]">
                  Durasi Tambahan (Hari)
                </label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1E293B]">
                  Nominal Pembayaran (Rp)
                </label>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  required
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1E293B]">
                  Catatan Pembayaran
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="cth: Transfer BCA / Tunai ke Admin"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedSeller(null)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Memproses..." : "Aktifkan Perpanjangan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
