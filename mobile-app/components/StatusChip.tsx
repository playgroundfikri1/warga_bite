import React from "react";
import { Text, View } from "react-native";

export type ChipVariant =
  | "mint"
  | "peach"
  | "sky"
  | "warning"
  | "danger"
  | "muted";

const VARIANT_STYLES: Record<
  ChipVariant,
  { bg: string; text: string; dot: string }
> = {
  mint: {
    bg: "bg-chip-mint/70",
    text: "text-chip-mintText",
    dot: "bg-status-success",
  },
  peach: {
    bg: "bg-chip-peach",
    text: "text-cta",
    dot: "bg-primary",
  },
  sky: {
    bg: "bg-chip-sky",
    text: "text-chip-skyText",
    dot: "bg-chip-skyText",
  },
  warning: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    dot: "bg-status-warning",
  },
  danger: {
    bg: "bg-red-100",
    text: "text-red-800",
    dot: "bg-status-danger",
  },
  muted: {
    bg: "bg-slate-100",
    text: "text-ink-secondary",
    dot: "bg-status-muted",
  },
};

interface StatusChipProps {
  label: string;
  variant?: ChipVariant;
  showDot?: boolean;
  className?: string;
}

/**
 * Pill status ringkas bergaya WargaBite (mint, peach, sky, warning, danger).
 */
export function StatusChip({
  label,
  variant = "mint",
  showDot = false,
  className = "",
}: StatusChipProps) {
  const s = VARIANT_STYLES[variant];
  return (
    <View
      className={`flex-row items-center self-start rounded-full px-2.5 py-1 ${s.bg} ${className}`}
    >
      {showDot && <View className={`mr-1.5 h-1.5 w-1.5 rounded-full ${s.dot}`} />}
      <Text className={`text-[11px] font-semibold ${s.text}`}>{label}</Text>
    </View>
  );
}
