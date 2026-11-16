import { describe, expect, it } from 'vitest'

import { SWAP_CATEGORIES, SWAPS, type Swap } from '@/config/swaps'
import {
  formatCheckedDate,
  getSwap,
  latestCheckedOn,
  sourceHost,
  swapIndexDisclosure,
  swapLink,
  swapPageDisclosure,
  swapsByCategory,
} from '@/lib/swaps'

const HTTPS = /^https:\/\/[^\s]+$/

/** Every URL an entry can put on a page. */
function urlsOf(swap: Swap): string[] {
  return [
    swap.url,
    ...(swap.affiliateUrl ? [swap.affiliateUrl] : []),
    ...swap.sources.map((source) => source.url),
    ...swap.confirmed.map((finding) => finding.sourceUrl),
    ...swap.notProven.flatMap((finding) => (finding.sourceUrl ? [finding.sourceUrl] : [])),
  ]
}

describe('checked swaps data', () => {
  it('has unique slugs that are safe in a URL', () => {
    const slugs = SWAPS.map((swap) => swap.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('gives every entry the fields the page prints', () => {
    for (const swap of SWAPS) {
      expect(SWAP_CATEGORIES).toContain(swap.category)
      expect(swap.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(swap.price).toMatch(/\$\d/)
      expect(swap.brand.length).toBeGreaterThan(0)
      expect(swap.product.length).toBeGreaterThan(0)
      expect(swap.replaces.length).toBeGreaterThan(0)
      expect(swap.materials.length).toBeGreaterThan(0)
      expect(swap.endOfLife.length).toBeGreaterThan(0)
      expect(swap.brandClaims.length).toBeGreaterThan(0)
      // A page with no open question would read as an endorsement.
      expect(swap.notProven.length).toBeGreaterThan(0)
    }
  })

  it('backs every entry with sources, and every confirmed finding with a URL', () => {
    for (const swap of SWAPS) {
      expect(swap.sources.length).toBeGreaterThan(0)
      expect(swap.sources.some((source) => source.kind === 'brand')).toBe(true)
      for (const finding of swap.confirmed) {
        expect(finding.sourceUrl).toMatch(HTTPS)
      }
      for (const url of urlsOf(swap)) {
        expect(url).toMatch(HTTPS)
      }
    }
  })

  it('confirms nothing from the brand’s own product page', () => {
    // A brand's word about itself is not proof.
    for (const swap of SWAPS) {
      for (const finding of swap.confirmed) {
        expect(finding.sourceUrl).not.toBe(swap.url)
      }
    }
  })

  it('never says a brand is "not certified"', () => {
    // "Could not confirm" is what the check found. "Not certified" is a claim
    // about the brand that the check cannot support.
    for (const swap of SWAPS) {
      const text = [
        ...swap.brandClaims,
        ...swap.confirmed.map((finding) => finding.text),
        ...swap.notProven.map((finding) => finding.text),
        swap.materials,
        swap.endOfLife,
      ].join(' ')
      expect(text.toLowerCase()).not.toContain('not certified')
    }
  })

  it('does not link to the Meliora address that returns 404', () => {
    for (const swap of SWAPS) {
      expect(urlsOf(swap)).not.toContain('https://meliorameansbetter.com/products/laundry-powder')
    }
  })

  it('ships with no paid link until a program has accepted the shop', () => {
    expect(SWAPS.filter((swap) => swap.affiliateUrl)).toEqual([])
  })
})

describe('swap helpers', () => {
  it('finds an entry by slug', () => {
    expect(getSwap(SWAPS[0].slug)).toBe(SWAPS[0])
    expect(getSwap('no-such-swap')).toBeUndefined()
  })

  it('groups every entry once, in tally-sheet order, with no empty group', () => {
    const groups = swapsByCategory()
    expect(groups.every((group) => group.swaps.length > 0)).toBe(true)
    expect(groups.reduce((count, group) => count + group.swaps.length, 0)).toBe(SWAPS.length)

    const order = groups.map((group) => SWAP_CATEGORIES.indexOf(group.category))
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('marks an unpaid link nofollow and a paid link sponsored', () => {
    const unpaid = swapLink({ url: 'https://brand.example/p' })
    expect(unpaid).toEqual({
      href: 'https://brand.example/p',
      paid: false,
      rel: 'nofollow noopener',
    })

    const paid = swapLink({
      url: 'https://brand.example/p',
      affiliateUrl: 'https://network.example/r/123',
    })
    expect(paid).toEqual({
      href: 'https://network.example/r/123',
      paid: true,
      rel: 'sponsored nofollow noopener',
    })
  })

  it('cannot say "not paid" once a link is paid', () => {
    const unpaid = { url: 'https://brand.example/p' }
    const paid = { ...unpaid, affiliateUrl: 'https://network.example/r/123' }

    expect(swapPageDisclosure(unpaid)).toContain('not paid')
    expect(swapPageDisclosure(paid)).toContain('paid link')
    expect(swapPageDisclosure(paid)).toContain('commission')
    expect(swapPageDisclosure(paid)).not.toContain('not paid')

    expect(swapIndexDisclosure([unpaid])).toContain('No link on these pages is paid')
    expect(swapIndexDisclosure([unpaid, paid])).toContain('commission')
    expect(swapIndexDisclosure([unpaid, paid])).not.toContain('No link on these pages is paid')
  })

  it('reads the newest check date', () => {
    expect(
      latestCheckedOn([
        { checkedOn: '2026-11-09' },
        { checkedOn: '2027-01-02' },
        { checkedOn: '2026-12-31' },
      ])
    ).toBe('2027-01-02')
    expect(latestCheckedOn([])).toBe('')
  })

  it('formats the check date without a time zone shift', () => {
    expect(formatCheckedDate('2026-11-09')).toBe('9 November 2026')
    expect(formatCheckedDate('2027-01-31')).toBe('31 January 2027')
    expect(formatCheckedDate('2026-13-01')).toBe('2026-13-01')
    expect(formatCheckedDate('soon')).toBe('soon')
  })

  it('shows a source by its host name', () => {
    expect(sourceHost('https://www.bcorporation.net/en-us/find-a-b-corp/')).toBe('bcorporation.net')
    expect(sourceHost('https://data.epa.gov/efservice/x')).toBe('data.epa.gov')
    expect(sourceHost('not a url')).toBe('not a url')
  })
})
