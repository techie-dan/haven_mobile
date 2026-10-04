# Haven Studio & Living — mobile

Expo (SDK 57) storefront for Haven Studio & Living. It is a client of the **same
Supabase project** as the Next.js website in `../retail store`, so accounts,
catalogue, and the shopping bag are shared between the two.

## What is shared with the website

| Concern | Source of truth | Notes |
| --- | --- | --- |
| Accounts | Supabase Auth | Google sign-in matches the website; email/password sign-up is verified with a Mailgun code sent by the website API |
| Catalogue | `public.products` | Same project, same `sort_order` |
| Bag | `public.cart_items` | Realtime — an item added on the website appears here instantly |
| Orders | `POST {SITE_URL}/api/orders` | The website's server validates and prices every order |

The app talks to Supabase directly with the public **anon** key (RLS-guarded).
Checkout is proxied through the website so pricing, discount, tax, and email
logic live in exactly one place.

## Setup

### 1. Environment

`.env.local` is already populated with the shared public keys. Only copy values
here that are safe to embed in a shipped bundle:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
EXPO_PUBLIC_TAX_RATE=0.0
EXPO_PUBLIC_SITE_URL=http://localhost:3000   # the Next.js storefront
```

Never put `SUPABASE_SERVICE_ROLE_KEY` or Mailgun keys in this file.

For a **physical device**, set `EXPO_PUBLIC_SITE_URL` to a URL the phone can
reach (your machine's LAN IP, e.g. `http://192.168.1.20:3000`, or the deployed
site).

### 2. Database

Apply the shared-cart migration in the website repo:

```bash
cd "../retail store"
supabase db push          # or paste supabase/migrations/0003_carts.sql into the SQL editor
```

This creates `public.cart_items`, its RLS policies, and adds it to the
`supabase_realtime` publication. Without it the app still runs, but a signed-in
bag falls back to device-local storage and will not sync.

### 3. Auth redirects

In **Supabase → Authentication → URL Configuration → Redirect URLs**, allow the
app's deep link:

- Development build: `havenmobile://auth-callback` and `havenmobile://**`
- Expo Go: the `exp://…` URL printed by `npx expo start` (add `exp://**` for convenience)

Google stays configured in Supabase exactly as it is for the website; the app
only needs the redirect allowlisted.

Email/password sign-up is proxied through the website so Mailgun can deliver the
verification code: the app calls `POST {SITE_URL}/api/auth/signup`, shows a code
screen, then `POST {SITE_URL}/api/auth/verify` before signing in. Make sure
`EXPO_PUBLIC_SITE_URL` points at a reachable deployment.

### 4. Run

```bash
npm install
npx expo start
```

Adding native modules means the app needs a development build rather than Expo
Go for full fidelity: `npx expo run:ios` / `npx expo run:android`, or
`eas build --profile development`.

## Scripts

```bash
npx expo start     # dev server
npx expo lint      # eslint (also runs tsc via the editor)
npx tsc --noEmit   # typecheck
npx expo-doctor    # dependency/config diagnosis
```

## How cart sync works

1. The bag is stored in `public.cart_items` keyed by `user_id`, guarded by RLS.
2. On sign-in the device's guest lines are merged into the account cart.
3. Every mutation is optimistic locally and written through to Supabase.
4. Both the website and the app hold a Realtime subscription filtered to
   `user_id=eq.<id>` and refetch on any change, so a change in one place shows
   up in the other without a refresh.
5. On sign-out the local copy is cleared; the basket stays with the account.

## Layout

```
src/app/            Expo Router routes ((tabs), product/[slug], checkout, login, account)
src/providers/      auth, cart (Realtime), catalog, saved
src/lib/            supabase client, catalog, cart, pricing, env, types
src/ui/             shared primitives (text, button, header, product card, …)
src/theme/          brand tokens
```
