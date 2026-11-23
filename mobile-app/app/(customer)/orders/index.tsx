import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Minus, Plus, ReceiptText, Trash2 } from "lucide-react-native";
import { AppHeader } from "../../../components/AppHeader";
import { PrimaryButton, SecondaryButton } from "../../../components/Buttons";
import { SectionCard } from "../../../components/SectionCard";
import { StatusChip } from "../../../components/StatusChip";
import { useAuth } from "../../../lib/auth-context";
import { formatRupiah } from "../../../lib/format";
import { useAppStore } from "../../../store/useAppStore";

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const { complex, isPending } = useAuth();
  const cart = useAppStore((s) => s.cart);
  const updateQuantity = useAppStore((s) => s.updateQuantity);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const clearCart = useAppStore((s) => s.clearCart);
  const getCartTotal = useAppStore((s) => s.getCartTotal);

  const total = getCartTotal();

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <AppHeader
        title="Pesanan & Keranjang"
        subtitle={complex?.name ?? "Komplek WargaBite"}
      />

      <ScrollView
        className="flex-1 bg-canvas"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      >
        {cart.length > 0 ? (
          <SectionCard
            title={`Keranjang • ${cart[0].shopName}`}
            subtitle="Metode pembayaran: Bayar Tunai di Tempat (COD)"
            rightElement={<StatusChip label="COD" variant="peach" />}
          >
            <View className="gap-3">
              {cart.map((item) => (
                <View
                  key={item.productId}
                  className="flex-row items-center justify-between border-b border-line pb-3 last:border-b-0 last:pb-0"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-sm font-bold text-ink">
                      {item.name}
                    </Text>
                    <Text className="mt-0.5 text-xs font-semibold text-cta">
                      {formatRupiah(item.price)}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      className="h-7 w-7 items-center justify-center rounded-full bg-field"
                    >
                      <Minus size={14} color="#1E293B" />
                    </Pressable>
                    <Text className="w-5 text-center text-xs font-bold text-ink">
                      {item.quantity}
                    </Text>
                    <Pressable
                      onPress={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      className="h-7 w-7 items-center justify-center rounded-full bg-field"
                    >
                      <Plus size={14} color="#1E293B" />
                    </Pressable>
                    <Pressable
                      onPress={() => removeFromCart(item.productId)}
                      className="ml-1 p-1"
                    >
                      <Trash2 size={15} color="#DC2626" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            <View className="mt-4 flex-row items-center justify-between border-t border-line pt-3">
              <Text className="text-sm font-semibold text-ink-secondary">
                Total Tagihan (COD)
              </Text>
              <Text className="text-lg font-extrabold text-cta">
                {formatRupiah(total)}
              </Text>
            </View>

            <View className="mt-4 gap-2">
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
                onPress={clearCart}
                variant="outline"
              />
            </View>
          </SectionCard>
        ) : (
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
