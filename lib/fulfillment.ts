/**
 * How a product reaches the customer.
 *
 * - "stock": we hold inventory and ship it; inventory is checked and decremented.
 * - "digital": a download (DigitalAsset rows); no shipping, no inventory.
 * - "printful": printed on demand by Printful after payment; ships, no inventory.
 */
export const FULFILLMENT = {
  STOCK: "stock",
  DIGITAL: "digital",
  PRINTFUL: "printful",
} as const;

export type Fulfillment = (typeof FULFILLMENT)[keyof typeof FULFILLMENT];

export function normalizeFulfillment(value: string | null | undefined): Fulfillment {
  if (value === FULFILLMENT.DIGITAL || value === FULFILLMENT.PRINTFUL) return value;
  return FULFILLMENT.STOCK;
}

/** Only products we stock ourselves have a finite inventory. */
export function tracksInventory(fulfillment: string | null | undefined): boolean {
  return normalizeFulfillment(fulfillment) === FULFILLMENT.STOCK;
}

export function requiresShipping(fulfillment: string | null | undefined): boolean {
  return normalizeFulfillment(fulfillment) !== FULFILLMENT.DIGITAL;
}

/**
 * Stripe Tax product tax codes (docs.stripe.com/tax/tax-codes):
 * txcd_10302000 = Digital Books - downloaded - with permanent rights,
 * txcd_30011000 = Clothing, txcd_99999999 = General - Tangible Goods.
 */
export function stripeTaxCode(
  fulfillment: string | null | undefined,
  category?: string | null
): string {
  if (normalizeFulfillment(fulfillment) === FULFILLMENT.DIGITAL) return "txcd_10302000";
  if (category === "Apparel") return "txcd_30011000";
  return "txcd_99999999";
}
