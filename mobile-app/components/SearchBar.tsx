import React from "react";
import { Pressable, TextInput, View } from "react-native";
import { Search, X } from "lucide-react-native";
import { hapticLight } from "../lib/haptics";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/**
 * Kolom pencarian pill putih ramah jempol (h-12) dengan shadow halus.
 */
export function SearchBar({
  value,
  onChangeText,
  placeholder = "Cari nasi uduk, risoles, pempek...",
}: SearchBarProps) {
  return (
    <View
      style={{
        elevation: 2,
        shadowColor: "#0F172A",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      }}
      className="h-12 flex-row items-center rounded-2xl bg-white px-4"
    >
      <Search size={18} color="#64748B" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        className="ml-2.5 h-12 flex-1 text-sm text-ink"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            hapticLight();
            onChangeText("");
          }}
          hitSlop={10}
          className="h-8 w-8 items-center justify-center rounded-full active:scale-95 active:bg-field"
        >
          <X size={16} color="#64748B" />
        </Pressable>
      )}
    </View>
  );
}
