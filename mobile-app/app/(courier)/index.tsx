import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeftRight, Truck } from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { SectionCard } from "../../components/SectionCard";
import { useAuth } from "../../lib/auth-context";
import { useAppStore } from "../../store/useAppStore";

export default function CourierHomeScreen() {
  const router = useRouter();
  const { complex } = useAuth();
  const setActiveRole = useAppStore((s) => s.setActiveRole);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <AppHeader
        title="Tugas Kurir Komplek"
        subtitle={complex?.name ?? "Komplek WargaBite"}
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
        <SectionCard>
          <View className="items-center py-6">
            <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-chip-mint/60">
              <Truck size={26} color="#065F46" />
            </View>
            <Text className="text-base font-bold text-ink">
              Mode Kurir Komplek Siap di Tahap 4
            </Text>
            <Text className="mt-1 text-center text-xs leading-relaxed text-ink-secondary">
              Daftar antaran, scan QR / input kode serah terima, dan unggah foto
              bukti makanan & rumah pembeli akan aktif di Tahap 4.
            </Text>
          </View>
        </SectionCard>
      </View>
    </SafeAreaView>
  );
}
