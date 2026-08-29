import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { type ThemeColorPalette } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Alert.alert はreact-native-webでは複数ボタンのダイアログとして機能せず、
 * ボタン押下が反応しないことがあるため、確認が必要な操作には自前のモーダルを使う。
 */
export function ConfirmDialog({ visible, title, message, cancelLabel, confirmLabel, destructive, onCancel, onConfirm }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={({ pressed }) => [styles.confirmButton, destructive && styles.confirmButtonDestructive, pressed && styles.pressed]}>
              <Text style={[styles.confirmText, destructive && styles.confirmTextDestructive]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColorPalette) => StyleSheet.create({
  backdrop: { alignItems: "center", backgroundColor: colors.overlay, flex: 1, justifyContent: "center", padding: 24 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, width: "100%" },
  title: { color: colors.foreground, fontSize: 16, fontWeight: "800" },
  message: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  actions: { flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 16 },
  cancelButton: { paddingHorizontal: 12, paddingVertical: 10 },
  cancelText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  confirmButton: { backgroundColor: colors.primaryFill, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  confirmButtonDestructive: { backgroundColor: colors.errorSurface },
  confirmText: { color: colors.onPrimary, fontSize: 13, fontWeight: "800" },
  confirmTextDestructive: { color: colors.error },
  pressed: { opacity: 0.72 },
});
