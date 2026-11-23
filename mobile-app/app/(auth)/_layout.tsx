import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTintColor: "#1E293B",
        headerTitleStyle: { fontWeight: "800", fontSize: 17 },
        headerShadowVisible: false,
        headerBackTitle: "",
        contentStyle: { backgroundColor: "#F8FAFC" },
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "Daftar Warga Baru" }} />
      <Stack.Screen
        name="verify-otp"
        options={{ title: "Verifikasi OTP Email" }}
      />
    </Stack>
  );
}
