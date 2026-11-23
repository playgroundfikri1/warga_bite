import React from "react";
import { Pressable, Text, View } from "react-native";
import { AlertTriangle, Clock, ShieldCheck } from "lucide-react-native";
import type { SubscriptionView } from "../lib/api";
import { hapticLight } from "../lib/haptics";

/**
 * Banner peringatan mode browse-only untuk warga berstatus pending.
 */
export function PendingBanner() {
  return (
    <View className="flex-row items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3.5">
      <Clock size={20} color="#D97706" className="mt-0.5" />
      <View className="flex-1">
        <Text className="text-xs font-bold text-amber-900">
          Akun Menunggu Verifikasi Pengurus Komplek
        </Text>
        <Text className="mt-0.5 text-xs leading-relaxed text-amber-800">
          Anda bisa melihat katalog menu komplek (mode lihat saja). Pemesanan,
          nomor blok penjual, dan kontak WhatsApp akan terbuka setelah akun
          disetujui.
        </Text>
      </View>
    </View>
  );
}

/**
 * Banner status masa aktif / gratis 30 hari untuk penjual.
 */
export function SubscriptionBanner({
  view,
  onManagePress,
}: {
  view: SubscriptionView;
  onManagePress?: () => void;
}) {
  if (view.kind === "none") return null;

  if (view.kind === "expired") {
    return (
      <View className="flex-row items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-3.5">
        <AlertTriangle size={20} color="#DC2626" />
        <View className="flex-1">
          <Text className="text-xs font-bold text-red-900">
            Langganan Toko Berakhir
          </Text>
          <Text className="mt-0.5 text-xs text-red-800">
            Menu Anda sementara disembunyikan dari katalog warga. Hubungi admin
            komplek untuk perpanjangan.
          </Text>
          {onManagePress && (
            <Pressable
              onPress={() => {
                hapticLight();
                onManagePress();
              }}
              android_ripple={{ color: "rgba(255,255,255,0.22)" }}
              className="mt-2 self-start overflow-hidden rounded-full bg-status-danger px-3 py-1.5 active:scale-95"
            >
              <Text className="text-xs font-bold text-white">
                Lihat Detail Langganan
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  const isWarn = view.warn;
  const label =
    view.kind === "trial" ? "Gratis 30 Hari Aktif" : "Langganan Aktif";

  return (
    <View
      className={`flex-row items-center justify-between gap-3 rounded-2xl border p-3.5 ${
        isWarn
          ? "border-amber-300 bg-amber-50"
          : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <View className="flex-1 flex-row items-center gap-2.5">
        <ShieldCheck size={20} color={isWarn ? "#D97706" : "#065F46"} />
        <View className="flex-1">
          <Text
            className={`text-xs font-bold ${
              isWarn ? "text-amber-900" : "text-chip-mintText"
            }`}
          >
            {label} • Sisa {view.daysLeft} hari
          </Text>
          <Text
            className={`mt-0.5 text-[11px] ${
              isWarn ? "text-amber-800" : "text-emerald-800"
            }`}
          >
            {isWarn
              ? "Segera perpanjang agar menu tetap tampil di katalog warga."
              : "Toko dan menu Anda tampil aktif di katalog komplek."}
          </Text>
        </View>
      </View>
      {onManagePress && (
        <Pressable
          onPress={onManagePress}
          className="rounded-full bg-surface px-3 py-1.5 shadow-sm"
        >
          <Text className="text-xs font-bold text-ink">Detail</Text>
        </Pressable>
      )}
    </View>
  );
}
