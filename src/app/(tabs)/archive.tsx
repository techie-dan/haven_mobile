import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppText } from "@/ui/text";
import { Eyebrow } from "@/ui/bits";
import { ProductCard } from "@/ui/product-card";
import { Screen } from "@/ui/screen";
import { useCatalog } from "@/providers/catalog";
import { useCart } from "@/providers/cart";
import { useSaved } from "@/providers/saved";
import { palette, radius, spacing } from "@/theme";

const FILTERS = [
  { slug: "all", name: "All" },
  { slug: "living-furniture", name: "Furniture" },
  { slug: "ceramics-tableware", name: "Ceramics" },
  { slug: "lighting", name: "Lighting" },
  { slug: "scents-textiles", name: "Textiles" },
];

export default function ArchiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { products, loading, error } = useCatalog();
  const { addItem } = useCart();
  const { isSaved, toggle } = useSaved();

  const [active, setActive] = useState<string>(params.category ?? "all");

  const visible = useMemo(
    () => (active === "all" ? products : products.filter((p) => p.categorySlug === active)),
    [products, active],
  );

  const heading = FILTERS.find((f) => f.slug === active)?.name ?? "Archive";

  return (
    <Screen edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Eyebrow>Archive · {heading}</Eyebrow>
        <AppText variant="displayLarge" style={styles.title}>
          The Collection
        </AppText>
        <AppText variant="subtitle" style={styles.copy}>
          {visible.length} works · Hand-finished pieces curated in Lagos from
          studios at home and abroad.
        </AppText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          {FILTERS.map((filter) => {
            const isActive = filter.slug === active;
            return (
              <Pressable
                key={filter.slug}
                onPress={() => setActive(filter.slug)}
                style={[styles.chip, isActive && styles.chipActive]}>
                <Eyebrow style={isActive ? styles.chipTextActive : undefined}>
                  {filter.name}
                </Eyebrow>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={palette.ink} style={styles.loader} />
        ) : error ? (
          <AppText variant="bodySoft" style={styles.center}>
            {error}
          </AppText>
        ) : (
          <>
            <View style={styles.grid}>
              {visible.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  width="48%"
                  saved={isSaved(product.id)}
                  onToggleSaved={() => toggle(product.id)}
                  onPress={() => router.push(`/product/${product.slug}`)}
                  onAdd={() => addItem(product, 1)}
                />
              ))}
            </View>
            <Eyebrow style={styles.countLine}>
              Showing {visible.length} of {products.length} archive works
            </Eyebrow>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },
  title: { marginTop: spacing.xs },
  copy: { marginBottom: spacing.md },
  filters: { gap: spacing.sm, paddingVertical: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.lineStrong,
    backgroundColor: palette.surface,
  },
  chipActive: { backgroundColor: palette.ink, borderColor: palette.ink },
  chipTextActive: { color: palette.white },
  grid: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.xl,
  },
  loader: { marginVertical: spacing.xxl },
  center: { textAlign: "center", marginVertical: spacing.xxl },
  countLine: { textAlign: "center", marginTop: spacing.xxl, color: palette.inkSoft },
});
