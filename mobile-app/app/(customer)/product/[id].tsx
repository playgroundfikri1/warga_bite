import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Lock,
  MessageCircle,
  Minus,
  Plus,
  Star,
  Store,
  Utensils,
} from "lucide-react-native";
import { AppHeader } from "../../../components/AppHeader";
import { PendingBanner } from "../../../components/Banners";
import { PrimaryButton } from "../../../components/Buttons";
import { SectionCard } from "../../../components/SectionCard";
import { StatusChip } from "../../../components/StatusChip";
import { getProductDetail, type ProductDetail } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { formatRupiah, formatWhatsAppUrl } from "../../../lib/format";
import { useAppStore } from "../../../store/useAppStore";

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isPending } = useAuth();

  const cart = useAppStore((s) => s.cart);
  const addToCart = useAppStore((s) => s.addToCart);
  const clearCart = useAppStore((s) => s.clearCart);

  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProductDetail(id)
      .then(setDetail)
      .catch((err) => {
        Alert.alert(
          "Gagal Memuat Menu",
          err instanceof Error ? err.message : "Terjadi kesalahan."
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const canOrder =
    Boolean(detail) &&
    !isPending &&
    Boolean(detail?.is_available) &&
    Boolean(detail?.is_shop_open) &&
    Boolean(detail?.seller_subscription_active);

  const handleAdd = () => {
    if (!detail || !canOrder) return;
    const shopLabel = detail.shop_name ?? "Dapur Warga";
    const payload = {
      productId: detail.product_id,
      sellerId: detail.seller_id,
      sellerComplexId: detail.complex_id,
      shopName: shopLabel,
      name: detail.product_name,
      price: detail.price,
      imageUrl: detail.image_url,
    };
    const res = addToCart(payload, qty);
    if (!res.ok && res.reason === "DIFFERENT_SELLER") {
      Alert.alert(
        "Ganti Dapur Penjual?",
        `Keranjang Anda berisi menu dari ${cart[0]?.shopName ?? "penjual lain"}. Kosongkan keranjang untuk memesan dari ${shopLabel}?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Ganti & Tambah",
            style: "destructive",
            onPress: () => {
              clearCart();
              addToCart(payload, qty);
              router.push("/(customer)/orders");
            },
          },
        ]
      );
      return;
    }

    Alert.alert("Masuk Keranjang", `${qty}x ${detail.product_name} ditambahkan.`, [
      { text: "Lanjut Lihat Menu", style: "cancel" },
      {
        text: "Lihat Keranjang",
        onPress: () => router.push("/(customer)/orders"),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      <AppHeader
        title="Detail Makanan"
        subtitle={detail?.complex_name ?? "Komplek WargaBite"}
        onBack={() => router.back()}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center bg-canvas">
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      ) : !detail ? (
        <View className="flex-1 items-center justify-center bg-canvas px-6">
          <Text className="text-base font-bold text-ink">
            Menu tidak ditemukan atau tidak tersedia
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1 bg-canvas"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Foto produk */}
            <View className="h-60 w-full bg-field">
              {detail.image_url ? (
                <Image
                  source={{ uri: detail.image_url }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Utensils size={48} color="#94A3B8" />
                </View>
              )}
            </View>

            <View className="gap-4 p-4">
              {isPending && <PendingBanner />}

              {/* Info utama makanan */}
              <SectionCard>
                <View className="flex-row items-center justify-between gap-2">
                  <StatusChip
                    label={detail.is_available ? "Tersedia" : "Stok Habis"}
                    variant={detail.is_available ? "mint" : "muted"}
                    showDot
                  />
                  {detail.rating_count > 0 && detail.rating_avg != null && (
                    <View className="flex-row items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1">
                      <Star size={13} color="#D97706" fill="#D97706" />
                      <Text className="text-xs font-bold text-amber-900">
                        {detail.rating_avg.toFixed(1)} ({detail.rating_count})
                      </Text>
                    </View>
                  )}
                </View>

                <Text className="mt-3 text-xl font-extrabold text-ink">
                  {detail.product_name}
                </Text>
                <Text className="mt-1 text-xl font-extrabold text-cta">
                  {formatRupiah(detail.price)}
                </Text>

                {detail.description ? (
                  <Text className="mt-3 text-sm leading-relaxed text-ink-secondary">
                    {detail.description}
                  </Text>
                ) : null}
              </SectionCard>

              {/* Info dapur penjual */}
              <SectionCard
                title={detail.shop_name ?? "Dapur Warga"}
                subtitle={detail.complex_name}
                rightElement={
                  <StatusChip
                    label={detail.is_shop_open ? "Toko Buka" : "Toko Tutup"}
                    variant={detail.is_shop_open ? "mint" : "muted"}
                    showDot
                  />
                }
              >
                {detail.shop_description ? (
                  <Text className="mb-3 text-xs leading-relaxed text-ink-secondary">
                    {detail.shop_description}
                  </Text>
                ) : null}

                {/* Guardrail Browse-Only: blok rumah & WA tidak dirender jika pending */}
                {isPending ? (
                  <View className="flex-row items-center gap-2.5 rounded-xl bg-field p-3">
                    <Lock size={16} color="#D97706" />
                    <Text className="flex-1 text-xs text-ink-secondary">
                      Blok rumah dan tombol WhatsApp penjual terkunci sampai akun
                      Anda diverifikasi pengurus komplek.
                    </Text>
                  </View>
                ) : (
                  <View className="gap-2.5">
                    {detail.seller_house_block ? (
                      <View className="flex-row items-center gap-2 rounded-xl bg-field px-3 py-2.5">
                        <Store size={16} color="#EA580C" />
                        <Text className="text-xs font-semibold text-ink">
                          Lokasi Dapur: {detail.seller_house_block}
                        </Text>
                      </View>
                    ) : null}

                    {detail.seller_phone ? (
                      <Pressable
                        onPress={() =>
                          Linking.openURL(
                            formatWhatsAppUrl(
                              detail.seller_phone!,
                              `Halo ${detail.shop_name}, saya ingin bertanya tentang menu ${detail.product_name} di WargaBite.`
                            )
                          )
                        }
                        className="flex-row items-center justify-center gap-2 rounded-full border border-emerald-600 bg-emerald-50 py-2.5"
                      >
                        <MessageCircle size={16} color="#065F46" />
                        <Text className="text-xs font-bold text-chip-mintText">
                          Chat Penjual via WhatsApp
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                )}
              </SectionCard>
            </View>
          </ScrollView>

          {/* Sticky bottom action bar */}
          <View className="flex-row items-center gap-3 border-t border-line bg-surface px-4 py-3">
            <View className="flex-row items-center rounded-full border border-line bg-field px-2 py-1">
              <Pressable
                onPress={() => setQty((q) => Math.max(1, q - 1))}
                disabled={!canOrder}
                className="h-8 w-8 items-center justify-center rounded-full bg-surface"
              >
                <Minus size={15} color="#1E293B" />
              </Pressable>
              <Text className="w-8 text-center text-sm font-extrabold text-ink">
                {qty}
              </Text>
              <Pressable
                onPress={() => setQty((q) => q + 1)}
                disabled={!canOrder}
                className="h-8 w-8 items-center justify-center rounded-full bg-surface"
              >
                <Plus size={15} color="#1E293B" />
              </Pressable>
            </View>

            <View className="flex-1">
              <PrimaryButton
                title={
                  isPending
                    ? "Menunggu Verifikasi"
                    : !detail.is_available
                      ? "Stok Habis"
                      : !detail.is_shop_open
                        ? "Toko Sedang Tutup"
                        : `Tambah • ${formatRupiah(detail.price * qty)}`
                }
                onPress={handleAdd}
                disabled={!canOrder}
              />
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
