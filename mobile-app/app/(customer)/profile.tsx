import React, { useState } from "react";
import {
  Alert,
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
import { AppHeader } from "../../components/AppHeader";
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
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <AppHeader
        title="Profil Warga"
        subtitle={complex?.name ?? "Komplek WargaBite"}
      />

      <KeyboardAvoidingView
        className="flex-1 bg-canvas"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1 bg-canvas"
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
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
                    className={`flex-row items-center gap-2 rounded-full border px-3.5 py-2 ${
                      isCurrent
                        ? "border-cta bg-chip-peach"
                        : "border-line bg-field"
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
                placeholder="Blok C4 No. 12"
                className="rounded-xl bg-field px-3.5 py-2.5 text-sm text-ink"
              />
            </View>
            <View>
              <Text className="mb-1 text-xs font-bold text-ink">
                Patokan Alamat
              </Text>
              <TextInput
                value={fullAddress}
                onChangeText={setFullAddress}
                placeholder="Pagar putih depan taman"
                className="rounded-xl bg-field px-3.5 py-2.5 text-sm text-ink"
              />
            </View>
            <View>
              <Text className="mb-1 text-xs font-bold text-ink">
                Nomor WhatsApp
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="0812xxxxxxxx"
                className="rounded-xl bg-field px-3.5 py-2.5 text-sm text-ink"
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
                  placeholder="Nama Dapur / Usaha (mis. Dapur Bu Tejo)"
                  className="rounded-xl bg-field px-3.5 py-2.5 text-sm text-ink"
                />
                <TextInput
                  value={shopDesc}
                  onChangeText={setShopDesc}
                  placeholder="Deskripsi singkat masakan andalan Anda"
                  multiline
                  numberOfLines={2}
                  className="rounded-xl bg-field px-3.5 py-2.5 text-sm text-ink"
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
    </SafeAreaView>
  );
}
