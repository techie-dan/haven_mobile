import { requireSupabase } from "@/lib/supabase";
import type { CartLine } from "@/lib/types";

/**
 * Account cart helpers. The table is `public.cart_items` (see the website's
 * `supabase/migrations/0003_carts.sql`); RLS scopes every row to its owner, so
 * the website and app read and write the same basket.
 */
export interface CartRow {
  product_id: string;
  quantity: number;
}

export async function fetchCartRows(userId: string): Promise<CartRow[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, quantity")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as CartRow[] | null) ?? [];
}

/** Folds the device's guest lines into the account cart on first sign-in. */
export async function mergeGuestLines(userId: string, lines: CartLine[]): Promise<void> {
  if (lines.length === 0) return;

  const supabase = requireSupabase();
  const existing = await fetchCartRows(userId);
  const onServer = new Map(existing.map((row) => [row.product_id, row.quantity]));

  const payload = lines.map((line) => ({
    user_id: userId,
    product_id: line.product.id,
    quantity: Math.min(10, (onServer.get(line.product.id) ?? 0) + line.quantity),
  }));

  const { error } = await supabase
    .from("cart_items")
    .upsert(payload, { onConflict: "user_id,product_id" });

  if (error) throw error;
}

export async function upsertCartItem(
  userId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("cart_items").upsert(
    {
      user_id: userId,
      product_id: productId,
      quantity: Math.min(10, Math.max(1, quantity)),
    },
    { onConflict: "user_id,product_id" },
  );

  if (error) throw error;
}

export async function deleteCartItem(userId: string, productId: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) throw error;
}

export async function clearServerCart(userId: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);
  if (error) throw error;
}
