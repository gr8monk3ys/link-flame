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
 * Elements over a background *image* or gradient are skipped: the effective
 * backdrop there is whatever the image paints, which this cannot sample.
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

  const backdropOf = (el: Element): number[] | null => {
    let node: Element | null = el
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node)
      const parts = style.backgroundColor.match(/[\d.]+/g)
      const opaque = parts && (parts.length < 4 || Number(parts[3]) > 0.5)
      if (opaque) return parse(style.backgroundColor)
      if (style.backgroundImage && style.backgroundImage !== 'none') return null
      node = node.parentElement
    }
    return [0, 0, 0]
  }

  const ratio = (a: number[], b: number[]): number => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
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

    const fg = parse(style.color)
    const bg = backdropOf(el)
    if (!fg || !bg) return

    const size = parseFloat(style.fontSize)
    const large = size >= 24 || (size >= 18.66 && parseInt(style.fontWeight, 10) >= 700)
    const need = large ? 3 : 4.5
    const measured = ratio(fg, bg)

    if (measured < need) {
      failures.push({
        text: text.slice(0, 40),
        fg: style.color,
        bg: `rgb(${bg.join(', ')})`,
        ratio: Number(measured.toFixed(2)),
        need,
        cls: String(el.className).slice(0, 80),
      })
    }
  })

  return failures
}

async function collectFailures(page: Page, path: string): Promise<Failure[]> {
  const response = await page.goto(path, { waitUntil: 'load' })
  // A route that does not exist has nothing to say about contrast; a route that
  // 500s is a different test's problem.
  if (!response || response.status() >= 400) return []
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
