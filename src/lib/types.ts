/** Shared domain types, mirroring the website's `src/lib/types.ts`. */
import type { User } from "@supabase/supabase-js";

export interface Product {
  id: string;
  slug: string;
  name: string;
  material: string;
  tagline: string;
  description: string;
  artisanNote: string;
  badge?: "BEST SELLER" | "RESERVE" | "LAST PIECES";
  priceCents: number;
  compareAtCents?: number;
  imageUrl: string;
  gallery?: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  categorySlug: string;
}

export interface Category {
  slug: string;
  name: string;
}

export interface CartLine {
  product: Product;
  quantity: number;
}

export type DeliveryKey = "standard_ground" | "white_glove" | "eco_courier";

export interface DeliveryOption {
  key: DeliveryKey;
  name: string;
  blurb: string;
  priceCents: number;
  recommended?: boolean;
  freeOverCents?: number;
}

export interface OrderTotals {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  shippingComped: boolean;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
}

export interface PlaceOrderResult {
  orderNumber: string;
  totalCents: number;
  email: string;
  deliveryName?: string;
}

export type { User };
