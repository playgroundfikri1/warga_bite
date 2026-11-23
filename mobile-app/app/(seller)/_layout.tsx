import { Stack } from "expo-router";

export default function SellerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F8FAFC" },
      }}
    />
  );
}
