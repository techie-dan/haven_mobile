/**
 * Public configuration, read from `EXPO_PUBLIC_*` at build time.
 *
 * These values are embedded into the bundle, so only ever reference the
 * Supabase *anon* key here — it is RLS-guarded and safe to ship. The service
 * role key and Mailgun secrets stay server-side, in the website's `.env.local`.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Base URL of the Next.js storefront (checkout API + share links). */
export const SITE_URL = (
  process.env.EXPO_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const TAX_RATE = Number(process.env.EXPO_PUBLIC_TAX_RATE ?? "0");

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
