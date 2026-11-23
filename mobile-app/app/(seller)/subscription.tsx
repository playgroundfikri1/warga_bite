import React, { useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const { profile } = useAuth();
  const [rows, setRows] = useState<SellerSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSubscriptions = () => {
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
  };

  useEffect(() => {
    loadSubscriptions();
  }, [profile?.id]);

  const subView = profile ? getSubscriptionView(profile) : { kind: "none" as const };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["bottom"]}>
      <FlatList
        data={loading ? [] : rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              hapticLight();
              setLoading(true);
              loadSubscriptions();
            }}
            colors={["#EA580C"]}
            tintColor="#EA580C"
          />
        }
        ListHeaderComponent={
          <View className="gap-4">
            <SubscriptionBanner view={subView} />
            <SectionCard
              title="Perpanjangan Langganan"
              subtitle="Dikelola melalui Admin Komplek / Web Admin"
            >
              <Text className="text-xs leading-relaxed text-ink-secondary">
                Setiap penjual baru otomatis mendapat masa uji coba gratis 30
                hari. Jika masa aktif hampir habis atau berakhir, hubungi
                Pengurus / Admin Komplek Anda untuk memperpanjang masa aktif
                toko.
              </Text>
            </SectionCard>
            <Text className="px-1 text-sm font-bold text-ink">
              Riwayat Paket Langganan
            </Text>
            {loading && <ListCardSkeleton count={2} />}
          </View>
        }
        renderItem={({ item }) => {
          const isActive = new Date(item.ends_at).getTime() > Date.now();
          return (
            <View
              style={{
                elevation: 2,
                shadowColor: "#0F172A",
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
              className="rounded-2xl bg-white p-4"
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
              <Text className="mt-1.5 text-xs text-ink-secondary">
                Berlaku: {new Date(item.starts_at).toLocaleDateString("id-ID")}{" "}
                s/d {new Date(item.ends_at).toLocaleDateString("id-ID")}
              </Text>
              <Text className="mt-1 text-xs font-semibold text-cta">
                Biaya: {formatRupiah(item.amount_paid)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <SectionCard>
              <Text className="text-xs text-ink-secondary">
                Belum ada catatan langganan.
              </Text>
            </SectionCard>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}
