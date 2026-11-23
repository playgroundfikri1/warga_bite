import React from "react";
import { Pressable, Text, View } from "react-native";
import { hapticSelection } from "../lib/haptics";

interface CategoryPillProps {
  label: string;
  active: boolean;
  count?: number;
  onPress: () => void;
}

/**
 * Pill filter kategori horizontal (#A63A00 saat aktif, #FFFFFF saat non-aktif).
 */
export function CategoryPill({
  label,
  active,
  count,
  onPress,
}: CategoryPillProps) {
  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      android_ripple={{ color: "rgba(166,58,0,0.14)" }}
      className={`mr-2 flex-row items-center overflow-hidden rounded-full border px-3.5 py-2 active:scale-95 ${
        active
          ? "border-cta bg-cta"
          : "border-line bg-surface active:bg-field"
      }`}
    >
      <Text
        className={`text-xs font-semibold ${
          active ? "text-white" : "text-ink"
        }`}
      >
        {label}
      </Text>
      {typeof count === "number" && (
        <View
          className={`ml-1.5 rounded-full px-1.5 py-0.5 ${
            active ? "bg-white/20" : "bg-field"
          }`}
        >
          <Text
            className={`text-[10px] font-bold ${
              active ? "text-white" : "text-ink-secondary"
            }`}
          >
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
