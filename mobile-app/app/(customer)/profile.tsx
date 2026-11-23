import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChefHat,
  LogOut,
  Save,
  Shield,
  Store,
  Truck,
  User,
} from "lucide-react-native";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { SectionCard } from "../../components/SectionCard";
import { StatusChip } from "../../components/StatusChip";
import { requestSeller, updateAddress } from "../../lib/api";
import { homeRouteForRole, useAuth } from "../../lib/auth-context";
import { hapticError, hapticLight, hapticSuccess } from "../../lib/haptics";
import { useAppStore } from "../../store/useAppStore";
import type { AppRole } from "../../types/database";

const ROLE_LABELS: Record<AppRole, { label: string; icon: React.ReactNode }> = {
  customer: {
    label: "Mode Warga",
    icon: <User size={15} color="#1E293B" />,
  },
  seller: {
    label: "Mode Penjual",
    icon: <Store size={15} color="#A63A00" />,
  },
  courier: {
    label: "Mode Kurir",
    icon: <Truck size={15} color="#065F46" />,
  },
  admin: {
    label: "Mode Admin Komplek",
    icon: <Shield size={15} color="#1E40AF" />,
  },
};

export default function CustomerProfileScreen() {
  const router = useRouter();
  const {
    session,
    profile,
    complex,
    isPending,
    availableRoles,
    refreshProfile,
    signOut,
  } = useAuth();

  const activeRole = useAppStore((s) => s.activeRole);
  const setActiveRole = useAppStore((s) => s.setActiveRole);

  const [houseBlock, setHouseBlock] = useState(profile?.house_block ?? "");
  const [fullAddress, setFullAddress] = useState(profile?.full_address ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [savingAddress, setSavingAddress] = useState(false);

  const [shopName, setShopName] = useState("");
  const [shopDesc, setShopDesc] = useState("");
  const [submittingSeller, setSubmittingSeller] = useState(false);

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToField = (yOffset: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 120);
  };

  const handleSaveAddress = async () => {
    if (!profile) return;
    if (!houseBlock.trim() || !phone.trim()) {
      Alert.alert("Lengkapi Data", "Blok rumah dan nomor WhatsApp wajib diisi.");
      return;
    }
    setSavingAddress(true);
    try {
      await updateAddress(profile.id, {
        house_block: houseBlock.trim(),
        full_address: fullAddress.trim(),
        phone: phone.trim(),
      });
      await refreshProfile();
      hapticSuccess();
      Alert.alert("Tersimpan", "Alamat dan kontak Anda berhasil diperbarui.");
    } catch (err) {
      hapticError();
      Alert.alert(
        "Gagal Menyimpan",
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const handleRequestSeller = async () => {
    if (!profile) return;
    if (!shopName.trim()) {
      Alert.alert("Nama Dapur Kosong", "Masukkan nama dapur/usaha Anda.");
      return;
    }
    setSubmittingSeller(true);
    try {
      await requestSeller(profile.id, shopName.trim(), shopDesc.trim());
      await refreshProfile();
      hapticSuccess();
      Alert.alert(
        "Pengajuan Terkirim",
        "Pengajuan penjual Anda akan ditinjau Admin Komplek. Setelah disetujui, Anda langsung mendapat Gratis 30 Hari!"
      );
    } catch (err) {
      hapticError();
      Alert.alert(
        "Gagal Mengajukan",
        err instanceof Error ? err.message : "Silakan coba lagi."
      );
    } finally {
      setSubmittingSeller(false);
    }
  };

  const handleSwitchRole = (role: AppRole) => {
    hapticLight();
    setActiveRole(role);
    router.replace(homeRouteForRole(role) as never);
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const initials = (profile?.full_name ?? "W")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <View className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        className="flex-1 bg-canvas"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1 bg-canvas"
          contentContainerStyle={{
            padding: 16,
            gap: 16,
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 36 : 32,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        {/* Kartu identitas */}
        <SectionCard>
          <View className="flex-row items-center gap-3.5">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
              <Text className="text-lg font-extrabold text-white">
                {initials}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-extrabold text-ink">
                {profile?.full_name ?? "Warga"}
              </Text>
              <Text className="text-xs text-ink-secondary">
                {session?.user?.email ?? "-"}
              </Text>
              <View className="mt-1.5">
                <StatusChip
                  label={
                    isPending
                      ? "Menunggu Verifikasi"
                      : profile?.verification_status === "approved"
                        ? "Warga Terverifikasi"
                        : "Ditolak"
                  }
                  variant={
                    isPending
                      ? "warning"
                      : profile?.verification_status === "approved"
                        ? "mint"
                        : "danger"
                  }
                  showDot
                />
              </View>
            </View>
          </View>
        </SectionCard>

        {/* Pengalih Mode Peran */}
        {availableRoles.length > 1 && (
          <SectionCard
            title="Pindah Mode Aplikasi"
            subtitle="Anda memiliki akses ke beberapa peran di komplek"
          >
            <View className="flex-row flex-wrap gap-2">
              {availableRoles.map((role) => {
                const isCurrent = activeRole === role;
                const info = ROLE_LABELS[role];
                return (
                  <Pressable
                    key={role}
                    onPress={() => handleSwitchRole(role)}
                    android_ripple={{ color: "rgba(166,58,0,0.12)" }}
                    className={`min-h-[44px] flex-row items-center gap-2 overflow-hidden rounded-full px-4 py-2 active:scale-95 ${
                      isCurrent ? "bg-chip-peach" : "bg-field"
                    }`}
                  >
                    {info.icon}
                    <Text
                      className={`text-xs font-bold ${
                        isCurrent ? "text-cta" : "text-ink"
                      }`}
                    >
                      {info.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SectionCard>
        )}

        {/* Alamat & Kontak */}
        <SectionCard title="Alamat & Kontak Antar">
          <View className="gap-3">
            <View>
              <Text className="mb-1 text-xs font-bold text-ink">
                Blok & Nomor Rumah
              </Text>
              <TextInput
                value={houseBlock}
                onChangeText={setHouseBlock}
                onFocus={() => scrollToField(160)}
                placeholder="Blok C4 No. 12"
                className="h-12 rounded-2xl bg-field px-4 text-sm text-ink"
              />
            </View>
            <View>
              <Text className="mb-1 text-xs font-bold text-ink">
                Patokan Alamat
              </Text>
              <TextInput
                value={fullAddress}
                onChangeText={setFullAddress}
                onFocus={() => scrollToField(230)}
                placeholder="Pagar putih depan taman"
                className="h-12 rounded-2xl bg-field px-4 text-sm text-ink"
              />
            </View>
            <View>
              <Text className="mb-1 text-xs font-bold text-ink">
                Nomor WhatsApp
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                onFocus={() => scrollToField(300)}
                keyboardType="phone-pad"
                placeholder="0812xxxxxxxx"
                className="h-12 rounded-2xl bg-field px-4 text-sm text-ink"
              />
            </View>
            <SecondaryButton
              title="Simpan Perubahan Alamat"
              onPress={handleSaveAddress}
              loading={savingAddress}
              icon={<Save size={15} color="#1E293B" />}
            />
          </View>
        </SectionCard>

        {/* Pengajuan Penjual */}
        {profile && !profile.is_seller && (
          <SectionCard
            title="Buka Dapur Warga (Penjual)"
            subtitle="Gratis 30 Hari untuk UMKM & dapur rumahan komplek"
            rightElement={<ChefHat size={20} color="#EA580C" />}
          >
            {profile.seller_request_status === "pending" ? (
              <StatusChip
                label="Pengajuan Penjual Sedang Ditinjau Admin"
                variant="warning"
                showDot
              />
            ) : (
              <View className="gap-3">
                {profile.seller_request_status === "rejected" && (
                  <StatusChip
                    label="Pengajuan sebelumnya ditolak — Anda bisa ajukan ulang"
                    variant="danger"
                  />
                )}
                <TextInput
                  value={shopName}
                  onChangeText={setShopName}
                  onFocus={() =>
                    setTimeout(
                      () => scrollRef.current?.scrollToEnd({ animated: true }),
                      120
                    )
                  }
                  placeholder="Nama Dapur / Usaha (mis. Dapur Bu Tejo)"
                  className="h-12 rounded-2xl bg-field px-4 text-sm text-ink"
                />
                <TextInput
                  value={shopDesc}
                  onChangeText={setShopDesc}
                  onFocus={() =>
                    setTimeout(
                      () => scrollRef.current?.scrollToEnd({ animated: true }),
                      120
                    )
                  }
                  placeholder="Deskripsi singkat masakan andalan Anda"
                  multiline
                  numberOfLines={2}
                  className="min-h-[64px] rounded-2xl bg-field px-4 py-3 text-sm text-ink"
                />
                <PrimaryButton
                  title="Ajukan Jadi Penjual"
                  onPress={handleRequestSeller}
                  loading={submittingSeller}
                  disabled={isPending}
                />
                {isPending && (
                  <Text className="text-[11px] text-ink-secondary">
                    Akun warga harus disetujui terlebih dahulu sebelum mengajukan
                    diri sebagai penjual.
                  </Text>
                )}
              </View>
            )}
          </SectionCard>
        )}

        <SecondaryButton
          title="Keluar dari Akun"
          onPress={handleLogout}
          variant="outline"
          icon={<LogOut size={16} color="#DC2626" />}
        />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
