import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { BrandHeader } from "@/ui/header";
import { AppText } from "@/ui/text";
import { Eyebrow } from "@/ui/bits";
import { ProductCard } from "@/ui/product-card";
import { Screen } from "@/ui/screen";
import { useCatalog } from "@/providers/catalog";
import { useCart } from "@/providers/cart";
import { useSaved } from "@/providers/saved";
import { palette, spacing } from "@/theme";

export default function SavedScreen() {
  const router = useRouter();
  const { products } = useCatalog();
  const { addItem } = useCart();
  const { ids, isSaved, toggle } = useSaved();

  const savedProducts = products.filter((p) => ids.includes(p.id));

  return (
    <Screen edges={["top"]}>
      <BrandHeader title="Saved" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Eyebrow>Your Study · {savedProducts.length} pieces</Eyebrow>
        <AppText variant="displayLarge" style={styles.title}>
          Kept for Later
        </AppText>
        <AppText variant="subtitle" style={styles.copy}>
          A private list of objects you are considering. Saved pieces stay on this
          device.
        </AppText>

        {savedProducts.length === 0 ? (
          <View style={styles.empty}>
            <Eyebrow>Nothing saved yet</Eyebrow>
            <AppText variant="bodySoft" style={styles.emptyCopy}>
              Tap the heart on any piece in the collection to keep it here.
            </AppText>
          </View>
        ) : (
          <View style={styles.grid}>
            {savedProducts.map((product) => (
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
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },
  title: { marginTop: spacing.xs },
  copy: { marginBottom: spacing.lg },
  grid: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.xl,
  },
  empty: {
    marginTop: spacing.xxl,
    padding: spacing.xl,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surfaceSunk,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyCopy: { textAlign: "center" },
});
