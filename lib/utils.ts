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

// Formatters are built once per module, not per call: constructing an
// Intl formatter is far more expensive than using one. The locale is pinned
// to en-US (the store sells in USD) so server and client render the same
// string and hydration never mismatches.
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

// Accepts Prisma Decimals too: Number() goes through their valueOf().
export function formatPrice(price: number | string | { valueOf(): string | number }): string {
  return usdFormatter.format(Number(price))
}

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})
const numberFormatters = new Map<number, Intl.NumberFormat>()

/**
 * Grouped number for display ("1,234", "12.5"). `fractionDigits` fixes the
 * number of decimals, like toFixed() but locale-aware.
 */
export function formatNumber(value: number, fractionDigits?: number): string {
  if (fractionDigits === undefined) return integerFormatter.format(value)
  let formatter = numberFormatters.get(fractionDigits)
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
    numberFormatters.set(fractionDigits, formatter)
  }
  return formatter.format(value)
}

const dateFormatters = {
  /** 1/5/2026 */
  numeric: new Intl.DateTimeFormat("en-US"),
  /** Jan 5, 2026 */
  medium: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }),
  /** January 5, 2026 */
  long: new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }),
  /** January 5, 2026 at 3:04 PM */
  longWithTime: new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }),
  /** Monday, January 5 */
  weekday: new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }),
} as const

export type DateStyle = keyof typeof dateFormatters

export function formatDate(value: Date | string | number, style: DateStyle = "numeric"): string {
  return dateFormatters[style].format(value instanceof Date ? value : new Date(value))
}
