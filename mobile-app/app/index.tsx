import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IndexScreen() {
  return (
    <SafeAreaView className="flex-1 bg-canvas items-center justify-center px-6">
      <View className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 items-center">
        <View className="h-16 w-16 rounded-2xl bg-primary items-center justify-center mb-4">
          <Text className="text-white text-2xl font-bold">WB</Text>
        </View>
        <Text className="text-xl font-bold text-ink text-center">
          WargaBite — Jajan di Komplek Sendiri
        </Text>
        <Text className="text-sm text-ink-secondary text-center mt-2">
          Fondasi Tahap 1 siap (Light Mode Only • Warm Terracotta Orange #EA580C).
        </Text>
      </View>
    </SafeAreaView>
  );
}
