import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

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
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center rounded-full px-5 py-3.5 ${
        isDisabled ? "bg-status-muted/60" : "bg-cta active:bg-cta-dark"
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
      ? "border border-line bg-surface active:bg-field"
      : "bg-field active:bg-line";

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center rounded-full px-4 py-3 ${
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
