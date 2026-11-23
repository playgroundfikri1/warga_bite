import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChefHat,
  MapPin,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { PendingBanner } from "../../components/Banners";
import { CategoryPill } from "../../components/CategoryPill";
import { ProductCard } from "../../components/ProductCard";
import { SearchBar } from "../../components/SearchBar";
import { CatalogSkeleton } from "../../components/Skeleton";
import { StatusChip } from "../../components/StatusChip";
import { type CatalogItem, listCatalog } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { useAppStore } from "../../store/useAppStore";
import type { ProductCategory } from "../../types/database";

const CATEGORIES: Array<{ key: "all" | ProductCategory; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "Makanan Berat", label: "Makanan Berat" },
  { key: "Jajanan", label: "Jajanan & Snack" },
  { key: "Minuman", label: "Minuman" },
  { key: "Lainnya", label: "Lainnya" },
];

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { profile, complex, isPending } = useAuth();
  const cart = useAppStore((s) => s.cart);
  const addToCart = useAppStore((s) => s.addToCart);
  const clearCart = useAppStore((s) => s.clearCart);

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | ProductCategory>("all");

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const fetchCatalog = useCallback(async () => {
    if (!profile?.complex_id) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const data = await listCatalog(profile.complex_id);
      setItems(data);
    } catch (err) {
      Alert.alert(
        "Gagal Memuat Katalog",
        err instanceof Error ? err.message : "Periksa koneksi internet Anda."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.complex_id]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchCategory = category === "all" || item.category === category;
      const matchQuery =
        !q ||
        item.product_name.toLowerCase().includes(q) ||
        (item.shop_name ?? "").toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [items, category, query]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const item of items) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const handleQuickAdd = (item: CatalogItem) => {
    if (isPending) return;
    const shopLabel = item.shop_name ?? "Dapur Warga";
    const payload = {
      productId: item.product_id,
      sellerId: item.seller_id,
      sellerComplexId: profile?.complex_id ?? "",
      shopName: shopLabel,
      name: item.product_name,
      price: item.price,
      imageUrl: item.image_url,
    };
    const res = addToCart(payload, 1);
    if (!res.ok && res.reason === "DIFFERENT_SELLER") {
      Alert.alert(
        "Ganti Dapur Penjual?",
        `Keranjang Anda berisi menu dari ${cart[0]?.shopName ?? "penjual lain"}. Kosongkan keranjang untuk memesan dari ${shopLabel}?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Ganti Keranjang",
            style: "destructive",
            onPress: () => {
              clearCart();
              addToCart(payload, 1);
              hapticSuccess();
            },
          },
        ]
      );
      return;
    }
    hapticSuccess();
  };

  const firstName = profile?.full_name?.split(" ")[0] ?? "Warga";

  const renderHeader = () => (
    <View className="gap-4 pb-3">
      {/* Sapaan & alamat antar */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-2xl font-extrabold text-ink">
            Halo, {firstName}!
          </Text>
          <View className="mt-1 flex-row items-center gap-1.5">
            <MapPin size={13} color="#EA580C" />
            <Text
              numberOfLines={1}
              className="text-xs font-semibold text-ink-secondary"
            >
              Antar ke:{" "}
              <Text className="font-bold text-ink">
                {profile?.house_block || "Alamat belum diisi"}
              </Text>
            </Text>
          </View>
        </View>
        <StatusChip
          label={isPending ? "Mode Lihat" : "Dapur Aktif"}
          variant={isPending ? "warning" : "mint"}
          showDot
        />
      </View>

      {isPending && <PendingBanner />}

      <SearchBar value={query} onChangeText={setQuery} />

      {/* Filter kategori horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 2 }}
      >
        {CATEGORIES.map((cat) => (
          <CategoryPill
            key={cat.key}
            label={cat.label}
            active={category === cat.key}
            count={categoryCounts[cat.key] ?? 0}
            onPress={() => setCategory(cat.key)}
          />
        ))}
      </ScrollView>

      {/* Banner hangat komplek */}
      <View className="overflow-hidden rounded-2xl bg-primary p-4 shadow-sm">
        <View className="flex-row items-center gap-1.5">
          <Sparkles size={14} color="#FFEDD5" />
          <Text className="text-[11px] font-bold uppercase tracking-wider text-primary-soft">
            Kuliner Tetangga Komplek
          </Text>
        </View>
        <Text className="mt-1 text-base font-extrabold text-white">
          Hangat, Higienis & Tanpa Ongkir Jauh
        </Text>
        <Text className="mt-0.5 text-xs text-white/90">
          Semua menu dimasak langsung oleh warga {complex?.name ?? "komplek Anda"}.
        </Text>
      </View>

      <View className="flex-row items-center justify-between pt-1">
        <Text className="text-base font-extrabold text-ink">
          Menu Hangat Terdekat
        </Text>
        <Text className="text-xs font-semibold text-ink-secondary">
          {filteredItems.length} menu
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => (
    <Pressable
      onPress={() => router.push("/(customer)/profile")}
      className="mt-4 flex-row items-center gap-3 rounded-2xl border border-line bg-field p-4"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-chip-mint/60">
        <ChefHat size={22} color="#065F46" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-ink">
          Punya masakan andalan?
        </Text>
        <Text className="mt-0.5 text-xs text-ink-secondary">
          Buka dapur rumah Anda dengan Gratis 30 Hari untuk melayani tetangga.
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <AppHeader
        title="Beranda"
        subtitle={complex?.name ?? "Komplek WargaBite"}
        showLogo
        rightSlot={
          <Pressable
            onPress={() => router.push("/(customer)/orders")}
            className="relative h-10 w-10 items-center justify-center rounded-full bg-field"
          >
            <ShoppingBag size={19} color="#1E293B" />
            {cartCount > 0 && (
              <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-cta px-1">
                <Text className="text-[10px] font-extrabold text-white">
                  {cartCount}
                </Text>
              </View>
            )}
          </Pressable>
        }
      />

      <View className="flex-1 bg-canvas">
        {loading ? (
          <CatalogSkeleton />
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.product_id}
            numColumns={2}
            columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  hapticLight();
                  setRefreshing(true);
                  fetchCatalog();
                }}
                colors={["#EA580C"]}
                tintColor="#EA580C"
              />
            }
            ListEmptyComponent={
              <View className="items-center rounded-2xl border border-line bg-surface p-8">
                <UtensilsCrossed size={32} color="#94A3B8" />
                <Text className="mt-3 text-sm font-bold text-ink">
                  Belum ada menu ditemukan
                </Text>
                <Text className="mt-1 text-center text-xs text-ink-secondary">
                  Coba ubah kata kunci pencarian atau tunggu dapur warga di
                  komplek Anda membuka pesanan.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ProductCard
                item={item}
                isPending={isPending}
                onPress={() =>
                  router.push(`/(customer)/product/${item.product_id}`)
                }
                onQuickAdd={() => handleQuickAdd(item)}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
