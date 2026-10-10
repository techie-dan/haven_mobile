import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { BrandHeader } from "@/ui/header";
import { AppText } from "@/ui/text";
import { Button } from "@/ui/button";
import { Divider, Eyebrow } from "@/ui/bits";
import { Screen } from "@/ui/screen";
import { useAuth } from "@/providers/auth";
import { getAccountOrders, type AccountOrder } from "@/lib/orders";
import { findDeliveryOption, formatPrice } from "@/lib/pricing";
import type { DeliveryKey } from "@/lib/types";
import { palette, radius, spacing } from "@/theme";

/** Matches the website's account page: sage = moving, brass = pending,
 *  terracotta = cancelled/refunded. */
function statusTone(status: string): string {
  switch (status) {
    case "pending":
      return palette.brass;
    case "cancelled":
    case "refunded":
      return palette.terracotta;
    default:
      return palette.sage;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AccountTabScreen() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  const userId = user?.id ?? null;
  // Keyed by user id so a previous customer's orders can never leak across
  // accounts; a signed-out session simply fails the match below and reads as
  // an empty, non-loading state without resetting anything inside an effect.
  const [ordersState, setOrdersState] = useState<{
    userId: string;
    orders: AccountOrder[];
    error: string | null;
  } | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // Order history belongs to the signed-in identity, so it is keyed by user id
  // and re-fetched whenever that identity changes. State is only touched from
  // promise callbacks, never synchronously in the effect body.
  useEffect(() => {
    if (!userId) return;

    let active = true;

    getAccountOrders()
      .then((next) => {
        if (!active) return;
        setOrdersState({ userId, orders: next, error: null });
      })
      .catch((err) => {
        if (!active) return;
        // Raw Supabase errors (e.g. a missing table before the migration is
        // applied) are not actionable for the customer.
        console.error("[account] order history failed:", err);
        setOrdersState({ userId, orders: [], error: "Your orders could not be loaded right now." });
      });

    return () => {
      active = false;
    };
  }, [userId]);

  // A result still keyed to a previous user (or none yet) reads as loading.
  const visible =
    ordersState && ordersState.userId === userId ? ordersState : null;
  const orders = visible?.orders ?? [];
  const ordersError = visible?.error ?? null;
  const ordersLoading = Boolean(userId) && !visible;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/");
    } finally {
      setSigningOut(false);
    }
  }

  const name = profile?.full_name ?? user?.email?.split("@")[0] ?? "Guest";

  return (
    <Screen edges={["top"]}>
      <BrandHeader title="Account" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={palette.ink} style={styles.loader} />
        ) : !user ? (
          <View style={styles.empty}>
            <Eyebrow>Not signed in</Eyebrow>
            <AppText variant="bodySoft" style={styles.emptyCopy}>
              Sign in to see your account details, completed orders, and a bag
              that syncs across the website and app.
            </AppText>
            <Button
              label="Sign In"
              variant="outline"
              style={styles.emptyButton}
              onPress={() => router.push("/login")}
            />
          </View>
        ) : (
          <>
            <View style={styles.identity}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Ionicons name="person" size={26} color={palette.muted} />
                </View>
              )}
              <View style={styles.identityBody}>
                <AppText variant="display">{name}</AppText>
                <AppText variant="bodySoft">{user.email}</AppText>
              </View>
            </View>

            <View style={styles.section}>
              <Eyebrow>Session</Eyebrow>
              <AppText variant="bodySoft" style={styles.description}>
                You are signed in to your Haven account. This account is shared
                between the website and mobile app.
              </AppText>
            </View>

            <View style={styles.section}>
              <Eyebrow>Completed Orders</Eyebrow>
              {ordersLoading ? (
                <ActivityIndicator color={palette.ink} style={styles.loader} />
              ) : ordersError ? (
                <AppText variant="bodySoft" style={styles.center}>
                  {ordersError}
                </AppText>
              ) : orders.length === 0 ? (
                <View style={styles.empty}>
                  <Eyebrow>No completed orders yet</Eyebrow>
                  <AppText variant="bodySoft" style={styles.emptyCopy}>
                    When you place an order it appears here with dispatch
                    details and provenance records.
                  </AppText>
                  <Button
                    label="Browse the collection"
                    variant="outline"
                    style={styles.emptyButton}
                    onPress={() => router.push("/archive")}
                  />
                </View>
              ) : (
                orders.map((order) => {
                  const tone = statusTone(order.status);
                  const deliveryName = findDeliveryOption(
                    order.delivery as DeliveryKey,
                  ).name;

                  return (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={styles.orderHead}>
                        <View style={styles.orderHeadBody}>
                          <AppText variant="eyebrow" style={styles.orderNumber}>
                            {order.orderNumber}
                          </AppText>
                          <AppText variant="small">
                            {formatDate(order.createdAt)} · {deliveryName}
                          </AppText>
                        </View>
                        <View style={styles.orderRight}>
                          <View
                            style={[styles.statusPill, { borderColor: tone }]}>
                            <AppText
                              variant="eyebrow"
                              style={{ color: tone, letterSpacing: 1.2 }}>
                              {order.status}
                            </AppText>
                          </View>
                          <AppText variant="price">
                            {formatPrice(order.totalCents)}
                          </AppText>
                        </View>
                      </View>

                      {order.items.length > 0 ? (
                        <>
                          <Divider style={styles.orderDivider} />
                          <View style={styles.items}>
                            {order.items.map((item, index) => (
                              <View
                                key={`${order.id}-${index}`}
                                style={styles.item}>
                                {item.imageUrl ? (
                                  <Image
                                    source={{ uri: item.imageUrl }}
                                    style={styles.itemThumb}
                                    contentFit="cover"
                                  />
                                ) : null}
                                <AppText
                                  variant="small"
                                  numberOfLines={1}
                                  style={styles.itemName}>
                                  {item.productName}
                                  {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                                </AppText>
                              </View>
                            ))}
                          </View>
                        </>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>

            <Button
              label="Sign Out"
              variant="outline"
              loading={signingOut}
              onPress={() => void handleSignOut()}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}


const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  loader: { marginVertical: spacing.xxl },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceSunk,
  },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  identityBody: { flex: 1, gap: 2 },
  section: { gap: spacing.sm },
  description: { lineHeight: 22 },
  center: { textAlign: "center", marginVertical: spacing.md },
  empty: {
    marginTop: spacing.sm,
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
  orderCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    gap: spacing.md,
  },
  orderHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  orderHeadBody: { flex: 1, gap: 3 },
  orderNumber: { color: palette.ink },
  orderRight: { alignItems: "flex-end", gap: spacing.xs },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: palette.surfaceSunk,
  },
  orderDivider: { marginVertical: 0 },
  items: { gap: spacing.sm },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  itemThumb: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceSunk,
  },
  itemName: { flex: 1, color: palette.inkSoft },
});

