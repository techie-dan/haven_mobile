import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";

import { AppText } from "@/ui/text";
import { Button } from "@/ui/button";
import { Divider, Eyebrow } from "@/ui/bits";
import { Field, SelectField } from "@/ui/field";
import { PageHeader } from "@/ui/header";
import { Screen } from "@/ui/screen";
import { useAuth } from "@/providers/auth";
import { useCart } from "@/providers/cart";
import { computeTotals, deliveryOptions, formatPrice } from "@/lib/pricing";
import { SITE_URL } from "@/lib/env";
import { DEFAULT_COUNTRY, NIGERIAN_STATES } from "@/lib/nigeria";
import { supabase } from "@/lib/supabase";
import { palette, radius, spacing } from "@/theme";
import type { DeliveryKey, PlaceOrderResult, ShippingAddress } from "@/lib/types";

type FormKey = keyof ShippingAddress;

export default function CheckoutScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { lines, clear, hydrated } = useCart();

  const [delivery, setDelivery] = useState<DeliveryKey>("white_glove");
  const [giftNote, setGiftNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlaceOrderResult | null>(null);

  // Edits layer over the profile defaults, so a late-loading profile fills the
  // form without an effect writing state a field at a time.
  const [edits, setEdits] = useState<Partial<ShippingAddress>>({});
  const form: ShippingAddress = {
    fullName: edits.fullName ?? profile?.full_name ?? "",
    email: edits.email ?? profile?.email ?? user?.email ?? "",
    phone: edits.phone ?? profile?.phone ?? "",
    line1: edits.line1 ?? profile?.address_line1 ?? "",
    line2: edits.line2 ?? profile?.address_line2 ?? "",
    city: edits.city ?? profile?.city ?? "",
    state: edits.state ?? profile?.state ?? "",
    postalCode: edits.postalCode ?? profile?.postal_code ?? "",
    country: edits.country ?? profile?.country ?? DEFAULT_COUNTRY,
  };

  const set = (key: FormKey) => (value: string) =>
    setEdits((prev) => ({ ...prev, [key]: value }));

  const totals = useMemo(() => computeTotals(lines, delivery), [lines, delivery]);

  if (placed) {
    return (
      <Screen edges={["top"]}>
        <PageHeader title="Order Confirmed" showBag={false} onBack={() => router.replace("/")} />
        <ScrollView contentContainerStyle={styles.confirmContent}>
          <Ionicons name="checkmark-circle-outline" size={48} color={palette.sage} />
          <AppText variant="displayLarge" style={styles.confirmTitle}>
            Thank you.
          </AppText>
          <AppText variant="subtitle" style={styles.center}>
            Order {placed.orderNumber} is confirmed.
          </AppText>
          <View style={styles.confirmCard}>
            <View style={styles.summaryRow}>
              <AppText variant="bodySoft">Total</AppText>
              <AppText variant="body">{formatPrice(placed.totalCents)}</AppText>
            </View>
            {placed.deliveryName ? (
              <View style={styles.summaryRow}>
                <AppText variant="bodySoft">Delivery</AppText>
                <AppText variant="bodySoft">{placed.deliveryName}</AppText>
              </View>
            ) : null}
            <View style={styles.summaryRow}>
              <AppText variant="bodySoft">Confirmation</AppText>
              <AppText variant="bodySoft">{placed.email}</AppText>
            </View>
          </View>
          <Button label="Back to Discover" onPress={() => router.replace("/")} />
        </ScrollView>
      </Screen>
    );
  }

  if (!hydrated) {
    return (
      <Screen edges={["top"]}>
        <PageHeader title="Checkout" />
      </Screen>
    );
  }
  if (lines.length === 0) return <Redirect href="/bag" />;

  async function placeOrder() {
    setError(null);
    setBusy(true);
    try {
      const token = supabase
        ? (await supabase.auth.getSession()).data.session?.access_token
        : null;

      const response = await fetch(`${SITE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
          address: form,
          delivery,
          giftNote,
          paymentMethod: "card",
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | (PlaceOrderResult & { error?: string })
        | null;

      if (!response.ok || !body?.orderNumber) {
        throw new Error(body?.error ?? "We could not place your order. Please try again.");
      }

      clear();
      setPlaced(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setBusy(false);
    }
  }

  const disabled =
    !form.fullName || !form.email || !form.line1 || !form.city || !form.state;

  return (
    <Screen edges={["top"]}>
      <PageHeader title="Checkout Flow" showBag={false} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.secureRow}>
            <Ionicons name="lock-closed" size={12} color={palette.sage} />
            <Eyebrow>256-bit encrypted Haven checkout</Eyebrow>
          </View>

          {user ? (
            <Eyebrow>Signed in as {user.email}</Eyebrow>
          ) : (
            <Pressable onPress={() => router.push("/login")}>
              <Eyebrow style={styles.signInLink}>Sign in to use your saved address →</Eyebrow>
            </Pressable>
          )}

          <View style={styles.section}>
            <Eyebrow style={styles.sectionTitle}>Contact &amp; Destination</Eyebrow>
            <Field label="Full Name" value={form.fullName} onChangeText={set("fullName")} placeholder="Amaka Okafor" />
            <Field
              label="Email"
              value={form.email}
              onChangeText={set("email")}
              placeholder="amaka.okafor@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field label="Phone" value={form.phone} onChangeText={set("phone")} placeholder="+234 803 123 4567" keyboardType="phone-pad" />
            <Field label="Address Line 1" value={form.line1} onChangeText={set("line1")} placeholder="12B Admiralty Way" />
            <Field label="Address Line 2" value={form.line2} onChangeText={set("line2")} placeholder="Optional" />
            <Field label="City" value={form.city} onChangeText={set("city")} placeholder="Lekki" />
            <View style={styles.twoUp}>
              <View style={styles.flex}>
                <SelectField
                  label="State"
                  value={form.state}
                  placeholder="Select state"
                  options={NIGERIAN_STATES}
                  onSelect={set("state")}
                />
              </View>
              <View style={styles.flex}>
                <Field
                  label="Postal Code"
                  value={form.postalCode}
                  onChangeText={set("postalCode")}
                  placeholder="106104"
                  autoCapitalize="characters"
                />
              </View>
            </View>
            <Field label="Country" value={form.country} onChangeText={set("country")} placeholder="Nigeria" />
          </View>

          <View style={styles.section}>
            <Eyebrow style={styles.sectionTitle}>Delivery Method</Eyebrow>
            {deliveryOptions.map((option) => {
              const active = option.key === delivery;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setDelivery(option.key)}
                  style={[styles.option, active && styles.optionActive]}>
                  <Ionicons
                    name={active ? "radio-button-on" : "radio-button-off"}
                    size={18}
                    color={active ? palette.terracotta : palette.muted}
                  />
                  <View style={styles.flex}>
                    <View style={styles.optionHead}>
                      <AppText variant="body">{option.name}</AppText>
                      <AppText variant="body">
                        {formatPrice(option.priceCents)}
                      </AppText>
                    </View>
                    <AppText variant="bodySoft">{option.blurb}</AppText>
                    {option.recommended ? (
                      <Eyebrow style={styles.recommended}>Recommended</Eyebrow>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.giftRow} onPress={() => setGiftNote((v) => !v)}>
            <Ionicons
              name={giftNote ? "checkbox" : "square-outline"}
              size={18}
              color={giftNote ? palette.terracotta : palette.muted}
            />
            <AppText variant="bodySoft">
              Include a complimentary handwritten atelier gift note
            </AppText>
          </Pressable>

          <View style={styles.section}>
            <Eyebrow style={styles.sectionTitle}>Order Summary</Eyebrow>
            <View style={styles.summaryRow}>
              <AppText variant="bodySoft">Subtotal</AppText>
              <AppText variant="body">{formatPrice(totals.subtotalCents)}</AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText variant="bodySoft">Shipping</AppText>
              <AppText variant="body">
                {totals.shippingComped ? "Complimentary" : formatPrice(totals.shippingCents)}
              </AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText variant="bodySoft">Estimated tax</AppText>
              <AppText variant="body">{formatPrice(totals.taxCents)}</AppText>
            </View>
            <Divider style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <AppText variant="title">Total</AppText>
              <AppText variant="title">{formatPrice(totals.totalCents)}</AppText>
            </View>
          </View>

          {error ? (
            <View style={styles.banner}>
              <AppText variant="bodySoft" style={styles.bannerError}>
                {error}
              </AppText>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.stickyBar}>
          <Button
            label={`Authorize & Order · ${formatPrice(totals.totalCents)}`}
            loading={busy}
            disabled={disabled}
            onPress={placeOrder}
          />
          <AppText variant="small" style={styles.terms}>
            By tapping authorize, you acknowledge the Haven Studio Terms &amp;
            Provenance Charter.
          </AppText>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  secureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, justifyContent: "center" },
  signInLink: { color: palette.terracotta },
  section: { gap: spacing.md, marginTop: spacing.md },
  sectionTitle: { color: palette.inkSoft },
  twoUp: { flexDirection: "row", gap: spacing.md },
  option: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
  },
  optionActive: { borderColor: palette.ink, backgroundColor: palette.surfaceSunk },
  optionHead: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  recommended: { color: palette.terracotta, marginTop: spacing.xs },
  giftRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.md },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryDivider: { marginVertical: spacing.sm },
  banner: {
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: palette.terracottaSoft,
    borderWidth: 1,
    borderColor: palette.line,
  },
  bannerError: { color: palette.terracotta },
  stickyBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    backgroundColor: palette.surface,
    gap: spacing.sm,
  },
  terms: { textAlign: "center", lineHeight: 16 },
  confirmContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
    alignItems: "center",
  },
  confirmTitle: { marginTop: spacing.sm },
  center: { textAlign: "center" },
  confirmCard: {
    alignSelf: "stretch",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surfaceSunk,
    marginVertical: spacing.md,
  },
});
