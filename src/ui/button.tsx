import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from "react-native";

import { AppText } from "@/ui/text";
import { palette, radius, spacing } from "@/theme";

type Variant = "primary" | "outline" | "ghost";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "outline" && styles.outline,
        variant === "ghost" && styles.ghost,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? palette.white : palette.ink}
          size="small"
        />
      ) : (
        <View style={styles.row}>
          <AppText
            variant="label"
            style={[styles.label, variant === "primary" && styles.labelOnDark]}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  primary: { backgroundColor: palette.ink },
  outline: { borderWidth: 1, borderColor: palette.lineStrong, backgroundColor: palette.surface },
  ghost: { backgroundColor: "transparent" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { fontSize: 11, letterSpacing: 1.6 },
  labelOnDark: { color: palette.white },
});
