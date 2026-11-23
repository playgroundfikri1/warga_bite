import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeftRight, Building2, Plus } from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { PrimaryButton } from "../../components/Buttons";
import { SearchBar } from "../../components/SearchBar";
import { SectionCard } from "../../components/SectionCard";
import { StatusChip } from "../../components/StatusChip";
import { listComplexes } from "../../lib/api";
import { useAppStore } from "../../store/useAppStore";
import type { Complex } from "../../types/database";

export default function AdminComplexesScreen() {
  const router = useRouter();
  const setActiveRole = useAppStore((s) => s.setActiveRole);

  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await listComplexes();
      setComplexes(data);
    } catch (err) {
      Alert.alert(
        "Gagal Memuat Komplek",
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = complexes.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <AppHeader
        title="Kelola Komplek"
        subtitle="Mode Admin Komplek"
        showLogo
        rightSlot={
          <Pressable
            onPress={() => {
              setActiveRole("customer");
              router.replace("/(customer)");
            }}
            className="flex-row items-center gap-1.5 rounded-full bg-field px-3 py-2"
          >
            <ArrowLeftRight size={14} color="#A63A00" />
            <Text className="text-xs font-bold text-cta">Mode Warga</Text>
          </Pressable>
        }
      />

      <View className="flex-1 bg-canvas p-4">
        <View className="mb-3 gap-3">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Cari nama komplek..."
          />
          <PrimaryButton
            title="Tambah Komplek Baru"
            onPress={() => router.push("/(admin)/add-complex")}
            icon={<Plus size={18} color="#FFFFFF" />}
          />
        </View>

        {loading ? (
          <ActivityIndicator color="#EA580C" className="mt-10" />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  load();
                }}
                tintColor="#EA580C"
              />
            }
            ListEmptyComponent={
              <SectionCard>
                <Text className="text-center text-sm text-ink-secondary">
                  Belum ada komplek terdaftar.
                </Text>
              </SectionCard>
            }
            renderItem={({ item }) => (
              <SectionCard>
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1 flex-row items-start gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-chip-peach">
                      <Building2 size={20} color="#A63A00" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-extrabold text-ink">
                        {item.name}
                      </Text>
                      {item.address ? (
                        <Text className="mt-0.5 text-xs text-ink-secondary">
                          {item.address}
                        </Text>
                      ) : null}
                      <Text className="mt-1 text-[11px] text-ink-secondary">
                        Kode Pos: {item.postal_code} • Radius{" "}
                        {item.max_delivery_radius_km} km
                      </Text>
                    </View>
                  </View>
                  <StatusChip
                    label={item.is_courier_enabled ? "Kurir Aktif" : "Ambil Sendiri"}
                    variant={item.is_courier_enabled ? "mint" : "muted"}
                    showDot
                  />
                </View>
              </SectionCard>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
