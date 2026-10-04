import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "@/ui/text";
import { palette, radius, spacing } from "@/theme";

export function Eyebrow({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <AppText variant="eyebrow" style={style}>
      {children}
    </AppText>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

export function Badge({ label, tone = "ink" }: { label: string; tone?: "ink" | "sale" | "soft" }) {
  return (
    <View
      style={[
        styles.badge,
        tone === "ink" && { backgroundColor: palette.ink },
        tone === "sale" && { backgroundColor: palette.terracotta },
        tone === "soft" && { backgroundColor: palette.surfaceSunk, borderWidth: 1, borderColor: palette.line },
      ]}>
      <AppText
        variant="eyebrow"
        style={[styles.badgeLabel, { color: tone === "soft" ? palette.inkSoft : palette.white }]}>
        {label}
      </AppText>
    </View>
  );
}

export function Stars({ rating, count, size = 12 }: { rating: number; count?: number; size?: number }) {
  return (
    <View style={styles.stars}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Ionicons
          key={i}
          name={i < Math.round(rating) ? "star" : "star-outline"}
          size={size}
          color={palette.brass}
        />
      ))}
      <AppText variant="small" style={styles.starsText}>
        {rating.toFixed(1)}
        {count !== undefined ? ` (${count})` : ""}
      </AppText>
    </View>
  );
}

export function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <View style={[styles.pill, active && styles.pillActive]}>
      <AppText variant="eyebrow" style={active ? styles.pillTextActive : undefined}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: palette.line, width: "100%" },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
  badgeLabel: { fontSize: 9, letterSpacing: 1.4 },
  stars: { flexDirection: "row", alignItems: "center", gap: 2 },
  starsText: { marginLeft: spacing.xs, color: palette.inkSoft },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.lineStrong,
    backgroundColor: palette.surface,
  },
  pillActive: { backgroundColor: palette.ink, borderColor: palette.ink },
  pillTextActive: { color: palette.white },
});
