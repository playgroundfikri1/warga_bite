import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { ArrowLeft, MapPin } from "lucide-react-native";
import { hapticLight } from "../lib/haptics";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  showLogo?: boolean;
}

/**
 * Header atas seragam untuk layar WargaBite (logo/back, label komplek, judul).
 */
export function AppHeader({
  title,
  subtitle,
  onBack,
  rightSlot,
  showLogo = false,
}: AppHeaderProps) {
  return (
    <View className="flex-row items-center justify-between border-b border-line bg-surface px-4 py-3">
      <View className="flex-1 flex-row items-center gap-3">
        {onBack ? (
          <Pressable
            onPress={() => {
              hapticLight();
              onBack();
            }}
            hitSlop={10}
            android_ripple={{ color: "rgba(30,41,59,0.14)", borderless: true }}
            className="h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-field active:scale-95 active:bg-line"
          >
            <ArrowLeft size={18} color="#1E293B" />
          </Pressable>
        ) : showLogo ? (
          <Image
            source={require("../assets/icon.png")}
            className="h-9 w-9 rounded-xl"
            resizeMode="cover"
          />
        ) : null}

        <View className="flex-1">
          {subtitle ? (
            <View className="flex-row items-center gap-1">
              <MapPin size={11} color="#EA580C" />
              <Text
                numberOfLines={1}
                className="text-[11px] font-bold uppercase tracking-wide text-primary"
              >
                {subtitle}
              </Text>
            </View>
          ) : null}
          <Text numberOfLines={1} className="text-lg font-extrabold text-ink">
            {title}
          </Text>
        </View>
      </View>

      {rightSlot ? <View className="ml-2">{rightSlot}</View> : null}
    </View>
  );
}
