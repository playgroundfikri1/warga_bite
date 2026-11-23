import { Stack } from "expo-router";
import { HeaderModeWargaButton } from "../../components/HeaderActions";

export default function CourierLayout() {
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
      <Stack.Screen
        name="index"
        options={{
          title: "Tugas Kurir Komplek",
          headerRight: () => <HeaderModeWargaButton />,
        }}
      />
    </Stack>
  );
}
