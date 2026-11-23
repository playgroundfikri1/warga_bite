import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { hapticLight } from "../lib/haptics";

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Tombol aksi utama WargaBite (terracotta gelap #A63A00, sudut penuh).
 */
export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  className = "",
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      disabled={isDisabled}
      android_ripple={{ color: "rgba(255,255,255,0.22)" }}
      className={`flex-row items-center justify-center overflow-hidden rounded-full px-5 py-3.5 ${
        isDisabled
          ? "bg-status-muted/60"
          : "bg-cta active:scale-[0.98] active:bg-cta-dark"
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-bold text-white">{title}</Text>
          {icon}
        </View>
      )}
    </Pressable>
  );
}

/**
 * Tombol sekunder lembut (#EEF2FF atau outline putih).
 */
export function SecondaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  variant = "field",
  className = "",
}: ButtonProps & { variant?: "field" | "outline" }) {
  const isDisabled = disabled || loading;
  const baseStyle =
    variant === "outline"
      ? "border border-line bg-surface active:scale-[0.98] active:bg-field"
      : "bg-field active:scale-[0.98] active:bg-line";

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      disabled={isDisabled}
      android_ripple={{ color: "rgba(166,58,0,0.12)" }}
      className={`flex-row items-center justify-center overflow-hidden rounded-full px-4 py-3 ${
        isDisabled ? "opacity-50" : baseStyle
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color="#A63A00" size="small" />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className="text-sm font-semibold text-ink">{title}</Text>
        </View>
      )}
    </Pressable>
  );
}
