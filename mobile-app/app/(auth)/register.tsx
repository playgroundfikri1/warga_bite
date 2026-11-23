import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
  Building2,
  ChevronDown,
  Home,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { PrimaryButton } from "../../components/Buttons";
import { SearchBar } from "../../components/SearchBar";
import { listComplexes, registerAccount } from "../../lib/api";
import type { Complex } from "../../types/database";

export default function RegisterScreen() {
  const router = useRouter();

  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [loadingComplexes, setLoadingComplexes] = useState(true);
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);
  const [complexModalOpen, setComplexModalOpen] = useState(false);
  const [complexQuery, setComplexQuery] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [houseBlock, setHouseBlock] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listComplexes()
      .then((rows) => {
        setComplexes(rows);
        if (rows.length === 1) setSelectedComplex(rows[0]);
      })
      .catch((err) => {
        Alert.alert(
          "Gagal Memuat Komplek",
          err instanceof Error ? err.message : "Terjadi kesalahan jaringan."
        );
      })
      .finally(() => setLoadingComplexes(false));
  }, []);

  const filteredComplexes = complexes.filter((c) =>
    c.name.toLowerCase().includes(complexQuery.trim().toLowerCase())
  );

  const handleRegister = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!selectedComplex) {
      Alert.alert("Pilih Komplek", "Pilih komplek tempat tinggal Anda.");
      return;
    }
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !houseBlock.trim() ||
      !fullAddress.trim() ||
      !trimmedEmail ||
      password.length < 6
    ) {
      Alert.alert(
        "Lengkapi Formulir",
        "Semua kolom wajib diisi dan kata sandi minimal 6 karakter."
      );
      return;
    }

    setSubmitting(true);
    try {
      await registerAccount({
        email: trimmedEmail,
        password,
        complex_id: selectedComplex.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        house_block: houseBlock.trim(),
        full_address: fullAddress.trim(),
      });
      router.replace({
        pathname: "/(auth)/verify-otp",
        params: { email: trimmedEmail },
      });
    } catch (err) {
      Alert.alert(
        "Pendaftaran Gagal",
        err instanceof Error ? err.message : "Silakan coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <AppHeader
        title="Daftar Warga Baru"
        subtitle="Verifikasi Email 6 Digit"
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        className="flex-1 bg-canvas"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <Text className="text-sm font-bold text-ink">
              Data Identitas & Alamat Komplek
            </Text>
            <Text className="mt-0.5 text-xs text-ink-secondary">
              Akun baru berstatus Menunggu Verifikasi Pengurus Komplek hingga
              disetujui admin komplek Anda.
            </Text>

            <View className="mt-4 gap-3.5">
              {/* Pilih Komplek */}
              <View>
                <Text className="mb-1.5 text-xs font-bold text-ink">
                  Komplek / Perumahan
                </Text>
                <Pressable
                  onPress={() => setComplexModalOpen(true)}
                  className="flex-row items-center justify-between rounded-2xl bg-field px-4 py-3.5"
                >
                  <View className="flex-1 flex-row items-center gap-2.5">
                    <Building2 size={18} color="#EA580C" />
                    <Text
                      numberOfLines={1}
                      className={`text-sm ${
                        selectedComplex
                          ? "font-semibold text-ink"
                          : "text-status-muted"
                      }`}
                    >
                      {loadingComplexes
                        ? "Memuat daftar komplek..."
                        : selectedComplex
                          ? selectedComplex.name
                          : "Pilih komplek Anda"}
                    </Text>
                  </View>
                  <ChevronDown size={18} color="#64748B" />
                </Pressable>
              </View>

              {/* Nama Lengkap */}
              <View>
                <Text className="mb-1.5 text-xs font-bold text-ink">
                  Nama Lengkap
                </Text>
                <View className="flex-row items-center rounded-2xl bg-field px-4 py-3">
                  <User size={18} color="#64748B" />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Contoh: Ibu Siti Rahmawati"
                    placeholderTextColor="#94A3B8"
                    className="ml-3 flex-1 text-sm text-ink"
                  />
                </View>
              </View>

              {/* Nomor WhatsApp */}
              <View>
                <Text className="mb-1.5 text-xs font-bold text-ink">
                  Nomor WhatsApp Aktif
                </Text>
                <View className="flex-row items-center rounded-2xl bg-field px-4 py-3">
                  <Phone size={18} color="#64748B" />
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="0812xxxxxxxx"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    className="ml-3 flex-1 text-sm text-ink"
                  />
                </View>
              </View>

              {/* Blok Rumah */}
              <View>
                <Text className="mb-1.5 text-xs font-bold text-ink">
                  Blok & Nomor Rumah
                </Text>
                <View className="flex-row items-center rounded-2xl bg-field px-4 py-3">
                  <Home size={18} color="#64748B" />
                  <TextInput
                    value={houseBlock}
                    onChangeText={setHouseBlock}
                    placeholder="Contoh: Blok C4 No. 12"
                    placeholderTextColor="#94A3B8"
                    className="ml-3 flex-1 text-sm text-ink"
                  />
                </View>
              </View>

              {/* Alamat Lengkap / Patokan */}
              <View>
                <Text className="mb-1.5 text-xs font-bold text-ink">
                  Alamat / Patokan Rumah
                </Text>
                <View className="flex-row items-start rounded-2xl bg-field px-4 py-3">
                  <MapPin size={18} color="#64748B" className="mt-0.5" />
                  <TextInput
                    value={fullAddress}
                    onChangeText={setFullAddress}
                    placeholder="Contoh: Pagar putih sebelah taman RT 04"
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={2}
                    className="ml-3 flex-1 text-sm text-ink"
                  />
                </View>
              </View>

              {/* Email */}
              <View>
                <Text className="mb-1.5 text-xs font-bold text-ink">
                  Alamat Email (Untuk Kode OTP)
                </Text>
                <View className="flex-row items-center rounded-2xl bg-field px-4 py-3">
                  <Mail size={18} color="#64748B" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="nama@email.com"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="ml-3 flex-1 text-sm text-ink"
                  />
                </View>
              </View>

              {/* Password */}
              <View>
                <Text className="mb-1.5 text-xs font-bold text-ink">
                  Kata Sandi (Min. 6 Karakter)
                </Text>
                <View className="flex-row items-center rounded-2xl bg-field px-4 py-3">
                  <Lock size={18} color="#64748B" />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Buat kata sandi"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    autoCapitalize="none"
                    className="ml-3 flex-1 text-sm text-ink"
                  />
                </View>
              </View>

              <PrimaryButton
                title="Daftar & Kirim OTP Email"
                onPress={handleRegister}
                loading={submitting}
                className="mt-2"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal pilih komplek */}
      <Modal
        visible={complexModalOpen}
        animationType="slide"
        onRequestClose={() => setComplexModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-canvas">
          <AppHeader
            title="Pilih Komplek"
            onBack={() => setComplexModalOpen(false)}
          />
          <View className="p-4">
            <SearchBar
              value={complexQuery}
              onChangeText={setComplexQuery}
              placeholder="Cari nama komplek..."
            />
          </View>
          {loadingComplexes ? (
            <ActivityIndicator color="#EA580C" className="mt-8" />
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
              {filteredComplexes.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setSelectedComplex(item);
                    setComplexModalOpen(false);
                  }}
                  className={`mb-2.5 rounded-2xl border p-4 ${
                    selectedComplex?.id === item.id
                      ? "border-cta bg-chip-peach/40"
                      : "border-line bg-surface"
                  }`}
                >
                  <Text className="text-sm font-bold text-ink">
                    {item.name}
                  </Text>
                  {item.address ? (
                    <Text className="mt-0.5 text-xs text-ink-secondary">
                      {item.address}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
              {filteredComplexes.length === 0 && (
                <Text className="mt-8 text-center text-sm text-ink-secondary">
                  Komplek tidak ditemukan.
                </Text>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
