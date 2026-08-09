import { test, expect, type Page } from '@playwright/test'

/**
 * Text contrast, measured rather than reviewed.
 *
 * Dark mode was unreadable across the site for a long time without any test
 * noticing, because nothing here ever asserted on rendered colour. Hardcoded
 * Tailwind palette classes (text-gray-900, bg-white) do not respond to the
 * theme, so a page could look correct in light mode and compute near-black
 * text on a near-black background in dark mode.
 *
 * This walks the real rendered page in both themes and computes WCAG 2.1
 * contrast for every visible text node, so the same rot fails loudly next time.
 */

const PAGES = [
  '/',
  '/products',
  '/blogs',
  '/brands',
  '/cart',
  '/impact',
  '/imperfect',
  '/sustainability',
  '/terracycle',
  '/bundles',
]

interface Failure {
  text: string
  fg: string
  bg: string
  ratio: number
  need: number
  cls: string
}

/**
 * Runs in the page. Returns every visible text node whose contrast against its
 * nearest painted ancestor background falls below the WCAG AA threshold for its
 * size (3:1 for large text, 4.5:1 otherwise).
 *
 * Two things this deliberately does NOT measure, both of which hid real bugs:
 *
 *  - Text over a background *image*. The effective backdrop is whatever the
 *    photo paints, which cannot be sampled from the CSSOM. Those nodes are
 *    skipped, so a green run is not a statement about them.
 *  - Anything outside main/header/footer.
 *
 * Gradient-clipped text used to fall in the first hole and no longer does: it
 * is measured stop by stop, composited over the backdrop.
 */
function auditContrast(): Failure[] {
  const parse = (value: string): number[] | null => {
    const parts = value.match(/[\d.]+/g)
    return parts ? parts.slice(0, 3).map(Number) : null
  }

  const luminance = (rgb: number[]): number => {
    const channel = (raw: number): number => {
      const v = raw / 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
  }

  /**
   * Candidate backdrop colours behind an element, worst case included.
   *
   * A single colour is not enough. A section painted with a gradient has a
   * different backdrop at each end, and text spanning it has to stay legible
   * across all of them. Returns null only when the backdrop genuinely cannot
   * be known from the CSSOM - a raster `url()` background.
   */
  const backdropsOf = (el: Element, skipSelf = false): number[][] | null => {
    let node: Element | null = skipSelf ? el.parentElement : el
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node)
      const parts = style.backgroundColor.match(/[\d.]+/g)
      const opaque = parts && (parts.length < 4 || Number(parts[3]) > 0.5)
      if (opaque) {
        const solid = parse(style.backgroundColor)
        return solid ? [solid] : null
      }

      const image = style.backgroundImage
      if (image && image !== 'none') {
        // A photo cannot be sampled here; a gradient can, by resolving what is
        // behind it and compositing each stop onto that.
        if (image.includes('url(')) return null
        const behind = node.parentElement ? backdropsOf(node.parentElement) : [[255, 255, 255]]
        if (!behind) return null
        const base = behind[0]
        const stops = gradientStopsOver(image, base)
        return stops.length ? stops : behind
      }

      node = node.parentElement
    }
    return [[255, 255, 255]]
  }

  const ratio = (a: number[], b: number[]): number => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }

  /** rgb/rgba -> [r, g, b, a]; alpha defaults to 1. */
  const parse4 = (value: string): number[] | null => {
    const parts = value.match(/[\d.]+/g)
    if (!parts) return null
    const [r, g, b, a] = parts.map(Number)
    return [r, g, b, a === undefined ? 1 : a]
  }

  /**
   * Colour stops of a CSS gradient, each composited over `backdrop` so a
   * translucent stop is judged as it actually renders. `to-accent/70` measured
   * as opaque amber looks acceptable; blended onto cream it is 1.55:1.
   */
  const gradientStopsOver = (backgroundImage: string, backdrop: number[]): number[][] => {
    const matches = backgroundImage.match(/rgba?\([^)]+\)/g) ?? []
    return matches.map((raw) => {
      const c = parse4(raw)
      if (!c) return backdrop
      const alpha = c[3]
      return [0, 1, 2].map((i) => Math.round(c[i] * alpha + backdrop[i] * (1 - alpha)))
    })
  }

  const failures: Failure[] = []

  document.querySelectorAll('main *, footer *, header *').forEach((el) => {
    if (el.children.length) return // only leaf nodes actually paint text
    const text = (el.textContent ?? '').trim()
    if (text.length < 2) return

    const box = el.getBoundingClientRect()
    if (box.width < 2 || box.height < 2) return

    const style = getComputedStyle(el)
    if (style.visibility === 'hidden' || style.opacity === '0') return

    // Gradient-clipped text paints from its background, not its color, so
    // `color` computes to rgba(0,0,0,0) and a naive read scores it as a perfect
    // ratio against anything. A homepage headline hid a 1.55:1 stop this way.
    // Every stop has to clear the bar, because the text crosses all of them.
    const clipsToText =
      style.webkitBackgroundClip === 'text' || style.backgroundClip === 'text'
    const transparentText = (parse4(style.color)?.[3] ?? 1) === 0

    // When the element's own background IS the text, it is not also the
    // backdrop - resolve that from its ancestors instead.
    const backdrops = backdropsOf(el, clipsToText && transparentText)
    if (!backdrops || !backdrops.length) return

    const size = parseFloat(style.fontSize)
    const large = size >= 24 || (size >= 18.66 && parseInt(style.fontWeight, 10) >= 700)
    const need = large ? 3 : 4.5

    // Worst pairing of any text colour against any backdrop colour.
    let worst: { fg: string; bg: number[]; ratio: number } | null = null

    for (const bg of backdrops) {
      const foregrounds: Array<[string, number[]]> =
        clipsToText && transparentText
          ? gradientStopsOver(style.backgroundImage, bg).map(
              (stop) => [`gradient stop rgb(${stop.join(', ')})`, stop] as [string, number[]],
            )
          : (() => {
              const solid = parse(style.color)
              return solid ? [[style.color, solid] as [string, number[]]] : []
            })()

      for (const [label, fg] of foregrounds) {
        const measured = ratio(fg, bg)
        if (!worst || measured < worst.ratio) worst = { fg: label, bg, ratio: measured }
      }
    }

    if (worst && worst.ratio < need) {
      failures.push({
        text: text.slice(0, 40),
        fg: worst.fg,
        bg: `rgb(${worst.bg.join(', ')})`,
        ratio: Number(worst.ratio.toFixed(2)),
        need,
        cls: String(el.className).slice(0, 80),
      })
    }
  })

  return failures
}

async function collectFailures(page: Page, path: string): Promise<Failure[]> {
  // `load` waits for every image, which this audit does not need - it reads
  // computed styles, and text sitting over an image is skipped anyway. Against
  // a production server that wait is expensive: the homepage pulls ten remote
  // brand logos through /_next/image, and the first request downloads and
  // transcodes each one. On a cold CI runner that blew past the 45s test
  // timeout while the page itself had been interactive for seconds.
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
  // A route that does not exist has nothing to say about contrast; a route that
  // 500s is a different test's problem.
  if (!response || response.status() >= 400) return []
  // Fonts change nothing about colour, but they change which nodes have a box,
  // so settle them before measuring.
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  await page.waitForTimeout(1500)
  return page.evaluate(auditContrast)
}

function describeFailures(path: string, theme: string, failures: Failure[]): string {
  const lines = failures.map(
    (f) =>
      `  ${f.ratio}:1 (needs ${f.need}:1)  ${f.fg} on ${f.bg}\n` +
      `    "${f.text}"\n    class="${f.cls}"`,
  )
  return `${failures.length} low-contrast text node(s) on ${path} in ${theme} mode:\n${lines.join('\n')}`
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} mode contrast`, () => {
    test.use({
      // next-themes reads this before paint, so the page renders in the target
      // theme directly. Toggling the class after load races hydration, which
      // silently measures a half-applied theme.
      storageState: {
        cookies: [],
        origins: [
          {
            origin: 'http://localhost:4010',
            localStorage: [{ name: 'theme', value: theme }],
          },
        ],
      },
    })

    for (const path of PAGES) {
      test(`${path} has no low-contrast text`, async ({ page }) => {
        const failures = await collectFailures(page, path)
        expect(failures, describeFailures(path, theme, failures)).toEqual([])
      })
    }
  })
}
