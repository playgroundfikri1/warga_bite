import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Minus, Plus, ReceiptText, Trash2 } from "lucide-react-native";
import { BottomSheetModal } from "../../../components/BottomSheetModal";
import { PrimaryButton, SecondaryButton } from "../../../components/Buttons";
import { SectionCard } from "../../../components/SectionCard";
import { StatusChip } from "../../../components/StatusChip";
import { useAuth } from "../../../lib/auth-context";
import { formatRupiah } from "../../../lib/format";
import { hapticLight, hapticSuccess } from "../../../lib/haptics";
import { useAppStore } from "../../../store/useAppStore";

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const { isPending, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const cart = useAppStore((s) => s.cart);
  const updateQuantity = useAppStore((s) => s.updateQuantity);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const clearCart = useAppStore((s) => s.clearCart);
  const getCartTotal = useAppStore((s) => s.getCartTotal);

  const total = getCartTotal();

  const handleRefresh = async () => {
    hapticLight();
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <FlatList
        data={cart}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#EA580C"]}
            tintColor="#EA580C"
          />
        }
        ListHeaderComponent={
          cart.length > 0 ? (
            <SectionCard
              title={`Keranjang • ${cart[0].shopName}`}
              subtitle="Metode pembayaran: Bayar Tunai di Tempat (COD)"
              rightElement={<StatusChip label="COD" variant="peach" />}
            >
              <Text className="text-xs text-ink-secondary">
                Pastikan jumlah porsi sudah sesuai sebelum melanjutkan Checkout
                COD.
              </Text>
            </SectionCard>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View
            style={{
              elevation: 2,
              shadowColor: "#0F172A",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
            }}
            className="flex-row items-center justify-between rounded-2xl bg-white p-4"
          >
            <View className="flex-1 pr-3">
              <Text className="text-sm font-bold text-ink">{item.name}</Text>
              <Text className="mt-1 text-xs font-semibold text-cta">
                {formatRupiah(item.price)}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => {
                  hapticLight();
                  updateQuantity(item.productId, item.quantity - 1);
                }}
                android_ripple={{ color: "rgba(30,41,59,0.12)", borderless: true }}
                className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-field active:scale-95"
              >
                <Minus size={16} color="#1E293B" />
              </Pressable>
              <Text className="w-6 text-center text-sm font-bold text-ink">
                {item.quantity}
              </Text>
              <Pressable
                onPress={() => {
                  hapticLight();
                  updateQuantity(item.productId, item.quantity + 1);
                }}
                android_ripple={{ color: "rgba(30,41,59,0.12)", borderless: true }}
                className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-field active:scale-95"
              >
                <Plus size={16} color="#1E293B" />
              </Pressable>
              <Pressable
                onPress={() => {
                  hapticLight();
                  removeFromCart(item.productId);
                }}
                android_ripple={{ color: "rgba(220,38,38,0.12)", borderless: true }}
                className="ml-1 h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-red-50 active:scale-95"
              >
                <Trash2 size={16} color="#DC2626" />
              </Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={
          cart.length > 0 ? (
            <SectionCard>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-ink-secondary">
                  Total Sementara
                </Text>
                <Text className="text-lg font-extrabold text-cta">
                  {formatRupiah(total)}
                </Text>
              </View>

              <View className="mt-4 gap-3">
                <PrimaryButton
                  title={
                    isPending
                      ? "Akun Menunggu Verifikasi"
                      : "Checkout COD (Aktif di Tahap 4)"
                  }
                  onPress={() => {}}
                  disabled
                />
                <SecondaryButton
                  title="Kosongkan Keranjang"
                  onPress={() => setConfirmClearOpen(true)}
                  variant="outline"
                />
              </View>
            </SectionCard>
          ) : undefined
        }
        ListEmptyComponent={
          <SectionCard>
            <View className="items-center py-6">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-field">
                <ReceiptText size={26} color="#A63A00" />
              </View>
              <Text className="text-base font-bold text-ink">
                Belum Ada Pesanan Aktif
              </Text>
              <Text className="mt-1 text-center text-xs leading-relaxed text-ink-secondary">
                Pilih makanan hangat dari tetangga di Beranda. Alur Checkout COD,
                QR Serah Terima, dan Riwayat Pesanan lengkap akan aktif di Tahap 4.
              </Text>
              <View className="mt-4 w-full">
                <PrimaryButton
                  title="Jelajahi Menu Komplek"
                  onPress={() => router.push("/(customer)")}
                />
              </View>
            </View>
          </SectionCard>
        }
      />

      <BottomSheetModal
        visible={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        title="Kosongkan Keranjang?"
        subtitle="Semua menu di keranjang sementara akan dihapus."
      >
        <View className="gap-3 pb-2">
          <PrimaryButton
            title="Ya, Kosongkan Keranjang"
            onPress={() => {
              clearCart();
              hapticSuccess();
              setConfirmClearOpen(false);
            }}
          />
          <SecondaryButton
            title="Batal"
            variant="outline"
            onPress={() => setConfirmClearOpen(false)}
          />
        </View>
      </BottomSheetModal>
    </View>
  );
}
