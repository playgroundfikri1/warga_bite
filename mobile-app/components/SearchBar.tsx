import React from "react";
import { Pressable, TextInput, View } from "react-native";
import { Search, X } from "lucide-react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/**
 * Kolom pencarian pill putih dengan ikon kaca pembesar.
 */
export function SearchBar({
  value,
  onChangeText,
  placeholder = "Cari nasi uduk, risoles, pempek...",
}: SearchBarProps) {
  return (
    <View className="flex-row items-center rounded-full border border-line bg-surface px-4 py-2.5 shadow-sm">
      <Search size={18} color="#64748B" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        className="ml-2.5 flex-1 text-sm text-ink"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <X size={16} color="#64748B" />
        </Pressable>
      )}
    </View>
  );
}
