import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, MapPin, ReceiptText, ShoppingBag, User } from "lucide-react-native";
import { HeaderBackButton } from "../../components/HeaderActions";
import { useAuth } from "../../lib/auth-context";
import { hapticLight } from "../../lib/haptics";
import { useAppStore } from "../../store/useAppStore";

function CustomerHomeHeaderTitle() {
  const { complex } = useAuth();
  return (
    <View className="flex-row items-center gap-2.5">
      <Image
        source={require("../../assets/icon.png")}
        className="h-9 w-9 rounded-xl"
        resizeMode="cover"
      />
      <View>
        <View className="flex-row items-center gap-1">
          <MapPin size={11} color="#EA580C" />
          <Text
            numberOfLines={1}
            className="text-[11px] font-bold uppercase tracking-wide text-primary"
          >
            {complex?.name ?? "Komplek WargaBite"}
          </Text>
        </View>
        <Text className="text-base font-extrabold text-ink">WargaBite</Text>
      </View>
    </View>
  );
}

function CustomerCartHeaderButton() {
  const router = useRouter();
  const cart = useAppStore((s) => s.cart);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        router.push("/(customer)/orders");
      }}
      android_ripple={{ color: "rgba(166,58,0,0.12)" }}
      className="relative mr-3 h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-field active:scale-95"
    >
      <ShoppingBag size={20} color="#A63A00" />
      {cartCount > 0 && (
        <View className="absolute -right-0.5 -top-0.5 h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1">
          <Text className="text-[10px] font-extrabold text-white">
            {cartCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function CustomerTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          hapticLight();
        },
      }}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTintColor: "#1E293B",
        headerTitleStyle: { fontWeight: "800", fontSize: 17 },
        headerShadowVisible: false,
        tabBarActiveTintColor: "#A63A00",
        tabBarInactiveTintColor: "#64748B",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#F1F5F9",
          height: 58 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 8,
          shadowColor: "#0F172A",
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          headerTitle: () => <CustomerHomeHeaderTitle />,
          headerRight: () => <CustomerCartHeaderButton />,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{
          title: "Pesanan",
          headerTitle: "Pesanan & Keranjang",
          tabBarIcon: ({ color, size }) => (
            <ReceiptText size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          headerTitle: "Profil Warga",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="product/[id]"
        options={{
          href: null,
          headerTitle: "Detail Makanan",
          headerLeft: () => <HeaderBackButton />,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
