import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side contract test for the two requirements that span both clients:
 *
 *   1. The website and the mobile app authenticate against the SAME Supabase
 *      project with the SAME anon key, so one account works on both.
 *   2. A cart write made by a "website" session is broadcast over Realtime to a
 *      "mobile" session subscribed to `postgres_changes` on `cart_items`
 *      filtered by user_id — the exact subscription `src/providers/cart.tsx`
 *      installs.
 *
 * Run from the mobile repo:  node scripts/sync-contract-test.mjs
 * Exit code 0 = contract holds.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MOBILE_ENV = path.join(HERE, "..", ".env.local");
const WEB_ENV = path.join(HERE, "..", "..", "haven-web", ".env.local");

// Any unexpected throw should fail loudly with exit code 1.
process.on("unhandledRejection", (err) => {
  console.error("\nUNCAUGHT:", err);
  process.exit(1);
});

const TIMEOUT_MS = 10_000;

function parseEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) out[m[1]] = m[2].replace(/\s+#.*$/, "").replace(/^["']|["']$/g, "");
  }
  return out;
}

function check(cond, label) {
  console.log(`${cond ? "  PASS" : "  FAIL"}  ${label}`);
  if (!cond) {
    console.error(`\nContract broken: ${label}`);
    process.exit(1);
  }
}

function withTimeout(promise, ms, what) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms: ${what}`)), ms),
    ),
  ]);
}

const mobileEnv = parseEnv(MOBILE_ENV);
const webEnv = parseEnv(WEB_ENV);

console.log("\n[1] Shared-credentials configuration");
const mobileUrl = mobileEnv.EXPO_PUBLIC_SUPABASE_URL;
const webUrl = webEnv.NEXT_PUBLIC_SUPABASE_URL || webEnv.SUPABASE_URL;
const mobileKey = mobileEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const webKey = webEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

check(Boolean(mobileUrl && mobileKey && webUrl && webKey), "both .env.local files carry Supabase credentials");
check(mobileUrl === webUrl, `Supabase project URL matches (${mobileUrl})`);
check(mobileKey === webKey, "anon key matches (same auth realm ⇒ same accounts)");

// Unique per run so re-runs never collide with a half-created user.
const testEmail = `sync-contract-${Date.now()}@example.com`;
const testPassword = `Ctr-${Date.now()}-pass1`;

// Client A = "website session", Client B = "mobile session". Two independent
// clients signed in as the same user is exactly what the two products do.
const webSim = createClient(mobileUrl, mobileKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const mobileSim = createClient(mobileUrl, mobileKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log("\n[2] Test account: confirmed user (end-state of the website's verified signup)");
const serviceRole = webEnv.SUPABASE_SERVICE_ROLE_KEY;
check(Boolean(serviceRole), "service-role key available in web .env.local for test setup");
const admin = createClient(mobileUrl, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: created, error: createError } = await withTimeout(
  admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  }),
  TIMEOUT_MS,
  "admin.createUser",
);
check(!createError, `confirmed test user created (${testEmail})${createError ? ` — ${createError.message}` : ""}`);
const uid = created.user?.id;
check(Boolean(uid), "test user id returned");

console.log("\n[3] Same account signs in independently on both clients");
const { data: mobileLogin, error: mobileLoginError } = await withTimeout(
  mobileSim.auth.signInWithPassword({ email: testEmail, password: testPassword }),
  TIMEOUT_MS,
  "mobile signInWithPassword",
);
check(!mobileLoginError, `mobile client signed in${mobileLoginError ? ` — ${mobileLoginError.message}` : ""}`);
const { data: webLogin, error: webLoginError } = await withTimeout(
  webSim.auth.signInWithPassword({ email: testEmail, password: testPassword }),
  TIMEOUT_MS,
  "website signInWithPassword",
);
check(!webLoginError, `website client signed in${webLoginError ? ` — ${webLoginError.message}` : ""}`);
check(
  mobileLogin.session?.user?.id === uid && webLogin.session?.user?.id === uid,
  "both sessions resolve to the same user id",
);

console.log("\n[4] Website cart write → Realtime broadcast to mobile session");
const { data: productRow, error: productError } = await mobileSim
  .from("products")
  .select("id")
  .eq("is_published", true)
  .limit(1)
  .maybeSingle();
check(!productError && productRow, "published product available to write into the cart");

const channel = mobileSim.channel(`cart:${uid}`);
let resolveEvent = null;
const eventPromise = new Promise((resolve) => {
  resolveEvent = resolve;
});
channel.on(
  "postgres_changes",
  { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${uid}` },
  (payload) => resolveEvent(payload),
);

const subStatus = await withTimeout(
  new Promise((resolve, reject) => {
    channel.subscribe((status, err) => {
      if (status === "SUBSCRIBED") resolve(status);
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") reject(err ?? new Error(status));
    });
  }),
  TIMEOUT_MS,
  "channel subscribe",
);
check(subStatus === "SUBSCRIBED", "mobile-style subscription is live on cart_items");

// Brief grace so the server has registered the subscription before the write
// races it (mirrors the known-good handshake in a real session).
await new Promise((r) => setTimeout(r, 1000));

const { error: insertError } = await webSim.from("cart_items").upsert({
  user_id: uid,
  product_id: productRow.id,
  quantity: 1,
});
check(!insertError, `website session upserted a cart row${insertError ? ` — ${insertError.message}` : ""}`);

// Deadline starts only now: subscribe + write are already done.
const t0 = Date.now();
const payload = await withTimeout(eventPromise, TIMEOUT_MS, "realtime event");
const latency = Date.now() - t0;
check(payload.new?.user_id === uid, `realtime event received in ${latency}ms (filters honoured)`);
check(latency < 3000, "delivery is instant-feeling (<3s)");

console.log("\n[5] Mobile session reads the same row back (initial-fetch path)");
const { data: rows, error: readError } = await mobileSim
  .from("cart_items")
  .select("product_id, quantity")
  .eq("user_id", uid);
check(!readError && rows?.length === 1, "mobile REST read sees exactly the row the website wrote");

console.log("\n[6] Cleanup");
const { error: delError } = await mobileSim.from("cart_items").delete().eq("user_id", uid);
check(!delError, "test cart row removed");

const { error: delUserError } = await admin.auth.admin.deleteUser(uid);
check(!delUserError, `test user deleted${delUserError ? ` — ${delUserError.message}` : ""}`);

await Promise.allSettled([webSim.auth.signOut(), mobileSim.auth.signOut()]);
mobileSim.removeChannel(channel);

console.log("\nContract test passed: shared login + instant cart sync are wired correctly.\n");
process.exit(0);

