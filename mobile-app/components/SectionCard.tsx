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
 * Kartu permukaan putih bersih dengan shadow/elevation halus di atas latar #F8FAFC.
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
      style={{
        elevation: 2,
        shadowColor: "#0F172A",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
      className={`rounded-2xl bg-white p-4 ${className}`}
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
