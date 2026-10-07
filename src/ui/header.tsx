import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { useCart } from "@/providers/cart";
import { palette, radius, spacing } from "@/theme";
import { AppText } from "@/ui/text";

/** Brand lockup used at the top of the tab screens. */
export function BrandHeader({ title }: { title: string }) {
  const router = useRouter();

  return (
    <View style={styles.brandRow}>
      <View>
        <AppText variant="eyebrow" style={styles.brandEyebrow}>
          Haven Studio
        </AppText>
        <AppText variant="display">{title}</AppText>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Search the archive"
          onPress={() => router.push("/archive")}
          hitSlop={8}
        >
          <Ionicons name="search-outline" size={20} color={palette.ink} />
        </Pressable>
        <Pressable
          accessibilityLabel="Open bag"
          onPress={() => router.push("/checkout")}
          hitSlop={8}
        >
          <Ionicons name="bag-outline" size={20} color={palette.ink} />
        </Pressable>
      </View>
    </View>
  );
}

/** Back-arrow header for pushed routes, with an optional right-hand action. */
export function PageHeader({
  title,
  onBack,
  right,
  showBag = true,
}: {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  showBag?: boolean;
}) {
  const router = useRouter();
  const { count } = useCart();

  return (
    <View style={styles.pageRow}>
      <Pressable
        accessibilityLabel="Go back"
        onPress={onBack ?? (() => router.back())}
        hitSlop={10}
        style={styles.iconBtn}
      >
        <Ionicons name="arrow-back" size={20} color={palette.ink} />
      </Pressable>

      <AppText variant="title" numberOfLines={1} style={styles.pageTitle}>
        {title ?? ""}
      </AppText>

      {right ?? (
        <View style={styles.rightSlot}>
          {showBag ? (
            <Pressable
              accessibilityLabel="Open bag"
              onPress={() => router.push("/bag")}
              hitSlop={10}
              style={styles.iconBtn}
            >
              <Ionicons name="bag-outline" size={20} color={palette.ink} />
              {count > 0 ? (
                <View style={styles.badge}>
                  <AppText variant="eyebrow" style={styles.badgeText}>
                    {count}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  brandEyebrow: { color: palette.terracotta, letterSpacing: 2.4 },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  pageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pageTitle: { flex: 1, textAlign: "center" },
  rightSlot: { minWidth: 32, alignItems: "flex-end" },
  iconBtn: { padding: 4 },
  badge: {
    position: "absolute",
    top: -2,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: palette.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: palette.white, fontSize: 9, letterSpacing: 0 },
});
