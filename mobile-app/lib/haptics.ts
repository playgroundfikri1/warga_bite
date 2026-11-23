import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const isNative = Platform.OS === "ios" || Platform.OS === "android";

/**
 * Getaran sentuh ringan untuk tombol aksi & perpindahan tab.
 */
export function hapticLight() {
  if (!isNative) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/**
 * Getaran sentuh sedang untuk konfirmasi penting.
 */
export function hapticMedium() {
  if (!isNative) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/**
 * Getaran pilihan halus (filter kategori, pilihan list).
 */
export function hapticSelection() {
  if (!isNative) return;
  Haptics.selectionAsync().catch(() => {});
}

/**
 * Getaran notifikasi sukses.
 */
export function hapticSuccess() {
  if (!isNative) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {}
  );
}

/**
 * Getaran notifikasi gagal/peringatan.
 */
export function hapticError() {
  if (!isNative) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
    () => {}
  );
}
