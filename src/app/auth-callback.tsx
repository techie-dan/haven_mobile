import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import { useAuth } from "@/providers/auth";

const SETTLE_MS = 5000;

export default function AuthCallbackScreen() {
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), SETTLE_MS);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return null;
  if (user) return <Redirect href="/account" />;
  if (timedOut) return <Redirect href="/login" />;
  return null;
}
