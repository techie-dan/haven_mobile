import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import { useAuth } from "@/providers/auth";
import { palette, radius, spacing } from "@/theme";
import { Divider, Eyebrow } from "@/ui/bits";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Screen } from "@/ui/screen";
import { AppText } from "@/ui/text";

type Mode = "signin" | "signup" | "verify";

export default function LoginScreen() {
  const router = useRouter();
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    verifyEmailCode,
    resendEmailCode,
    configured,
  } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    const result = await signInWithGoogle();
    setBusy(false);
    if (result.error) setError(result.error);
    else router.replace("/account");
  }

  async function handleEmail() {
    setError(null);
    setNotice(null);
    setBusy(true);

    if (mode === "signin") {
      const result = await signInWithEmail(email.trim(), password);
      setBusy(false);
      if (result.error) setError(result.error);
      else router.replace("/account");
      return;
    }

    const result = await signUpWithEmail(
      email.trim(),
      password,
      fullName.trim(),
    );
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsVerification === false) {
      router.replace("/account");
      return;
    }

    setMode("verify");
    setCode("");
    setNotice(
      `We emailed a 6-digit code to ${email.trim()}. Enter it below to finish signing up.`,
    );
  }

  async function handleVerify() {
    setError(null);
    setNotice(null);
    setBusy(true);

    const verified = await verifyEmailCode(email.trim(), code.trim());
    if (verified.error) {
      setBusy(false);
      setError(verified.error);
      return;
    }

    const signedIn = await signInWithEmail(email.trim(), password);
    setBusy(false);
    if (signedIn.error) {
      setMode("signin");
      setNotice("Account confirmed — sign in with your password.");
      return;
    }
    router.replace("/account");
  }

  async function handleResend() {
    setError(null);
    setBusy(true);
    const result = await resendEmailCode(email.trim());
    setBusy(false);
    if (result.error) setError(result.error);
    else setNotice(`A fresh code is on its way to ${email.trim()}.`);
  }

  if (mode === "verify") {
    return (
      <Screen edges={["top", "left", "right", "bottom"]}>
        <Pressable
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.close}
        >
          <Ionicons name="close" size={22} color={palette.ink} />
        </Pressable>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Eyebrow style={styles.brand}>Haven Studio &amp; Living</Eyebrow>
            <AppText variant="displayLarge" style={styles.title}>
              Confirm your email
            </AppText>
            <AppText variant="subtitle" style={styles.copy}>
              Enter the 6-digit code we sent to {email.trim()} to finish
              creating your account.
            </AppText>

            <Field
              label="Verification Code"
              value={code}
              onChangeText={(next) =>
                setCode(next.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              keyboardType="number-pad"
              autoCapitalize="none"
            />

            {error ? (
              <View style={styles.banner}>
                <AppText variant="bodySoft" style={styles.bannerError}>
                  {error}
                </AppText>
              </View>
            ) : null}
            {notice ? (
              <View style={styles.banner}>
                <AppText variant="bodySoft">{notice}</AppText>
              </View>
            ) : null}

            <Button
              label="Verify & Continue"
              loading={busy}
              onPress={handleVerify}
              disabled={code.trim().length !== 6}
            />

            <View style={styles.verifyRow}>
              <Pressable onPress={handleResend} hitSlop={8}>
                <AppText variant="bodySoft" style={styles.switchLink}>
                  Resend code
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setMode("signup");
                  setError(null);
                  setNotice(null);
                }}
                hitSlop={8}
              >
                <AppText variant="bodySoft">Edit details</AppText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <Pressable
        accessibilityLabel="Close"
        onPress={() => router.back()}
        hitSlop={10}
        style={styles.close}
      >
        <Ionicons name="close" size={22} color={palette.ink} />
      </Pressable>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Eyebrow style={styles.brand}>Haven Studio &amp; Living</Eyebrow>
          <AppText variant="displayLarge" style={styles.title}>
            {mode === "signin" ? "Welcome Back" : "Create an Account"}
          </AppText>
          <AppText variant="subtitle" style={styles.copy}>
            One account for the website and the app. Your bag, saved pieces, and
            orders stay in step across both.
          </AppText>

          <Button
            label="Continue with Google"
            loading={busy}
            onPress={handleGoogle}
            disabled={!configured}
          />

          <View style={styles.orRow}>
            <Divider style={styles.orLine} />
            <Eyebrow>or use email</Eyebrow>
            <Divider style={styles.orLine} />
          </View>

          {mode === "signup" ? (
            <Field
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Amaka Okafor"
            />
          ) : null}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="amaka.okafor@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? (
            <View style={styles.banner}>
              <AppText variant="bodySoft" style={styles.bannerError}>
                {error}
              </AppText>
            </View>
          ) : null}
          {notice ? (
            <View style={styles.banner}>
              <AppText variant="bodySoft">{notice}</AppText>
            </View>
          ) : null}

          <Button
            label={mode === "signin" ? "Sign In" : "Create Account"}
            variant="outline"
            loading={busy}
            onPress={handleEmail}
            disabled={
              !configured ||
              !email ||
              password.length < 6 ||
              (mode === "signup" && !fullName.trim())
            }
          />

          <Pressable
            onPress={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setNotice(null);
            }}
            style={styles.switch}
          >
            <AppText variant="bodySoft">
              {mode === "signin" ? "New here? " : "Already have an account? "}
              <AppText variant="body" style={styles.switchLink}>
                {mode === "signin" ? "Create an account" : "Sign in"}
              </AppText>
            </AppText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  close: { alignSelf: "flex-end", padding: spacing.md, paddingTop: spacing.lg },
  brand: { color: palette.terracotta },
  title: { marginTop: spacing.xs },
  copy: { marginBottom: spacing.md },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  orLine: { flex: 1 },
  banner: {
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: palette.terracottaSoft,
    borderWidth: 1,
    borderColor: palette.line,
  },
  bannerError: { color: palette.terracotta },
  switch: { alignSelf: "center", marginTop: spacing.md },
  switchLink: { color: palette.terracotta },
  verifyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
});
