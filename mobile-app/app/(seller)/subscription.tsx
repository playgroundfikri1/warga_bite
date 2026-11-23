import React, { useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../components/AppHeader";
import { SubscriptionBanner } from "../../components/Banners";
import { SectionCard } from "../../components/SectionCard";
import { ListCardSkeleton } from "../../components/Skeleton";
import { StatusChip } from "../../components/StatusChip";
import { getSubscriptionView, listMySubscriptions } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { formatRupiah } from "../../lib/format";
import { hapticLight } from "../../lib/haptics";
import type { SellerSubscription } from "../../types/database";

const PLAN_LABELS: Record<SellerSubscription["plan_type"], string> = {
  trial_30d: "Gratis 30 Hari (Trial)",
  monthly: "Paket Bulanan",
  custom: "Paket Khusus",
};

export default function SellerSubscriptionScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [rows, setRows] = useState<SellerSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    listMySubscriptions(profile.id)
      .then(setRows)
      .catch((err) =>
        Alert.alert(
          "Gagal Memuat Langganan",
          err instanceof Error ? err.message : "Terjadi kesalahan."
        )
      )
      .finally(() => setLoading(false));
  }, [profile?.id]);

  const subView = profile ? getSubscriptionView(profile) : { kind: "none" as const };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      <AppHeader
        title="Langganan Toko"
        subtitle={profile?.shop_name ?? "Penjual WargaBite"}
        onBack={() => router.back()}
      />

      <ScrollView
        className="flex-1 bg-canvas"
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              if (!profile?.id) return;
              hapticLight();
              setLoading(true);
              listMySubscriptions(profile.id)
                .then(setRows)
                .finally(() => setLoading(false));
            }}
            colors={["#EA580C"]}
            tintColor="#EA580C"
          />
        }
      >
        <SubscriptionBanner view={subView} />

        <SectionCard
          title="Perpanjangan Langganan"
          subtitle="Dikelola melalui Admin Komplek / Web Admin"
        >
          <Text className="text-xs leading-relaxed text-ink-secondary">
            Setiap penjual baru otomatis mendapat masa uji coba gratis 30 hari.
            Jika masa aktif hampir habis atau berakhir, hubungi Pengurus / Admin
            Komplek Anda untuk memperpanjang masa aktif toko.
          </Text>
        </SectionCard>

        <SectionCard title="Riwayat Paket Langganan">
          {loading ? (
            <ListCardSkeleton count={2} />
          ) : rows.length === 0 ? (
            <Text className="text-xs text-ink-secondary">
              Belum ada catatan langganan.
            </Text>
          ) : (
            <View className="gap-3">
              {rows.map((item) => {
                const isActive = new Date(item.ends_at).getTime() > Date.now();
                return (
                  <View
                    key={item.id}
                    className="rounded-xl border border-line bg-field p-3"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-bold text-ink">
                        {PLAN_LABELS[item.plan_type]}
                      </Text>
                      <StatusChip
                        label={isActive ? "Aktif" : "Berakhir"}
                        variant={isActive ? "mint" : "danger"}
                      />
                    </View>
                    <Text className="mt-1 text-xs text-ink-secondary">
                      Berlaku:{" "}
                      {new Date(item.starts_at).toLocaleDateString("id-ID")} s/d{" "}
                      {new Date(item.ends_at).toLocaleDateString("id-ID")}
                    </Text>
                    <Text className="mt-0.5 text-xs font-semibold text-cta">
                      Biaya: {formatRupiah(item.amount_paid)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
