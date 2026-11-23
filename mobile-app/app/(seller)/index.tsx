import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeftRight,
  CreditCard,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { SubscriptionBanner } from "../../components/Banners";
import { SectionCard } from "../../components/SectionCard";
import { StatusChip } from "../../components/StatusChip";
import { getSubscriptionView } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { formatRupiah } from "../../lib/format";
import { hapticLight } from "../../lib/haptics";
import { useAppStore } from "../../store/useAppStore";

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { profile, complex } = useAuth();
  const setActiveRole = useAppStore((s) => s.setActiveRole);

  const subView = profile ? getSubscriptionView(profile) : { kind: "none" as const };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <AppHeader
        title="Dapur Pesanan"
        subtitle={profile?.shop_name ?? "Toko Saya"}
        showLogo
        rightSlot={
          <Pressable
            onPress={() => {
              hapticLight();
              setActiveRole("customer");
              router.replace("/(customer)");
            }}
            android_ripple={{ color: "rgba(166,58,0,0.12)" }}
            className="flex-row items-center gap-1.5 overflow-hidden rounded-full bg-field px-3 py-2 active:scale-95"
          >
            <ArrowLeftRight size={14} color="#A63A00" />
            <Text className="text-xs font-bold text-cta">Mode Warga</Text>
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1 bg-canvas"
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
      >
        {/* Status toko */}
        <SectionCard>
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-1">
              <Text className="text-base font-extrabold text-ink">
                {profile?.shop_name ?? "Dapur Warga"}
              </Text>
              <Text className="mt-0.5 text-xs text-ink-secondary">
                {profile?.house_block || "-"} • {complex?.name ?? "Komplek"}
              </Text>
            </View>
            <StatusChip
              label={profile?.is_shop_open ? "Toko Buka" : "Toko Tutup"}
              variant={profile?.is_shop_open ? "mint" : "muted"}
              showDot
            />
          </View>
        </SectionCard>

        {/* Banner Gratis 30 Hari / Langganan */}
        <SubscriptionBanner
          view={subView}
          onManagePress={() => router.push("/(seller)/subscription")}
        />

        {/* Ringkasan metrik */}
        <View className="flex-row gap-3">
          <SectionCard className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-ink-secondary">
                Omzet Hari Ini
              </Text>
              <Wallet size={16} color="#EA580C" />
            </View>
            <Text className="mt-2 text-lg font-extrabold text-cta">
              {formatRupiah(0)}
            </Text>
            <Text className="mt-0.5 text-[11px] text-ink-secondary">
              Aktif penuh di Tahap 4
            </Text>
          </SectionCard>

          <SectionCard className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-ink-secondary">
                Pesanan Aktif
              </Text>
              <ShoppingBag size={16} color="#065F46" />
            </View>
            <Text className="mt-2 text-lg font-extrabold text-ink">
              0 Pesanan
            </Text>
            <Text className="mt-0.5 text-[11px] text-ink-secondary">
              Realtime di Tahap 4
            </Text>
          </SectionCard>
        </View>

        {/* Pintasan Kelola Menu & Langganan */}
        <SectionCard title="Kelola Dapur Anda">
          <View className="gap-2.5">
            <Pressable
              onPress={() => router.push("/(seller)/subscription")}
              className="flex-row items-center justify-between rounded-xl bg-field p-3.5"
            >
              <View className="flex-row items-center gap-3">
                <CreditCard size={18} color="#A63A00" />
                <View>
                  <Text className="text-sm font-bold text-ink">
                    Status Langganan & Gratis 30 Hari
                  </Text>
                  <Text className="text-xs text-ink-secondary">
                    Lihat masa aktif dan riwayat paket toko
                  </Text>
                </View>
              </View>
            </Pressable>

            <View className="flex-row items-center justify-between rounded-xl border border-dashed border-line bg-surface p-3.5">
              <View className="flex-row items-center gap-3">
                <UtensilsCrossed size={18} color="#64748B" />
                <View>
                  <Text className="text-sm font-bold text-ink">
                    Kelola Menu Makanan
                  </Text>
                  <Text className="text-xs text-ink-secondary">
                    Tambah, ubah stok & foto menu akan aktif di Tahap 4
                  </Text>
                </View>
              </View>
              <StatusChip label="Tahap 4" variant="sky" />
            </View>
          </View>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
