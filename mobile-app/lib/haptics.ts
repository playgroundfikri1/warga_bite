import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const isNative = Platform.OS === "ios" || Platform.OS === "android";

/**
 * Getaran sentuh untuk tombol aksi & perpindahan tab (level Medium agar terasa mantap di Android/iOS).
 */
export function hapticLight() {
  if (!isNative) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/**
 * Getaran sentuh kuat untuk konfirmasi penting.
 */
export function hapticMedium() {
  if (!isNative) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

/**
 * Getaran pilihan (filter kategori, pilihan list).
 */
export function hapticSelection() {
  if (!isNative) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
