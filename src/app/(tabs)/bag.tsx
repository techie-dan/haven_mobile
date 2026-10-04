import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { BrandHeader } from "@/ui/header";
import { AppText } from "@/ui/text";
import { Button } from "@/ui/button";
import { Divider, Eyebrow } from "@/ui/bits";
import { Stepper } from "@/ui/stepper";
import { Screen } from "@/ui/screen";
import { useCart } from "@/providers/cart";
import { useAuth } from "@/providers/auth";
import { formatPrice } from "@/lib/pricing";
import { palette, radius, spacing } from "@/theme";

export default function BagScreen() {
  const router = useRouter();
  const { lines, subtotalCents, setQuantity, removeItem, hydrated, synced } = useCart();
  const { user } = useAuth();

  const freeShippingGap = Math.max(0, 15000 - subtotalCents);

  return (
    <Screen edges={["top"]}>
      <BrandHeader title="Your Bag" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {user ? (
          <View style={styles.syncRow}>
            <View style={[styles.dot, synced ? styles.dotOn : styles.dotOff]} />
            <Eyebrow>
              {synced ? "Synced live across your devices" : "Connecting to your account…"}
            </Eyebrow>
          </View>
        ) : (
          <Pressable style={styles.syncRow} onPress={() => router.push("/login")}>
            <Ionicons name="cloud-outline" size={14} color={palette.terracotta} />
            <Eyebrow style={styles.syncLink}>
              Sign in to sync this bag with the website →
            </Eyebrow>
          </Pressable>
        )}

        {!hydrated ? null : lines.length === 0 ? (
          <View style={styles.empty}>
            <Eyebrow>Your bag is empty</Eyebrow>
            <AppText variant="bodySoft" style={styles.emptyCopy}>
              Pieces you add here appear on every device signed in to your account.
            </AppText>
            <Button
              label="Browse the collection"
              variant="outline"
              style={styles.emptyButton}
              onPress={() => router.push("/archive")}
            />
          </View>
        ) : (
          <>
            {lines.map((line) => (
              <View key={line.product.id} style={styles.line}>
                <Image
                  source={{ uri: line.product.imageUrl }}
                  style={styles.thumb}
                  contentFit="cover"
                />
                <View style={styles.lineBody}>
                  <Eyebrow>{line.product.material}</Eyebrow>
                  <AppText variant="title" numberOfLines={2} style={styles.lineName}>
                    {line.product.name}
                  </AppText>
                  <AppText variant="price" style={styles.linePrice}>
                    {formatPrice(line.product.priceCents * line.quantity)}
                  </AppText>
                  <View style={styles.lineControls}>
                    <Stepper
                      value={line.quantity}
                      onChange={(next) => setQuantity(line.product.id, next)}
                    />
                    <Pressable
                      accessibilityLabel={`Remove ${line.product.name}`}
                      onPress={() => removeItem(line.product.id)}
                      hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={palette.muted} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            <Divider style={styles.divider} />

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <AppText variant="bodySoft">Subtotal</AppText>
                <AppText variant="body">{formatPrice(subtotalCents)}</AppText>
              </View>
              <View style={styles.summaryRow}>
                <AppText variant="bodySoft">Shipping</AppText>
                <AppText variant="bodySoft">
                  {subtotalCents === 0 ? "—" : freeShippingGap === 0 ? "Complimentary" : "At checkout"}
                </AppText>
              </View>
              <View style={styles.summaryRow}>
                <AppText variant="bodySoft">Tax</AppText>
                <AppText variant="bodySoft">At checkout</AppText>
              </View>
              <Divider style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <AppText variant="title">Total</AppText>
                <AppText variant="title">{formatPrice(subtotalCents)}</AppText>
              </View>
              {freeShippingGap > 0 ? (
                <Eyebrow style={styles.gap}>
                  {formatPrice(freeShippingGap)} to complimentary insured shipping
                </Eyebrow>
              ) : (
                <Eyebrow style={styles.gap}>Complimentary insured shipping unlocked</Eyebrow>
              )}
            </View>

            <Button label="Proceed to Checkout" onPress={() => router.push("/checkout")} />
            <AppText variant="small" style={styles.terms}>
              Insured shipping, 30-day home trial, and our Haven Guarantee apply to
              every order.
            </AppText>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
  syncRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotOn: { backgroundColor: palette.sage },
  dotOff: { backgroundColor: palette.muted },
  syncLink: { color: palette.terracotta },
  empty: {
    marginTop: spacing.xxl,
    padding: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surfaceSunk,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyCopy: { textAlign: "center" },
  emptyButton: { alignSelf: "stretch", marginTop: spacing.sm },
  line: { flexDirection: "row", gap: spacing.md },
  thumb: {
    width: 92,
    height: 112,
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceSunk,
  },
  lineBody: { flex: 1, gap: 3 },
  lineName: { fontSize: 17, lineHeight: 22 },
  linePrice: { marginTop: 2 },
  lineControls: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  divider: { marginVertical: spacing.sm },
  summary: { gap: spacing.sm },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryDivider: { marginVertical: spacing.sm },
  gap: { color: palette.terracotta, marginTop: spacing.xs },
  terms: { textAlign: "center", lineHeight: 16 },
});
