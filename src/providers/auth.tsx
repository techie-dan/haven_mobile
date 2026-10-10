import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import { SITE_URL, isSupabaseConfigured } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

WebBrowser.maybeCompleteAuthSession();

/**
 * Extracts the session from the URL Supabase redirects back to.
 *
 * Handles both flows: PKCE (`?code=…`, exchanged for a session) and implicit
 * (`#access_token=…&refresh_token=…`). Error redirects are surfaced instead of
 * silently failing.
 */
export async function completeAuthFromUrl(url: string): Promise<void> {
  if (!supabase) return;

  const [beforeHash, hash = ""] = url.split("#");
  const query = new URLSearchParams(beforeHash.split("?")[1] ?? "");
  const fragment = new URLSearchParams(hash);

  const errorDescription =
    query.get("error_description") ?? fragment.get("error_description");
  if (errorDescription) throw new Error(errorDescription);

  const code = query.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  const accessToken = fragment.get("access_token");
  const refreshToken = fragment.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
  }
}

/**
 * Pulls an OAuth error out of the URL Supabase redirects to when it rejects a
 * flow — typically the app's deep link is missing from Authentication → URL
 * Configuration → Redirect URLs, and Supabase serves an `error_description` on
 * its own domain instead of calling back into the app.
 */
function oauthErrorFromUrl(url: string): string | null {
  const beforeHash = url.split("#")[0];
  const params = new URLSearchParams(beforeHash.split("?")[1] ?? "");
  return params.get("error_description") ?? params.get("error");
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error?: string; needsVerification?: boolean }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ error?: string }>;
  resendEmailCode: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // Keyed by user id so a previous customer's profile can never leak across
  // accounts, without resetting state inside an effect.
  const [profileState, setProfileState] = useState<{
    userId: string;
    profile: Profile;
  } | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Deep-link completion for when the OS hands the OAuth redirect back to the
  // app outside the in-app browser result.
  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      if (!url.includes("auth-callback")) return;
      void completeAuthFromUrl(url).catch((error) =>
        console.error("[auth] deep-link sign-in failed:", error),
      );
    });

    void Linking.getInitialURL().then((url) => {
      if (!url || !url.includes("auth-callback")) return;
      void completeAuthFromUrl(url).catch((error) =>
        console.error("[auth] cold-start sign-in failed:", error),
      );
    });

    return () => sub.remove();
  }, []);

  // The profile row (default shipping address) is created by an auth trigger,
  // so retry briefly on first sign-in rather than caching null.
  useEffect(() => {
    if (!user || !supabase) return;

    let cancelled = false;
    const client = supabase;
    const userId = user.id;

    async function load() {
      for (let attempt = 0; attempt < 4 && !cancelled; attempt += 1) {
        const { data } = await client
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (cancelled) return;
        if (data) {
          setProfileState({ userId, profile: data as Profile });
          return;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, 350 * (attempt + 1)),
        );
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      return {
        error: "Supabase is not configured. Add your keys to .env.local.",
      };
    }

    // In standalone and development builds, havenmobile://auth-callback is the native scheme.
    // In Expo Go, Linking.createURL('auth-callback') resolves to exp://...
    // Passing { scheme: 'havenmobile' } ensures custom scheme consistency where supported.
    const redirectTo = Linking.createURL("auth-callback", { scheme: "havenmobile" });
    const scheme = redirectTo.split("://")[0];
    console.log("[auth] redirectTo:", redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });

    console.log("[auth] oauth url:", data?.url);

    if (error || !data?.url) {
      return { error: error?.message ?? "Could not start Google sign-in." };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    console.log("[auth] browser session result:", JSON.stringify(result));

    if (result.type === "success" && result.url) {
      const oauthError = oauthErrorFromUrl(result.url);
      if (oauthError) {
        return {
          error:
            `${oauthError}. The app's redirect link is almost certainly not ` +
            `allowlisted — add "${redirectTo}" (or "${scheme}://**") to ` +
            "Supabase → Authentication → URL Configuration → Redirect URLs.",
        };
      }
      try {
        await completeAuthFromUrl(result.url);
        return {};
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "Google sign-in failed.",
        };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return {};

    return {
      error:
        `Google sign-in didn't return to the app. On a device build this means ` +
        `${redirectTo} is missing from Supabase → Authentication → URL ` +
        `Configuration → Redirect URLs — add it, or "${scheme}://**".`,
    };
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: "Supabase is not configured." };
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return error ? { error: error.message } : {};
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, fullName: string) => {
      if (!supabase) return { error: "Supabase is not configured." };

      try {
        const response = await fetch(`${SITE_URL}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullName }),
        });
        const body = (await response.json().catch(() => null)) as {
          error?: string;
          needsVerification?: boolean;
        } | null;

        if (!response.ok) {
          return { error: body?.error ?? "We could not create your account." };
        }

        if (body?.needsVerification === false) {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) return { error: error.message };
          return { needsVerification: false };
        }

        return { needsVerification: true };
      } catch {
        return {
          error: "We could not reach the studio. Check your connection.",
        };
      }
    },
    [],
  );

  const verifyEmailCode = useCallback(async (email: string, code: string) => {
    try {
      const response = await fetch(`${SITE_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      return response.ok
        ? {}
        : { error: body?.error ?? "Verification failed." };
    } catch {
      return { error: "We could not reach the studio. Check your connection." };
    }
  }, []);

  const resendEmailCode = useCallback(async (email: string) => {
    try {
      const response = await fetch(`${SITE_URL}/api/auth/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      return response.ok
        ? {}
        : { error: body?.error ?? "Could not resend the code." };
    } catch {
      return { error: "We could not reach the studio. Check your connection." };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile:
        user && profileState?.userId === user.id ? profileState.profile : null,
      loading,
      configured: isSupabaseConfigured,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      verifyEmailCode,
      resendEmailCode,
      signOut,
    }),
    [
      user,
      session,
      profileState,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      verifyEmailCode,
      resendEmailCode,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}
