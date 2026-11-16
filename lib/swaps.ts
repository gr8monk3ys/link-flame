/**
 * Helpers for the Checked swaps pages. The data lives in `config/swaps.ts`.
 */
import { SWAP_CATEGORIES, SWAPS, type Swap, type SwapCategory } from "@/config/swaps"

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

export function getSwap(slug: string): Swap | undefined {
  return SWAPS.find((swap) => swap.slug === slug)
}

/** Categories that have at least one entry, in tally-sheet order. */
export function swapsByCategory(
  swaps: readonly Swap[] = SWAPS
): { category: SwapCategory; swaps: Swap[] }[] {
  return SWAP_CATEGORIES.map((category) => ({
    category,
    swaps: swaps.filter((swap) => swap.category === category),
  })).filter((group) => group.swaps.length > 0)
}

export interface SwapLink {
  href: string
  /** True when the shop earns a commission through this link. */
  paid: boolean
  rel: string
}

/**
 * The outbound link for a swap. A paid link is marked `sponsored` for search
 * engines, and the page must show the words "paid link" next to it.
 */
export function swapLink(swap: Pick<Swap, "url" | "affiliateUrl">): SwapLink {
  if (swap.affiliateUrl) {
    return { href: swap.affiliateUrl, paid: true, rel: "sponsored nofollow noopener" }
  }
  return { href: swap.url, paid: false, rel: "nofollow noopener" }
}

/**
 * The disclosure next to the outbound link on one product page. It is built
 * from the data, so it cannot say "not paid" once the link is paid.
 */
export function swapPageDisclosure(swap: Pick<Swap, "url" | "affiliateUrl">): string {
  if (swapLink(swap).paid) {
    return "This is a paid link. We earn a commission if you buy through it. The price you pay is the same."
  }
  return "This link is not paid. We earn nothing if you buy."
}

/** The disclosure at the top of the list of all swaps. */
export function swapIndexDisclosure(
  swaps: readonly Pick<Swap, "url" | "affiliateUrl">[] = SWAPS
): string {
  if (swaps.some((swap) => swapLink(swap).paid)) {
    return "Rows marked “paid link” lead to a page where the link to the brand pays us a commission if you buy. The price you pay is the same. The other links pay us nothing."
  }
  return "No link on these pages is paid. We earn nothing if you buy."
}

/** The newest `checkedOn` date in a list of swaps (ISO dates sort as text). */
export function latestCheckedOn(swaps: readonly Pick<Swap, "checkedOn">[] = SWAPS): string {
  return swaps.reduce((latest, swap) => (swap.checkedOn > latest ? swap.checkedOn : latest), "")
}

/** "2026-11-09" -> "9 November 2026". No Date object, so no time zone drift. */
export function formatCheckedDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso
  const month = MONTHS[Number(match[2]) - 1]
  if (!month) return iso
  return `${Number(match[3])} ${month} ${match[1]}`
}

/** Host name of a source URL, without "www.", for use as link text. */
export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}
