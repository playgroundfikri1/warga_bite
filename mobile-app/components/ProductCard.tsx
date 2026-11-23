import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Lock, Plus, Utensils } from "lucide-react-native";
import type { CatalogItem } from "../lib/api";
import { formatRupiah } from "../lib/format";
import { hapticLight } from "../lib/haptics";
import { StatusChip } from "./StatusChip";

interface ProductCardProps {
  item: CatalogItem;
  isPending: boolean;
  onPress: () => void;
  onQuickAdd: () => void;
}

/**
 * Kartu produk 2-kolom ala Beranda WargaBite.
 * Mode browse-only (isPending) mengunci tombol tambah ke keranjang.
 */
export function ProductCard({
  item,
  isPending,
  onPress,
  onQuickAdd,
}: ProductCardProps) {
  const canOrder = !isPending && item.is_available;

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      android_ripple={{ color: "rgba(234,88,12,0.1)" }}
      style={{
        elevation: 2,
        shadowColor: "#0F172A",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
      className="flex-1 overflow-hidden rounded-2xl bg-white active:scale-95 active:opacity-90"
    >
      <View className="relative h-32 w-full bg-field">
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Utensils size={28} color="#94A3B8" />
          </View>
        )}

        <View className="absolute left-2 top-2">
          <StatusChip
            label={item.is_available ? "Tersedia" : "Habis"}
            variant={item.is_available ? "mint" : "muted"}
            showDot
          />
        </View>
      </View>

      <View className="flex-1 justify-between p-3">
        <View>
          <Text
            numberOfLines={2}
            className="text-sm font-bold leading-snug text-ink"
          >
            {item.product_name}
          </Text>
          <Text
            numberOfLines={1}
            className="mt-0.5 text-[11px] text-ink-secondary"
          >
            {item.shop_name} • {item.complex_name}
          </Text>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-sm font-extrabold text-cta">
            {formatRupiah(item.price)}
          </Text>

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              if (canOrder) {
                hapticLight();
                onQuickAdd();
              }
            }}
            disabled={!canOrder}
            hitSlop={8}
            android_ripple={{ color: "rgba(255,255,255,0.28)", borderless: true }}
            className={`h-8 w-8 items-center justify-center overflow-hidden rounded-full ${
              canOrder
                ? "bg-cta active:scale-90 active:bg-cta-dark"
                : "bg-slate-200"
            }`}
          >
            {isPending ? (
              <Lock size={14} color="#64748B" />
            ) : (
              <Plus size={16} color={canOrder ? "#FFFFFF" : "#64748B"} />
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
