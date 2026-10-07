import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Redirect, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { useAuth } from "@/providers/auth";
import { palette, radius, spacing } from "@/theme";
import { Eyebrow } from "@/ui/bits";
import { Button } from "@/ui/button";
import { PageHeader } from "@/ui/header";
import { Screen } from "@/ui/screen";
import { AppText } from "@/ui/text";

export default function AccountScreen() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  if (!loading && !user) return <Redirect href="/login" />;

  const name = profile?.full_name ?? user?.email?.split("@")[0] ?? "Guest";

  return (
    <Screen edges={["top"]}>
      <PageHeader
        title="Account"
        showBag={false}
        onBack={() => router.back()}
      />
      <View style={styles.content}>
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
            <AppText variant="bodySoft">
              {user?.email ?? "Not signed in"}
            </AppText>
          </View>
        </View>

        <View style={styles.section}>
          <Eyebrow>Session</Eyebrow>
          <AppText variant="bodySoft" style={styles.description}>
            You are signed in to your Haven account. This account is shared
            between the website and mobile app.
          </AppText>
        </View>

        <Button
          label="Sign Out"
          variant="outline"
          onPress={() => void signOut()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
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
});
