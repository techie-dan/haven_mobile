import { supabase } from "@/lib/supabase";

/**
 * Order history for the signed-in customer.
 *
 * Reads `public.orders` directly with the anon key: the `orders_select_own`
 * RLS policy (`auth.uid() = user_id`) scopes every read to the session, which
 * is the same guarantee the website's account page gets from its server-side
 * client. Guest orders (user_id is null) never appear here.
 */
export interface AccountOrderItem {
  productName: string;
  imageUrl: string | null;
  quantity: number;
}

export interface AccountOrder {
  id: string;
  orderNumber: string;
  status: string;
  delivery: string;
  totalCents: number;
  createdAt: string;
  items: AccountOrderItem[];
}

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  delivery: string;
  total_cents: number;
  created_at: string;
  order_items:
    | { product_name: string; image_url: string | null; quantity: number }[]
    | null;
}

export const ACCOUNT_ORDER_SELECT =
  "id, order_number, status, delivery, total_cents, created_at, " +
  "order_items ( product_name, image_url, quantity )";

/** Newest first, capped like the website so a long history stays cheap. */
export async function getAccountOrders(): Promise<AccountOrder[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(ACCOUNT_ORDER_SELECT)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const rows = (data as unknown as OrderRow[]) ?? [];
  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    delivery: row.delivery,
    totalCents: row.total_cents,
    createdAt: row.created_at,
    items: (row.order_items ?? []).map((item) => ({
      productName: item.product_name,
      imageUrl: item.image_url,
      quantity: item.quantity,
    })),
  }));
}