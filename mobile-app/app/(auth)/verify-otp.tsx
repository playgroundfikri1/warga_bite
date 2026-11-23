import React, { useEffect, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MailCheck } from "lucide-react-native";
import { PrimaryButton } from "../../components/Buttons";
import { resendSignupOtp, verifySignupOtp } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { hapticError, hapticLight, hapticSuccess } from "../../lib/haptics";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { refreshProfile } = useAuth();

  const [email, setEmail] = useState(params.email ?? "");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    if (!cleanEmail || cleanOtp.length !== 6) {
      Alert.alert(
        "Kode Tidak Lengkap",
        "Masukkan email dan 6 digit kode OTP dari kotak masuk email Anda."
      );
      return;
    }

    setVerifying(true);
    try {
      await verifySignupOtp(cleanEmail, cleanOtp);
      await refreshProfile();
      hapticSuccess();
      router.replace("/");
    } catch (err) {
      hapticError();
      Alert.alert(
        "Verifikasi Gagal",
        err instanceof Error ? err.message : "Kode OTP salah atau kedaluwarsa."
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      Alert.alert("Email Kosong", "Masukkan email pendaftaran Anda.");
      return;
    }
    try {
      await resendSignupOtp(cleanEmail);
      setCooldown(60);
      hapticSuccess();
      Alert.alert("OTP Terkirim", "Silakan periksa kotak masuk atau folder spam.");
    } catch (err) {
      hapticError();
      Alert.alert(
        "Gagal Mengirim Ulang",
        err instanceof Error ? err.message : "Silakan coba sebentar lagi."
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["bottom"]}>
      <KeyboardAvoidingView
        className="flex-1 bg-canvas"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <View
          style={{
            elevation: 2,
            shadowColor: "#0F172A",
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          }}
          className="items-center rounded-3xl bg-white p-6"
        >
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-chip-peach">
            <MailCheck size={30} color="#A63A00" />
          </View>

          <Text className="text-center text-lg font-extrabold text-ink">
            Masukkan Kode 6 Digit
          </Text>
          <Text className="mt-1 text-center text-xs leading-relaxed text-ink-secondary">
            Kami telah mengirimkan kode verifikasi ke email{" "}
            <Text className="font-bold text-ink">{email || "Anda"}</Text>.
          </Text>

          {!params.email && (
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Alamat email"
              autoCapitalize="none"
              keyboardType="email-address"
              className="mt-4 h-12 w-full rounded-2xl bg-field px-4 text-sm text-ink"
            />
          )}

          <TextInput
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            maxLength={6}
            className="mt-5 h-14 w-full rounded-2xl bg-field py-3 text-center text-2xl font-extrabold tracking-[10px] text-ink"
          />

          <PrimaryButton
            title="Verifikasi & Masuk"
            onPress={handleVerify}
            loading={verifying}
            className="mt-5 w-full"
          />

          <Pressable
            onPress={() => {
              hapticLight();
              handleResend();
            }}
            disabled={cooldown > 0}
            className="mt-4 rounded-full px-3 py-2 active:scale-95 active:opacity-80"
          >
            <Text
              className={`text-xs font-bold ${
                cooldown > 0 ? "text-status-muted" : "text-cta"
              }`}
            >
              {cooldown > 0
                ? `Kirim ulang kode dalam ${cooldown} detik`
                : "Kirim Ulang Kode OTP"}
            </Text>
          </Pressable>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
