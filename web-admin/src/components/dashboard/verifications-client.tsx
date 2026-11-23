"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  MessageCircle,
  Sparkles,
  Store,
  UserCheck,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatWhatsAppUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Profile } from "@/types/database";

export interface VerificationProfile extends Profile {
  complexes?: { name: string } | null;
}

interface Props {
  pendingResidents: VerificationProfile[];
  pendingSellers: VerificationProfile[];
}

export function VerificationsClient({
  pendingResidents,
  pendingSellers,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"residents" | "sellers">(
    "residents"
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function sendPushNotification(
    userId: string,
    title: string,
    body: string
  ) {
    try {
      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, body }),
      });
    } catch {
      // Push notifikasi bersifat best-effort agar alur verifikasi tidak terblokir
    }
  }

  async function handleResidentAction(
    resident: VerificationProfile,
    status: "approved" | "rejected"
  ) {
    setBusyId(resident.id);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          verification_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resident.id);

      if (error) {
        setFeedback({ type: "error", text: error.message });
        return;
      }

      if (status === "approved") {
        await sendPushNotification(
          resident.id,
          "Akun Warga Disetujui!",
          "Selamat, akun WargaBite kamu sudah terverifikasi. Sekarang kamu bisa memesan makanan COD."
        );
      }

      setFeedback({
        type: "success",
        text:
          status === "approved"
            ? `${resident.full_name} berhasil disetujui sebagai warga terverifikasi.`
            : `Pengajuan warga ${resident.full_name} telah ditolak.`,
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleSellerApprove(seller: VerificationProfile) {
    setBusyId(seller.id);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("approve_seller_with_trial", {
        p_seller_id: seller.id,
      });

      if (error) {
        setFeedback({ type: "error", text: error.message });
        return;
      }

      const result = data as { success?: boolean; message?: string } | null;
      if (!result?.success) {
        setFeedback({
          type: "error",
          text: result?.message || "Gagal menyetujui pengajuan penjual.",
        });
        return;
      }

      await sendPushNotification(
        seller.id,
        "Toko Kamu Aktif (Gratis 30 Hari)!",
        `Selamat! Toko ${seller.shop_name || "Anda"} disetujui dengan masa percobaan gratis 30 hari.`
      );

      setFeedback({
        type: "success",
        text: `${seller.shop_name || seller.full_name} disetujui & mendapat Gratis 30 Hari.`,
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleSellerReject(seller: VerificationProfile) {
    setBusyId(seller.id);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          seller_request_status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", seller.id);

      if (error) {
        setFeedback({ type: "error", text: error.message });
        return;
      }

      setFeedback({
        type: "success",
        text: `Pengajuan toko ${seller.shop_name || seller.full_name} ditolak.`,
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
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

      {/* Tab Switcher */}
      <div className="inline-flex rounded-xl border border-[#E2E8F0] bg-white p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("residents")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            activeTab === "residents"
              ? "bg-[#EA580C] text-white"
              : "text-[#64748B] hover:text-[#1E293B]"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Verifikasi Warga ({pendingResidents.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sellers")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            activeTab === "sellers"
              ? "bg-[#EA580C] text-white"
              : "text-[#64748B] hover:text-[#1E293B]"
          }`}
        >
          <Store className="h-4 w-4" />
          Pengajuan Penjual ({pendingSellers.length})
        </button>
      </div>

      {activeTab === "residents" ? (
        pendingResidents.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-[#64748B]">
              Tidak ada warga yang menunggu verifikasi saat ini.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingResidents.map((resident) => (
              <Card key={resident.id}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-[#1E293B]">
                        {resident.full_name}
                      </h3>
                      <p className="text-xs text-[#64748B]">{resident.email}</p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>

                  <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs text-[#64748B] space-y-1">
                    <p>
                      <span className="font-semibold text-[#1E293B]">
                        Komplek:
                      </span>{" "}
                      {resident.complexes?.name ?? "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-[#1E293B]">
                        Blok / Rumah:
                      </span>{" "}
                      {resident.house_block}
                    </p>
                    <p>
                      <span className="font-semibold text-[#1E293B]">
                        Alamat:
                      </span>{" "}
                      {resident.full_address}
                    </p>
                    <p>
                      <span className="font-semibold text-[#1E293B]">
                        No. WA:
                      </span>{" "}
                      {resident.phone}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={formatWhatsAppUrl(
                        resident.phone,
                        `Halo ${resident.full_name}, saya Admin Komplek WargaBite ingin mengonfirmasi alamat rumah Anda (${resident.house_block}).`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-3 text-xs font-semibold text-[#16A34A] hover:bg-[#DCFCE7] transition"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Chat WA
                    </a>
                    <Button
                      size="sm"
                      variant="success"
                      disabled={busyId === resident.id}
                      onClick={() => handleResidentAction(resident, "approved")}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Setujui Warga
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === resident.id}
                      onClick={() => handleResidentAction(resident, "rejected")}
                      className="text-[#DC2626] hover:bg-[#FEF2F2]"
                    >
                      <X className="h-3.5 w-3.5" />
                      Tolak
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : pendingSellers.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-[#64748B]">
            Tidak ada pengajuan penjual baru saat ini.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingSellers.map((seller) => (
            <Card key={seller.id}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-[#1E293B]">
                      {seller.shop_name || "Toko Baru"}
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Pemilik: {seller.full_name} • {seller.house_block}
                    </p>
                  </div>
                  <Badge variant="primary">Pengajuan Seller</Badge>
                </div>

                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs text-[#64748B] space-y-1">
                  <p>
                    <span className="font-semibold text-[#1E293B]">
                      Komplek:
                    </span>{" "}
                    {seller.complexes?.name ?? "-"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">
                      Deskripsi Toko:
                    </span>{" "}
                    {seller.shop_description || "-"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">
                      No. WA:
                    </span>{" "}
                    {seller.phone}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={formatWhatsAppUrl(
                      seller.phone,
                      `Halo ${seller.full_name}, pengajuan toko "${seller.shop_name || ""}" di WargaBite sedang kami tinjau.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-3 text-xs font-semibold text-[#16A34A] hover:bg-[#DCFCE7] transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat WA
                  </a>
                  <Button
                    size="sm"
                    disabled={busyId === seller.id}
                    onClick={() => handleSellerApprove(seller)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Setujui (+ Gratis 30 Hari)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === seller.id}
                    onClick={() => handleSellerReject(seller)}
                    className="text-[#DC2626] hover:bg-[#FEF2F2]"
                  >
                    <X className="h-3.5 w-3.5" />
                    Tolak
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
