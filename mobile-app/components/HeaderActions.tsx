import React from "react";
import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowLeftRight } from "lucide-react-native";
import { hapticLight } from "../lib/haptics";
import { useAppStore } from "../store/useAppStore";

/**
 * Tombol header kanan untuk kembali ke Mode Warga dari Admin/Seller/Kurir.
 */
export function HeaderModeWargaButton() {
  const router = useRouter();
  const setActiveRole = useAppStore((s) => s.setActiveRole);

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        setActiveRole("customer");
        router.replace("/(customer)");
      }}
      android_ripple={{ color: "rgba(166,58,0,0.12)" }}
      className="mr-1 flex-row items-center gap-1.5 overflow-hidden rounded-full bg-field px-3.5 py-2 active:scale-95"
    >
      <ArrowLeftRight size={14} color="#A63A00" />
      <Text className="text-xs font-bold text-cta">Mode Warga</Text>
    </Pressable>
  );
}

/**
 * Tombol kembali native di header untuk layar tersembunyi di dalam Tabs.
 */
export function HeaderBackButton() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        router.back();
      }}
      hitSlop={10}
      android_ripple={{ color: "rgba(30,41,59,0.12)", borderless: true }}
      className="ml-2 h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-field active:scale-95"
    >
      <ArrowLeft size={18} color="#1E293B" />
    </Pressable>
  );
}
