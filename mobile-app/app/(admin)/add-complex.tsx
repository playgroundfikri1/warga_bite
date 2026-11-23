import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronDown } from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { PrimaryButton } from "../../components/Buttons";
import { SectionCard } from "../../components/SectionCard";
import {
  addComplex,
  listCities,
  listPostalCodes,
  listProvinces,
} from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import type { City, PostalCode, Province } from "../../types/database";

type PickerKind = "province" | "city" | "postal" | null;

export default function AddComplexScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [postalCodes, setPostalCodes] = useState<PostalCode[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedPostal, setSelectedPostal] = useState<PostalCode | null>(null);
  const [pickerOpen, setPickerOpen] = useState<PickerKind>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("-6.200000");
  const [lng, setLng] = useState("106.816666");
  const [radiusMeters, setRadiusMeters] = useState("2000");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listProvinces()
      .then(setProvinces)
      .catch((err) =>
        Alert.alert(
          "Gagal Memuat Provinsi",
          err instanceof Error ? err.message : "Terjadi kesalahan."
        )
      );
  }, []);

  useEffect(() => {
    if (!selectedProvince) {
      setCities([]);
      setSelectedCity(null);
      return;
    }
    listCities(selectedProvince.id).then((rows) => {
      setCities(rows);
      setSelectedCity(null);
      setSelectedPostal(null);
    });
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedCity) {
      setPostalCodes([]);
      setSelectedPostal(null);
      return;
    }
    listPostalCodes(selectedCity.id).then((rows) => {
      setPostalCodes(rows);
      setSelectedPostal(null);
    });
  }, [selectedCity]);

  const handleSave = async () => {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    const parsedRadius = Number(radiusMeters);

    if (!selectedProvince || !selectedCity || !selectedPostal) {
      Alert.alert(
        "Wilayah Belum Lengkap",
        "Pilih Provinsi, Kota/Kabupaten, dan Kode Pos terlebih dahulu."
      );
      return;
    }
    if (!name.trim()) {
      Alert.alert("Nama Kosong", "Masukkan nama komplek.");
      return;
    }
    if (!profile?.id) {
      Alert.alert("Sesi Tidak Valid", "Silakan masuk ulang terlebih dahulu.");
      return;
    }
    if (
      Number.isNaN(parsedLat) ||
      Number.isNaN(parsedLng) ||
      Number.isNaN(parsedRadius) ||
      parsedRadius <= 0
    ) {
      Alert.alert(
        "Koordinat / Radius Tidak Valid",
        "Pastikan latitude, longitude, dan radius meter berupa angka yang valid."
      );
      return;
    }

    setSaving(true);
    try {
      await addComplex({
        name: name.trim(),
        address: address.trim(),
        province_id: selectedProvince.id,
        city_id: selectedCity.id,
        postal_code: selectedPostal.postal_code,
        lat: parsedLat,
        lng: parsedLng,
        max_delivery_radius_km: Math.max(1, Math.round(parsedRadius / 1000)),
        created_by: profile.id,
      });
      Alert.alert("Berhasil", "Komplek baru berhasil ditambahkan.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(
        "Gagal Menyimpan",
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <AppHeader
        title="Tambah Komplek"
        subtitle="Admin Komplek"
        onBack={() => router.back()}
      />

      <ScrollView
        className="flex-1 bg-canvas"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <SectionCard title="Detail Wilayah & Lokasi Komplek">
          <View className="gap-3.5">
            <View>
              <Text className="mb-1 text-xs font-bold text-ink">Provinsi</Text>
              <Pressable
                onPress={() => setPickerOpen("province")}
                className="flex-row items-center justify-between rounded-xl bg-field px-3.5 py-3"
              >
                <Text className="text-sm text-ink">
                  {selectedProvince?.name ?? "Pilih Provinsi (Opsional)"}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </Pressable>
            </View>

            <View>
              <Text className="mb-1 text-xs font-bold text-ink">
                Kota / Kabupaten
              </Text>
              <Pressable
                onPress={() => selectedProvince && setPickerOpen("city")}
                className="flex-row items-center justify-between rounded-xl bg-field px-3.5 py-3"
              >
                <Text className="text-sm text-ink">
                  {selectedCity?.name ?? "Pilih Kota / Kabupaten"}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </Pressable>
            </View>

            <View>
              <Text className="mb-1 text-xs font-bold text-ink">Kode Pos</Text>
              <Pressable
                onPress={() => selectedCity && setPickerOpen("postal")}
                className="flex-row items-center justify-between rounded-xl bg-field px-3.5 py-3"
              >
                <Text className="text-sm text-ink">
                  {selectedPostal
                    ? `${selectedPostal.postal_code} — ${selectedPostal.subdistrict_name}`
                    : "Pilih Kode Pos"}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </Pressable>
            </View>

            <View>
              <Text className="mb-1 text-xs font-bold text-ink">
                Nama Komplek *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Contoh: Komplek Graha Asri"
                className="rounded-xl bg-field px-3.5 py-2.5 text-sm text-ink"
              />
            </View>

            <View>
              <Text className="mb-1 text-xs font-bold text-ink">
                Alamat Lengkap
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Jl. Boulevard Utama No. 1"
                multiline
                numberOfLines={2}
                className="rounded-xl bg-field px-3.5 py-2.5 text-sm text-ink"
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-1 text-xs font-bold text-ink">
                  Latitude
                </Text>
                <TextInput
                  value={lat}
                  onChangeText={setLat}
                  keyboardType="numeric"
                  className="rounded-xl bg-field px-3.5 py-2.5 text-sm text-ink"
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1 text-xs font-bold text-ink">
                  Longitude
                </Text>
                <TextInput
                  value={lng}
                  onChangeText={setLng}
                  keyboardType="numeric"
                  className="rounded-xl bg-field px-3.5 py-2.5 text-sm text-ink"
                />
              </View>
            </View>

            <View>
              <Text className="mb-1 text-xs font-bold text-ink">
                Radius Katalog (Meter)
              </Text>
              <TextInput
                value={radiusMeters}
                onChangeText={setRadiusMeters}
                keyboardType="number-pad"
                className="rounded-xl bg-field px-3.5 py-2.5 text-sm text-ink"
              />
            </View>

            <PrimaryButton
              title="Simpan Komplek"
              onPress={handleSave}
              loading={saving}
              className="mt-2"
            />
          </View>
        </SectionCard>
      </ScrollView>

      {/* Picker modal */}
      <Modal
        visible={pickerOpen !== null}
        animationType="slide"
        onRequestClose={() => setPickerOpen(null)}
      >
        <SafeAreaView className="flex-1 bg-canvas">
          <AppHeader
            title={
              pickerOpen === "province"
                ? "Pilih Provinsi"
                : pickerOpen === "city"
                  ? "Pilih Kota / Kabupaten"
                  : "Pilih Kode Pos"
            }
            onBack={() => setPickerOpen(null)}
          />
          <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
            {pickerOpen === "province" &&
              provinces.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setSelectedProvince(p);
                    setPickerOpen(null);
                  }}
                  className="rounded-xl border border-line bg-surface p-3.5"
                >
                  <Text className="text-sm font-semibold text-ink">
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            {pickerOpen === "city" &&
              cities.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setSelectedCity(c);
                    setPickerOpen(null);
                  }}
                  className="rounded-xl border border-line bg-surface p-3.5"
                >
                  <Text className="text-sm font-semibold text-ink">
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            {pickerOpen === "postal" &&
              postalCodes.map((pc) => (
                <Pressable
                  key={pc.id}
                  onPress={() => {
                    setSelectedPostal(pc);
                    setPickerOpen(null);
                  }}
                  className="rounded-xl border border-line bg-surface p-3.5"
                >
                  <Text className="text-sm font-semibold text-ink">
                    {pc.postal_code} — {pc.subdistrict_name}
                  </Text>
                </Pressable>
              ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
