import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * URL-safe form of a display name.
 *
 * Blog categories are stored only as a display name ("Green Home") with no slug
 * column, so every link has to derive its URL from that name. Different call
 * sites derived it differently - one lowercased it and left the space, another
 * replaced non-alphanumerics with a hyphen - and only the space form matched the
 * query, so "/blogs/categories/green-home" rendered an empty page with a 200.
 * Routing both the links and the lookup through this single function is what
 * keeps them in agreement.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatPrice(price: number | string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(price));
}
