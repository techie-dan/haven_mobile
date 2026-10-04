import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import { BrandHeader } from "@/ui/header";
import { AppText } from "@/ui/text";
import { Button } from "@/ui/button";
import { Eyebrow } from "@/ui/bits";
import { ProductCard } from "@/ui/product-card";
import { Screen } from "@/ui/screen";
import { useCart } from "@/providers/cart";
import { useCatalog } from "@/providers/catalog";
import { useSaved } from "@/providers/saved";
import { categories } from "@/lib/catalog";
import { palette, radius, spacing } from "@/theme";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80";

export default function DiscoverScreen() {
  const router = useRouter();
  const { products, loading, error } = useCatalog();
  const { addItem } = useCart();
  const { isSaved, toggle } = useSaved();

  const heroImage = products[0]?.imageUrl ?? HERO_FALLBACK;

  const collections = useMemo(
    () =>
      categories
        .filter((c) => c.slug !== "journal")
        .slice(0, 4)
        .map((category) => {
          const cover = products.find((p) => p.categorySlug === category.slug);
          return { ...category, imageUrl: cover?.imageUrl ?? HERO_FALLBACK };
        }),
    [products],
  );

  const grid = products.slice(0, 8);

  return (
    <Screen edges={["top"]}>
      <BrandHeader title="Discover" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <Eyebrow style={styles.heroEyebrow}>Discovery · Grand Source</Eyebrow>
        <AppText variant="displayLarge" style={styles.heroTitle}>
          Objects of Intention & Quiet Warmth
        </AppText>
        <AppText variant="subtitle" style={styles.heroCopy}>
          Architectural homeware, sculpted ceramics, and natural textiles crafted
          for slow, deliberate living.
        </AppText>

        <View style={styles.heroImageWrap}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} contentFit="cover" />
        </View>

        <View style={styles.heroActions}>
          <Button
            label="Explore Collection"
            style={styles.heroButton}
            onPress={() => router.push("/archive")}
          />
          <Button
            label="Journal"
            variant="outline"
            style={styles.heroButton}
            onPress={() => router.push("/archive")}
          />
        </View>

        <View style={styles.featureRow}>
          <Eyebrow>Small-Batch Craft</Eyebrow>
          <Eyebrow>·</Eyebrow>
          <Eyebrow>Natural Glazes</Eyebrow>
          <Eyebrow>·</Eyebrow>
          <Eyebrow>Certified Materials</Eyebrow>
        </View>

        <View style={styles.sectionHead}>
          <View>
            <Eyebrow>Collections</Eyebrow>
            <AppText variant="display" style={styles.sectionTitle}>
              Curated Disciplines
            </AppText>
          </View>
          <Pressable onPress={() => router.push("/archive")} hitSlop={8}>
            <Eyebrow style={styles.indexLink}>Index →</Eyebrow>
          </Pressable>
        </View>

        <View style={styles.collectionGrid}>
          {collections.map((category) => (
            <Pressable
              key={category.slug}
              style={styles.collectionTile}
              onPress={() => router.push(`/archive?category=${category.slug}`)}>
              <Image
                source={{ uri: category.imageUrl }}
                style={styles.collectionImage}
                contentFit="cover"
              />
              <View style={styles.collectionLabel}>
                <AppText variant="title" style={styles.collectionName}>
                  {category.name}
                </AppText>
                <Eyebrow>
                  {products.filter((p) => p.categorySlug === category.slug).length} Pieces
                </Eyebrow>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <View>
            <Eyebrow>Handcrafted Signatures</Eyebrow>
            <AppText variant="display" style={styles.sectionTitle}>
              Permanent Collection
            </AppText>
          </View>
          <Eyebrow style={styles.indexLink}>Spring Batch</Eyebrow>
        </View>

        {loading ? (
          <ActivityIndicator color={palette.ink} style={styles.loader} />
        ) : error ? (
          <AppText variant="bodySoft" style={styles.errorText}>
            {error}
          </AppText>
        ) : (
          <View style={styles.grid}>
            {grid.map((product) => (
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
        )}

        <View style={styles.brandBand}>
          <Image source={{ uri: heroImage }} style={styles.bandImage} contentFit="cover" />
          <View style={styles.bandBody}>
            <Eyebrow style={styles.bandEyebrow}>The Haven Manifesto</Eyebrow>
            <AppText variant="display" style={styles.bandQuote}>
              “We reject disposable furniture. A vessel should honor the clay from
              which it rose and the lining that holds it.”
            </AppText>
            <Eyebrow>— Mette Mortensen, Curator</Eyebrow>
            <View style={styles.bandStats}>
              <View>
                <AppText variant="displayLarge" style={styles.bandStat}>
                  84
                </AppText>
                <Eyebrow>Artisan Collaborations</Eyebrow>
              </View>
              <View>
                <AppText variant="displayLarge" style={styles.bandStat}>
                  100%
                </AppText>
                <Eyebrow>Design-Matched Easel</Eyebrow>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.invite}>
          <Eyebrow style={styles.inviteEyebrow}>Haven Gazette</Eyebrow>
          <AppText variant="display" style={styles.inviteTitle}>
            Private Invitations & Studio Releases
          </AppText>
          <AppText variant="bodySoft" style={styles.inviteCopy}>
            Be first to access limited small-batch liners, archival releases, and
            stories on slow living.
          </AppText>
          <Button label="Join" onPress={() => router.push("/account")} style={styles.inviteButton} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  heroEyebrow: { color: palette.inkSoft },
  heroTitle: { marginTop: spacing.xs },
  heroCopy: { marginBottom: spacing.sm },
  heroImageWrap: {
    aspectRatio: 1.4,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: palette.surfaceSunk,
  },
  heroImage: { width: "100%", height: "100%" },
  heroActions: { flexDirection: "row", gap: spacing.md },
  heroButton: { flex: 1 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  sectionHead: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionTitle: { marginTop: 2 },
  indexLink: { color: palette.terracotta },
  collectionGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  collectionTile: { width: "48%", marginTop: spacing.md },
  collectionImage: {
    width: "100%",
    aspectRatio: 0.95,
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceSunk,
  },
  collectionLabel: { paddingTop: spacing.sm, gap: 2 },
  collectionName: { fontSize: 18, lineHeight: 22 },
  grid: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.xl,
  },
  loader: { marginVertical: spacing.xxl },
  errorText: { marginVertical: spacing.xl, textAlign: "center" },
  brandBand: {
    marginTop: spacing.xxl,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: palette.surfaceSunk,
    borderWidth: 1,
    borderColor: palette.line,
  },
  bandImage: { width: "100%", aspectRatio: 1.6, backgroundColor: palette.line },
  bandBody: { padding: spacing.lg, gap: spacing.sm },
  bandEyebrow: { color: palette.terracotta },
  bandQuote: { fontSize: 20, lineHeight: 26 },
  bandStats: { flexDirection: "row", gap: spacing.xxl, marginTop: spacing.md },
  bandStat: { fontSize: 30, lineHeight: 34 },
  invite: {
    marginTop: spacing.xxl,
    backgroundColor: palette.ink,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  inviteEyebrow: { color: palette.brass },
  inviteTitle: { color: palette.white, fontSize: 24, lineHeight: 30 },
  inviteCopy: { color: palette.lineStrong },
  inviteButton: { marginTop: spacing.md, backgroundColor: palette.brass },
});
