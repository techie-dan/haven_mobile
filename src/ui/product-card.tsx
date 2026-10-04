import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "@/ui/text";
import { Badge, Stars } from "@/ui/bits";
import { palette, radius, spacing } from "@/theme";
import { formatPriceCompact } from "@/lib/pricing";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  onPress,
  onAdd,
  saved,
  onToggleSaved,
  width,
}: {
  product: Product;
  onPress: () => void;
  onAdd?: () => void;
  saved?: boolean;
  onToggleSaved?: () => void;
  width?: number | `${number}%`;
}) {
  const onSale =
    product.compareAtCents !== undefined && product.compareAtCents > product.priceCents;

  return (
    <Pressable onPress={onPress} style={[styles.card, width ? { width } : null]}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {product.badge ? (
          <View style={styles.badgeSlot}>
            <Badge
              label={product.badge}
              tone={product.badge === "BEST SELLER" ? "sale" : "ink"}
            />
          </View>
        ) : null}
        {onToggleSaved ? (
          <Pressable
            accessibilityLabel={saved ? "Remove from saved" : "Save item"}
            onPress={onToggleSaved}
            hitSlop={8}
            style={styles.heart}>
            <Ionicons
              name={saved ? "heart" : "heart-outline"}
              size={16}
              color={saved ? palette.terracotta : palette.ink}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.meta}>
        <AppText variant="eyebrow" style={styles.material}>
          {product.material || product.artisanNote}
        </AppText>
        <View style={styles.nameRow}>
          <AppText variant="title" numberOfLines={2} style={styles.name}>
            {product.name}
          </AppText>
          <Stars rating={product.rating} size={11} />
        </View>
        {product.tagline ? (
          <AppText variant="bodySoft" numberOfLines={2} style={styles.tagline}>
            {product.tagline}
          </AppText>
        ) : null}

        <View style={styles.priceRow}>
          <View style={styles.priceStack}>
            <AppText variant="price">{formatPriceCompact(product.priceCents)}</AppText>
            {onSale && product.compareAtCents ? (
              <AppText variant="small" style={styles.compare}>
                {formatPriceCompact(product.compareAtCents)}
              </AppText>
            ) : null}
          </View>

          <AppText variant="small" numberOfLines={1} style={styles.artisan}>
            {product.artisanNote}
          </AppText>
        </View>

        {onAdd ? (
          <View style={styles.addRow}>
            <AppText variant="small" style={styles.addHint}>
              Quick add
            </AppText>
            <Pressable
              accessibilityLabel={`Add ${product.name} to bag`}
              onPress={onAdd}
              hitSlop={6}
              style={styles.add}>
              <Ionicons name="add" size={16} color={palette.white} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  imageWrap: {
    aspectRatio: 0.82,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: palette.surfaceSunk,
  },
  image: { width: "100%", height: "100%" },
  badgeSlot: { position: "absolute", top: spacing.sm, left: spacing.sm },
  heart: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { gap: 3 },
  material: { color: palette.muted, fontSize: 9 },
  name: { fontSize: 17, lineHeight: 22 },
  nameRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  tagline: { fontSize: 12 },
  priceRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceStack: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  compare: { textDecorationLine: "line-through" },
  artisan: { flexShrink: 1, textAlign: "right", color: palette.muted },
  addRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addHint: { color: palette.muted },
  add: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
  },
});
