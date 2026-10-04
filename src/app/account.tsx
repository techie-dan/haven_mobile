import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";

import { AppText } from "@/ui/text";
import { Button } from "@/ui/button";
import { Divider, Eyebrow } from "@/ui/bits";
import { PageHeader } from "@/ui/header";
import { Screen } from "@/ui/screen";
import { useAuth } from "@/providers/auth";
import { useCart } from "@/providers/cart";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/pricing";
import { palette, radius, spacing } from "@/theme";

interface OrderRow {
  order_number: string;
  status: string;
  total_cents: number;
  created_at: string;
  order_items: { product_name: string; quantity: number }[];
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const { count, synced } = useCart();
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    if (!supabase || !user) return;

    let active = true;
    supabase
      .from("orders")
      .select(
        "order_number, status, total_cents, created_at, order_items ( product_name, quantity )",
      )
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (active) setOrders((data as unknown as OrderRow[]) ?? []);
      });

    return () => {
      active = false;
    };
  }, [user]);

  if (!loading && !user) return <Redirect href="/login" />;

  const name = profile?.full_name ?? user?.email?.split("@")[0] ?? "Guest";
  const address = [
    profile?.address_line1,
    profile?.address_line2,
    [profile?.city, profile?.state, profile?.postal_code].filter(Boolean).join(", "),
  ].filter(Boolean);

  return (
    <Screen edges={["top"]}>
      <PageHeader title="Account" showBag={false} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={26} color={palette.muted} />
            </View>
          )}
          <View style={styles.identityBody}>
            <AppText variant="display">{name}</AppText>
            <AppText variant="bodySoft">{user?.email ?? "Not signed in"}</AppText>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.stat}>
            <AppText variant="title">{count}</AppText>
            <Eyebrow>In your bag</Eyebrow>
          </View>
          <View style={styles.stat}>
            <AppText variant="title">{synced ? "Live" : "Local"}</AppText>
            <Eyebrow>Cart sync</Eyebrow>
          </View>
          <View style={styles.stat}>
            <AppText variant="title">{profile?.country ? "Set" : "—"}</AppText>
            <Eyebrow>Shipping</Eyebrow>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Eyebrow>Orders · {orders.length}</Eyebrow>
          {orders.length === 0 ? (
            <AppText variant="bodySoft">
              No orders yet. Purchases made on the website or in the app appear
              here, synced to your account.
            </AppText>
          ) : (
            orders.map((order) => (
              <View key={order.order_number} style={styles.order}>
                <View style={styles.orderHead}>
                  <AppText variant="body">{order.order_number}</AppText>
                  <AppText variant="body">{formatPrice(order.total_cents)}</AppText>
                </View>
                <AppText variant="small" style={styles.orderMeta}>
                  {new Date(order.created_at).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  · {order.status}
                </AppText>
                {order.order_items?.length > 0 ? (
                  <AppText variant="small" style={styles.orderItems} numberOfLines={3}>
                    {order.order_items
                      .map((item) =>
                        item.quantity > 1
                          ? `${item.product_name} × ${item.quantity}`
                          : item.product_name,
                      )
                      .join(" · ")}
                  </AppText>
                ) : null}
              </View>
            ))
          )}
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Eyebrow>Default Shipping Destination</Eyebrow>
          {address.length > 0 ? (
            <AppText variant="body" style={styles.address}>
              {profile?.full_name ? `${profile.full_name}\n` : ""}
              {address.join("\n")}
            </AppText>
          ) : (
            <AppText variant="bodySoft">
              No saved address yet. It will be added after your next checkout.
            </AppText>
          )}
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Eyebrow>Studio &amp; Support</Eyebrow>
          <AppText variant="bodySoft" style={styles.address}>
            12B Admiralty Way, Lekki Phase 1{"\n"}
            Lagos, Nigeria{"\n"}
            +234 803 123 4567{"\n"}
            studio@havenstudio.ng
          </AppText>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Eyebrow>Shared Account</Eyebrow>
          <AppText variant="bodySoft" style={styles.address}>
            You are signed in to the same Haven account used on the website. Items
            added to the bag in either place sync instantly while both are open.
          </AppText>
        </View>

        <Button label="Sign Out" variant="outline" onPress={() => void signOut()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  avatar: { width: 60, height: 60, borderRadius: radius.pill, backgroundColor: palette.surfaceSunk },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  identityBody: { flex: 1, gap: 2 },
  statRow: { flexDirection: "row", gap: spacing.md },
  stat: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
  },
  divider: {},
  section: { gap: spacing.sm },
  address: { lineHeight: 22 },
  order: {
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surfaceSunk,
  },
  orderHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderMeta: { color: palette.muted, textTransform: "capitalize" },
  orderItems: { color: palette.inkSoft },
});
