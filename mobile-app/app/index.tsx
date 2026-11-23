import { ActivityIndicator, View } from "react-native";
import { Redirect, type Href } from "expo-router";
import { homeRouteForRole, useAuth } from "@/lib/auth-context";
import { useAppStore } from "@/store/useAppStore";

// Gerbang awal: belum login → login; sudah login → beranda sesuai role aktif.
export default function IndexGate() {
  const { session, profile, loading } = useAuth();
  const activeRole = useAppStore((s) => s.activeRole);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#EA580C" />
      </View>
    );
  }
  if (!session) return <Redirect href={"/(auth)/login" as Href} />;
  if (!profile) return <Redirect href={"/(auth)/login" as Href} />;
  return <Redirect href={homeRouteForRole(activeRole) as Href} />;
}
