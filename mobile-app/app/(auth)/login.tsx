import React, { useState } from "react";
import {
  Alert,
  Image,
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
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react-native";
import { PrimaryButton } from "../../components/Buttons";
import { useAuth } from "../../lib/auth-context";
import { hapticError, hapticLight, hapticSuccess } from "../../lib/haptics";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert("Lengkapi Data", "Masukkan alamat email dan kata sandi Anda.");
      return;
    }

    setLoading(true);
    const { error } = await signIn(trimmedEmail, password);
    setLoading(false);

    if (error) {
      hapticError();
      if (error.toLowerCase().includes("email not confirmed")) {
        Alert.alert(
          "Email Belum Diverifikasi",
          "Silakan masukkan kode OTP 6 digit yang dikirim ke email Anda.",
          [
            { text: "Batal", style: "cancel" },
            {
              text: "Masukkan OTP",
              onPress: () =>
                router.push({
                  pathname: "/(auth)/verify-otp",
                  params: { email: trimmedEmail },
                }),
            },
          ]
        );
        return;
      }
      Alert.alert("Gagal Masuk", error);
      return;
    }

    hapticSuccess();
    router.replace("/");
  };

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1 bg-canvas"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Hero oranye bergaya WargaBite */}
          <View className="items-center bg-primary px-6 pb-14 pt-8">
            <View className="mb-3 h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/30 shadow-md">
              <Image
                source={require("../../assets/icon.png")}
                className="h-full w-full"
                resizeMode="cover"
              />
            </View>
            <Text className="text-3xl font-extrabold tracking-tight text-white">
              WargaBite
            </Text>
            <Text className="mt-1 text-base font-bold text-white/95">
              Jajan di Komplek Sendiri
            </Text>
            <Text className="mt-1 text-center text-xs leading-relaxed text-white/85">
              Kuliner tetangga terdekat, hangat & higienis{"\n"}diantar langsung
              ke teras rumahmu.
            </Text>
          </View>

          {/* Kartu putih form login */}
          <View className="-mt-8 flex-1 rounded-t-3xl bg-surface px-6 pb-8 pt-7 shadow-sm">
            <Text className="text-xl font-extrabold text-ink">
              Masuk ke Akun Warga
            </Text>
            <Text className="mt-1 text-xs text-ink-secondary">
              Gunakan email dan kata sandi yang terdaftar di komplek
            </Text>

            <View className="mt-6 gap-4">
              <View>
                <Text className="mb-1.5 text-xs font-bold text-ink">
                  Alamat Email
                </Text>
                <View className="h-12 flex-row items-center rounded-2xl bg-field px-4">
                  <Mail size={18} color="#64748B" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="nama@email.com"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    className="ml-3 h-12 flex-1 text-sm text-ink"
                  />
                </View>
              </View>

              <View>
                <Text className="mb-1.5 text-xs font-bold text-ink">
                  Kata Sandi
                </Text>
                <View className="h-12 flex-row items-center rounded-2xl bg-field px-4">
                  <Lock size={18} color="#64748B" />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Masukkan kata sandi"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    className="ml-3 h-12 flex-1 text-sm text-ink"
                  />
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      setShowPassword((prev) => !prev);
                    }}
                    hitSlop={10}
                    className="h-10 w-10 items-center justify-center rounded-full active:scale-95 active:opacity-75"
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#64748B" />
                    ) : (
                      <Eye size={18} color="#64748B" />
                    )}
                  </Pressable>
                </View>
              </View>

              <PrimaryButton
                title="Masuk Sekarang"
                onPress={handleLogin}
                loading={loading}
                icon={<ArrowRight size={18} color="#FFFFFF" />}
                className="mt-2"
              />
            </View>

            <View className="mt-6 flex-row items-center justify-center gap-1">
              <Text className="text-xs text-ink-secondary">
                Warga baru di komplek ini?
              </Text>
              <Pressable
                onPress={() => {
                  hapticLight();
                  router.push("/(auth)/register");
                }}
                className="rounded-md px-1.5 py-0.5 active:scale-95 active:opacity-80"
              >
                <Text className="text-xs font-bold text-cta">
                  Daftar Sekarang
                </Text>
              </Pressable>
            </View>

            <View className="mt-auto pt-8">
              <View className="flex-row items-center justify-center gap-2 rounded-full bg-field px-4 py-2.5">
                <ShieldCheck size={16} color="#16A34A" />
                <Text className="text-[11px] font-semibold text-ink">
                  Terverifikasi Aman Pengurus RT & Pengelola Komplek
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
