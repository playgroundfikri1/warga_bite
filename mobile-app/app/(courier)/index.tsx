import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Truck } from "lucide-react-native";
import { SectionCard } from "../../components/SectionCard";

export default function CourierHomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-canvas p-4" edges={["bottom"]}>
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
    </SafeAreaView>
  );
}
