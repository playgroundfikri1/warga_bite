import React, { useEffect, useRef } from "react";
import { Animated, View, type ViewStyle } from "react-native";

interface SkeletonBoxProps {
  className?: string;
  style?: ViewStyle;
}

/**
 * Blok skeleton dengan animasi pulse lembut.
 */
export function SkeletonBox({ className = "", style }: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ opacity }, style]}
      className={`rounded-xl bg-slate-200/80 ${className}`}
    />
  );
}

/**
 * Skeleton grid 2-kolom untuk Beranda Katalog WargaBite.
 */
export function CatalogSkeleton() {
  return (
    <View className="flex-1 p-4">
      <SkeletonBox className="mb-3 h-11 w-full rounded-full" />
      <View className="mb-4 flex-row gap-2">
        <SkeletonBox className="h-8 w-20 rounded-full" />
        <SkeletonBox className="h-8 w-28 rounded-full" />
        <SkeletonBox className="h-8 w-24 rounded-full" />
      </View>

      {[0, 1].map((row) => (
        <View key={row} className="mb-3 flex-row gap-3">
          {[0, 1].map((col) => (
            <View
              key={col}
              className="flex-1 overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              <SkeletonBox className="h-32 w-full rounded-none" />
              <View className="gap-2 p-3">
                <SkeletonBox className="h-4 w-4/5" />
                <SkeletonBox className="h-3 w-3/5" />
                <View className="mt-2 flex-row items-center justify-between">
                  <SkeletonBox className="h-4 w-1/2" />
                  <SkeletonBox className="h-8 w-8 rounded-full" />
                </View>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton daftar kartu (Daftar Komplek, Riwayat Langganan, Pesanan).
 */
export function ListCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View className="gap-2.5">
      {Array.from({ length: count }).map((_, idx) => (
        <View
          key={idx}
          className="gap-2 rounded-2xl bg-white p-4 shadow-sm"
        >
          <View className="flex-row items-center justify-between">
            <SkeletonBox className="h-4 w-1/2" />
            <SkeletonBox className="h-5 w-16 rounded-full" />
          </View>
          <SkeletonBox className="h-3 w-4/5" />
          <SkeletonBox className="h-3 w-2/5" />
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton detail produk makanan.
 */
export function ProductDetailSkeleton() {
  return (
    <View className="flex-1 bg-canvas">
      <SkeletonBox className="h-64 w-full rounded-none" />
      <View className="gap-4 p-4">
        <View className="gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <SkeletonBox className="h-5 w-3/4" />
          <SkeletonBox className="h-6 w-1/3" />
          <SkeletonBox className="mt-2 h-3 w-full" />
          <SkeletonBox className="h-3 w-4/5" />
        </View>
        <View className="gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <SkeletonBox className="h-4 w-1/2" />
          <SkeletonBox className="h-3 w-2/3" />
        </View>
      </View>
    </View>
  );
}
