import React from "react";
import { Text, View } from "react-native";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Kartu permukaan putih dengan border tipis #E2E8F0 dan radius besar.
 */
export function SectionCard({
  title,
  subtitle,
  rightElement,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <View
      className={`rounded-2xl border border-line bg-surface p-4 shadow-sm ${className}`}
    >
      {(title || rightElement) && (
        <View className="mb-3 flex-row items-center justify-between gap-2">
          <View className="flex-1">
            {title && (
              <Text className="text-base font-bold text-ink">{title}</Text>
            )}
            {subtitle && (
              <Text className="mt-0.5 text-xs text-ink-secondary">
                {subtitle}
              </Text>
            )}
          </View>
          {rightElement}
        </View>
      )}
      {children}
    </View>
  );
}
