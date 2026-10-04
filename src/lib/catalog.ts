import { products as fallbackProducts, categories } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

/**
 * Catalogue access.
 *
 * Reads the same Supabase project the website does, and falls back to the
 * seeded list in `src/lib/data.ts` whenever the database is unconfigured,
 * unreachable, or empty — the website's `src/lib/catalog.ts` behaves the same
 * way, so a storefront that has not been seeded yet still renders its
 * products rather than an empty grid.
 */

export { categories };

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  material: string | null;
  tagline: string | null;
  description: string | null;
  artisan_note: string | null;
  badge: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  image_url: string | null;
  rating: number | null;
  review_count: number | null;
  in_stock: boolean;
  categories: { slug: string } | null;
}

export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    material: row.material ?? "",
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    artisanNote: row.artisan_note ?? "",
    badge: (row.badge as Product["badge"]) ?? undefined,
    priceCents: row.price_cents,
    compareAtCents: row.compare_at_cents ?? undefined,
    imageUrl: row.image_url ?? "",
    rating: row.rating ?? 5,
    reviewCount: row.review_count ?? 0,
    inStock: row.in_stock,
    categorySlug: row.categories?.slug ?? "",
  };
}

export const PRODUCT_SELECT =
  "id, slug, name, material, tagline, description, artisan_note, badge, " +
  "price_cents, compare_at_cents, image_url, rating, review_count, " +
  "in_stock, categories ( slug )";

/** Live catalogue from the same Supabase project the website reads. */
export async function getProducts(): Promise<Product[]> {
  if (!supabase) return fallbackProducts;

  try {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    const rows = (data as unknown as ProductRow[]) ?? [];
    return rows.length > 0 ? rows.map(rowToProduct) : fallbackProducts;
  } catch (error) {
    // A database hiccup should degrade to the seeded catalogue, not an empty
    // storefront.
    console.error("[catalog] falling back to seed data:", error);
    return fallbackProducts;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
}
