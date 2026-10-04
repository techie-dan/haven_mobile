import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "@/ui/text";
import { palette, radius, spacing } from "@/theme";

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 10,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel="Decrease quantity"
        onPress={() => onChange(Math.max(min, value - 1))}
        style={styles.btn}>
        <Ionicons name="remove" size={16} color={palette.ink} />
      </Pressable>
      <AppText style={styles.value}>{value}</AppText>
      <Pressable
        accessibilityLabel="Increase quantity"
        onPress={() => onChange(Math.min(max, value + 1))}
        style={styles.btn}>
        <Ionicons name="add" size={16} color={palette.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    backgroundColor: palette.surface,
  },
  btn: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  value: { minWidth: 22, textAlign: "center" },
});
