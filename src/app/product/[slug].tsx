import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppText } from "@/ui/text";
import { Button } from "@/ui/button";
import { Eyebrow, Stars } from "@/ui/bits";
import { PageHeader } from "@/ui/header";
import { Stepper } from "@/ui/stepper";
import { Screen } from "@/ui/screen";
import { useCart } from "@/providers/cart";
import { useCatalog } from "@/providers/catalog";
import { useSaved } from "@/providers/saved";
import { formatPrice, formatPriceCompact } from "@/lib/pricing";
import { palette, radius, spacing } from "@/theme";
import type { Product } from "@/lib/types";

const FINISHES = ["Chalk White", "Terracotta", "Charcoal Ash"];

const DETAILS: { title: string; body: string }[] = [
  {
    title: "Dimensions & Capacity",
    body: "Standard: 10\" height · 3.7L capacity. Grande: 13\" height · 7.4L capacity.",
  },
  {
    title: "Artisanal Craft & Provenance",
    body: "Thrown on a traditional potter's wheel in rural Portugal, then finished with a breathable matte chalk wash that patinas over time.",
  },
  {
    title: "Care & Longevity",
    body: "Hand wash with a soft sponge. Avoid thermal shock; the unglazed exterior is naturally stain-resistant.",
  },
  {
    title: "Complimentary Insured Delivery",
    body: "Double-boxed in wood-fibre casing and fully insured against transit damage.",
  },
];

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { products, loading } = useCatalog();
  const { addItem } = useCart();
  const { isSaved, toggle } = useSaved();

  const [quantity, setQuantity] = useState(1);
  const [openDetail, setOpenDetail] = useState<number | null>(null);

  const product = useMemo(
    () => products.find((p) => p.slug === slug) as Product | undefined,
    [products, slug],
  );

  const related = useMemo(
    () =>
      product
        ? products.filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, 4)
        : [],
    [products, product],
  );

  if (!product) {
    return (
      <Screen edges={["top"]}>
        <PageHeader showBag />
        {loading ? (
          <ActivityIndicator color={palette.ink} style={styles.loader} />
        ) : (
          <AppText variant="bodySoft" style={styles.missing}>
            This piece could not be found.
          </AppText>
        )}
      </Screen>
    );
  }

  const saved = isSaved(product.id);
  const onSale =
    product.compareAtCents !== undefined && product.compareAtCents > product.priceCents;

  return (
    <Screen edges={["top"]}>
      <PageHeader title="Product Details" showBag />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: product.imageUrl }} style={styles.image} contentFit="cover" />
          {product.badge ? (
            <View style={styles.imageBadge}>
              <Eyebrow style={styles.imageBadgeText}>{product.badge}</Eyebrow>
            </View>
          ) : null}
          <Pressable
            accessibilityLabel={saved ? "Remove from saved" : "Save item"}
            onPress={() => toggle(product.id)}
            style={styles.imageHeart}>
            <Ionicons
              name={saved ? "heart" : "heart-outline"}
              size={18}
              color={saved ? palette.terracotta : palette.ink}
            />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Eyebrow>{product.material || "Studio Selection"}</Eyebrow>
          <Stars rating={product.rating} count={product.reviewCount} />
          <AppText variant="displayLarge" style={styles.name}>
            {product.name}
          </AppText>
          <View style={styles.priceRow}>
            <AppText variant="price" style={styles.price}>
              {formatPrice(product.priceCents)}
            </AppText>
            {onSale && product.compareAtCents ? (
              <AppText variant="bodySoft" style={styles.compare}>
                {formatPrice(product.compareAtCents)}
              </AppText>
            ) : null}
            <Eyebrow>Tax included</Eyebrow>
          </View>

          <View style={styles.provenance}>
            <Eyebrow style={styles.provenanceEyebrow}>Provenance & Soul</Eyebrow>
            <AppText variant="body" style={styles.provenanceCopy}>
              {product.description || product.tagline}
            </AppText>
          </View>

          <View style={styles.finishRow}>
            {FINISHES.map((finish, index) => (
              <View key={finish} style={styles.finish}>
                <View
                  style={[
                    styles.swatch,
                    index === 0 && styles.swatchOn,
                    { backgroundColor: ["#eae4da", "#c1613c", "#3c3733"][index] },
                  ]}
                />
                <AppText variant="small">{finish}</AppText>
              </View>
            ))}
          </View>

          <View style={styles.scaleCards}>
            <View style={[styles.scaleCard, styles.scaleCardActive]}>
              <Eyebrow>Standard</Eyebrow>
              <AppText variant="body">10&quot; height · 3.7L</AppText>
              <AppText variant="title">{formatPriceCompact(product.priceCents)}</AppText>
            </View>
            <View style={styles.scaleCard}>
              <Eyebrow>Grande</Eyebrow>
              <AppText variant="body">13&quot; height · 7.4L</AppText>
              <AppText variant="title">+$15</AppText>
            </View>
          </View>

          {DETAILS.map((detail, index) => {
            const open = openDetail === index;
            return (
              <Pressable
                key={detail.title}
                onPress={() => setOpenDetail(open ? null : index)}
                style={styles.detailRow}>
                <View style={styles.detailHead}>
                  <AppText variant="title" style={styles.detailTitle}>
                    {detail.title}
                  </AppText>
                  <Ionicons
                    name={open ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={palette.ink}
                  />
                </View>
                {open ? (
                  <AppText variant="bodySoft" style={styles.detailBody}>
                    {detail.body}
                  </AppText>
                ) : null}
              </Pressable>
            );
          })}

          <View style={styles.makerCard}>
            <Image source={{ uri: product.imageUrl }} style={styles.makerImage} contentFit="cover" />
            <View style={styles.makerBody}>
              <Eyebrow style={styles.makerEyebrow}>The Maker&apos;s Hand</Eyebrow>
              <AppText variant="display" style={styles.makerQuote}>
                “Form follows the potter&apos;s quiet breath.”
              </AppText>
              <AppText variant="bodySoft" style={styles.makerCopy}>
                Master ceramicist {product.artisanNote || "studio-made"} shapes each
                vessel by hand, so no two read alike.
              </AppText>
            </View>
          </View>

          {related.length > 0 ? (
            <>
              <Eyebrow style={styles.relatedEyebrow}>Harmonious Living</Eyebrow>
              <AppText variant="display" style={styles.relatedTitle}>
                Complete the Setting
              </AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedRow}>
                {related.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.relatedCard}
                    onPress={() => router.push(`/product/${item.slug}`)}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.relatedImage}
                      contentFit="cover"
                    />
                    <AppText variant="bodySoft" numberOfLines={2} style={styles.relatedName}>
                      {item.name}
                    </AppText>
                    <AppText variant="body">{formatPriceCompact(item.priceCents)}</AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}

          <View style={styles.sentiment}>
            <Eyebrow>Collector Sentiment</Eyebrow>
            <View style={styles.sentimentHead}>
              <View style={styles.sentimentScore}>
                <AppText variant="displayLarge" style={styles.sentimentNumber}>
                  4.9
                </AppText>
                <Eyebrow>over {Math.max(product.reviewCount, 5)}</Eyebrow>
              </View>
              <AppText variant="body" style={styles.sentimentQuote}>
                “The weight of the handle is pure balance. It brings a grounded,
                monastic presence to our dining table every single morning.”
              </AppText>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.stickyBar}>
        <Stepper value={quantity} onChange={setQuantity} />
        <Button
          label={`Add to Bag · ${formatPrice(product.priceCents * quantity)}`}
          style={styles.stickyButton}
          onPress={() => {
            addItem(product, quantity);
            router.push("/bag");
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xxxl },
  missing: { textAlign: "center", marginTop: spacing.xxxl },
  content: { paddingBottom: spacing.xxxl },
  imageWrap: {
    aspectRatio: 0.86,
    marginHorizontal: spacing.lg,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: palette.surfaceSunk,
  },
  image: { width: "100%", height: "100%" },
  imageBadge: { position: "absolute", top: spacing.md, left: spacing.md },
  imageBadgeText: { color: palette.terracotta },
  imageHeart: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm },
  name: { marginTop: spacing.xs },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.md },
  price: { fontSize: 20 },
  compare: { textDecorationLine: "line-through" },
  provenance: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceSunk,
    borderWidth: 1,
    borderColor: palette.line,
    gap: spacing.xs,
  },
  provenanceEyebrow: { color: palette.terracotta },
  provenanceCopy: { lineHeight: 22 },
  finishRow: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.lg },
  finish: { alignItems: "center", gap: spacing.xs },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.line,
  },
  swatchOn: { borderWidth: 2, borderColor: palette.ink },
  scaleCards: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  scaleCard: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
  },
  scaleCardActive: { backgroundColor: palette.ink },
  detailRow: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  detailHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailTitle: { fontSize: 17 },
  detailBody: { lineHeight: 21 },
  makerCard: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: palette.ink,
  },
  makerImage: { width: "100%", aspectRatio: 1.6 },
  makerBody: { padding: spacing.lg, gap: spacing.sm },
  makerEyebrow: { color: palette.brass },
  makerQuote: { color: palette.white, fontSize: 20, lineHeight: 26 },
  makerCopy: { color: palette.lineStrong },
  relatedEyebrow: { marginTop: spacing.xxl },
  relatedTitle: { marginTop: 2, marginBottom: spacing.md },
  relatedRow: { gap: spacing.md },
  relatedCard: { width: 160, gap: spacing.xs },
  relatedImage: {
    width: 160,
    height: 190,
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceSunk,
  },
  relatedName: { lineHeight: 17 },
  sentiment: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceSunk,
    borderWidth: 1,
    borderColor: palette.line,
    gap: spacing.md,
  },
  sentimentHead: { gap: spacing.md },
  sentimentScore: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  sentimentNumber: { fontSize: 40, lineHeight: 44 },
  sentimentQuote: { lineHeight: 22 },
  stickyBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    backgroundColor: palette.surface,
  },
  stickyButton: { flex: 1 },
});
