import React, { type ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { hapticLight } from "../lib/haptics";

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxHeightPercent?: number;
}

/**
 * Bottom Sheet khas mobile (muncul dari bawah layar dengan handle bar & sudut membulat).
 */
export function BottomSheetModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: BottomSheetModalProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/45">
        <Pressable
          className="flex-1"
          onPress={() => {
            hapticLight();
            onClose();
          }}
        />
        <View
          style={{ paddingBottom: bottomPad, maxHeight: "85%" }}
          className="rounded-t-3xl bg-surface pt-3 shadow-xl"
        >
          {/* Handle bar kecil */}
          <View className="mb-2 items-center">
            <View className="h-1.5 w-12 rounded-full bg-slate-300" />
          </View>

          {/* Header sheet */}
          <View className="flex-row items-center justify-between border-b border-line px-5 pb-3">
            <View className="flex-1 pr-3">
              <Text className="text-base font-extrabold text-ink">{title}</Text>
              {subtitle ? (
                <Text className="mt-0.5 text-xs text-ink-secondary">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => {
                hapticLight();
                onClose();
              }}
              hitSlop={10}
              android_ripple={{ color: "rgba(30,41,59,0.12)", borderless: true }}
              className="h-8 w-8 items-center justify-center rounded-full bg-field active:scale-95"
            >
              <X size={16} color="#1E293B" />
            </Pressable>
          </View>

          <View className="px-5 pt-3">{children}</View>
        </View>
      </View>
    </Modal>
  );
}
