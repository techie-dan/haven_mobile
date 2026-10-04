import type {
  CartLine,
  DeliveryKey,
  DeliveryOption,
  OrderTotals,
} from "@/lib/types";
import { TAX_RATE } from "@/lib/env";

/** Money is integer kobo everywhere; format only at the edge. */

const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
});

export function formatPrice(cents: number): string {
  return NGN.format(cents / 100);
}

/** "₦358" when whole, "₦88.50" otherwise — for dense grids. */
export function formatPriceCompact(cents: number): string {
  return cents % 100 === 0
    ? `₦${(cents / 100).toLocaleString("en-NG")}`
    : formatPrice(cents);
}

/**
 * Nigerian delivery tiers. Priced in kobo (1 naira = 100 kobo) and matching the
 * website's `src/lib/data.ts`, so a basket shows the same shipping on both.
 */
export const deliveryOptions: DeliveryOption[] = [
  {
    key: "standard_ground",
    name: "Standard Insured Delivery",
    blurb: "3–5 business days · Nationwide insured courier",
    priceCents: 350000,
    freeOverCents: 15000000,
  },
  {
    key: "white_glove",
    name: "White Glove Fragile Care",
    blurb: "2 business days · Double-boxed ceramic casing + signature handover",
    priceCents: 750000,
    recommended: true,
  },
  {
    key: "eco_courier",
    name: "Lagos Same-Day Dispatch",
    blurb: "Lagos & Ogun only · Delivered today before 8:00 PM",
    priceCents: 500000,
  },
];

export const FREE_SHIPPING_THRESHOLD_CENTS = 15000000;

export function lineTotalCents(line: CartLine): number {
  return line.product.priceCents * line.quantity;
}

export function cartSubtotalCents(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotalCents(line), 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function findDeliveryOption(key: DeliveryKey): DeliveryOption {
  return deliveryOptions.find((option) => option.key === key) ?? deliveryOptions[0];
}

/**
 * Client-side totals, used only for display. The server recomputes every amount
 * from the catalogue when the order is placed (see POST /api/orders).
 */
export function computeTotals(lines: CartLine[], delivery: DeliveryKey): OrderTotals {
  const subtotalCents = cartSubtotalCents(lines);
  const option = findDeliveryOption(delivery);

  const qualifiesForFree =
    option.freeOverCents !== undefined &&
    subtotalCents >= Math.min(option.freeOverCents, FREE_SHIPPING_THRESHOLD_CENTS);

  const shippingCents = qualifiesForFree ? 0 : option.priceCents;
  const taxCents = Number.isFinite(TAX_RATE) ? Math.round(subtotalCents * TAX_RATE) : 0;

  return {
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
    shippingComped: qualifiesForFree && option.priceCents > 0,
  };
}
