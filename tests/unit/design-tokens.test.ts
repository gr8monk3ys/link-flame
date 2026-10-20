/**
 * Every text/ground pair the notebook uses must clear WCAG AA (4.5:1) in both
 * themes, measured from the HSL triplets in styles/globals.css rather than
 * trusted from DESIGN.md. The e2e contrast audit (tests/e2e/contrast.spec.ts)
 * measures the rendered pages; this one fails before a build exists.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const CSS = readFileSync(join(process.cwd(), "styles/globals.css"), "utf8")

function block(selector: string): Record<string, string> {
  const m = CSS.match(new RegExp(`\\n\\s*${selector.replace(".", "\\.")}\\s*\\{([^}]+)\\}`))
  if (!m) throw new Error(`no ${selector} block`)
  const out: Record<string, string> = {}
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^\s*(--[\w-]+):\s*([^;]+);/)
    if (kv) out[kv[1]] = kv[2].trim()
  }
  return out
}

function hslToRgb(triplet: string): [number, number, number] {
  const [h, s, l] = triplet.replace(/%/g, "").split(/\s+/).map(Number)
  const S = s / 100
  const L = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = S * Math.min(L, 1 - L)
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255)) as [number, number, number]
}

const lum = ([r, g, b]: [number, number, number]) => {
  const c = [r, g, b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

const contrast = (a: string, b: string) => {
  const [l1, l2] = [lum(hslToRgb(a)), lum(hslToRgb(b))].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const hex = (triplet: string) =>
  `#${hslToRgb(triplet)
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`

const PAIRS: Array<[string, string, number]> = [
  ["--foreground", "--background", 4.5],
  ["--foreground", "--card", 4.5],
  ["--foreground", "--muted", 4.5],
  ["--foreground", "--accent", 4.5],
  ["--card-foreground", "--card", 4.5],
  ["--popover-foreground", "--popover", 4.5],
  ["--accent-foreground", "--accent", 4.5],
  // Ink Muted on every paper tint: wall labels, descriptions, facet counts.
  ["--muted-foreground", "--background", 4.5],
  ["--muted-foreground", "--card", 4.5],
  ["--muted-foreground", "--muted", 4.5],
  ["--muted-foreground", "--accent", 4.5],
  // Moss as text (links, hover, the label-link) on every paper tint.
  ["--primary", "--background", 4.5],
  ["--primary", "--card", 4.5],
  ["--primary", "--muted", 4.5],
  ["--primary", "--accent", 4.5],
  // Text on the two fills.
  ["--primary-foreground", "--primary", 4.5],
  ["--secondary-foreground", "--secondary", 4.5],
  // Status as text on paper, and text on a status fill.
  ["--destructive", "--background", 4.5],
  ["--destructive", "--card", 4.5],
  ["--destructive-foreground", "--destructive", 4.5],
  ["--success", "--background", 4.5],
  ["--success-foreground", "--success", 4.5],
  ["--warning", "--background", 4.5],
  ["--warning-foreground", "--warning", 4.5],
  ["--info", "--background", 4.5],
  ["--info-foreground", "--info", 4.5],
  ["--ring", "--background", 3], // the focus outline sits on the page, 3:1 is the non-text floor
  ["--border", "--background", 1.15], // a hairline only has to be visible
]

for (const [theme, selector] of [
  ["light", ":root"],
  ["dark", ".dark"],
] as const) {
  describe(`${theme} tokens`, () => {
    const t = { ...block(":root"), ...(theme === "dark" ? block(".dark") : {}) }
    for (const [fg, bg, floor] of PAIRS) {
      it(`${fg} on ${bg} ≥ ${floor}:1`, () => {
        expect(t[fg]).toBeDefined()
        expect(t[bg]).toBeDefined()
        expect(contrast(t[fg].split("/")[0], t[bg].split("/")[0])).toBeGreaterThanOrEqual(floor)
      })
    }
  })
}

describe("the stationery", () => {
  it("is the shared paper and night", () => {
    expect(block(":root")["--background"]).toBe("38 25% 97%")
    expect(hex("38 25% 97%")).toBe("#f9f8f5")
    expect(block(".dark")["--background"]).toBe("220 15% 8%")
    expect(hex("220 15% 8%")).toBe("#111317")
    expect(block(":root")["--border"]).toBe("30 18% 86%")
    expect(block(".dark")["--border"]).toBe("220 10% 18%")
  })

  it("writes in Moss in both themes", () => {
    expect(block(":root")["--primary"]).toBe("100 30% 30%")
    expect(hex("100 30% 30%")).toBe("#456336")
    expect(block(".dark")["--primary"]).toBe("100 30% 70%")
    expect(hex("100 30% 70%")).toBe("#abc99c")
    // The numbers DESIGN.md quotes.
    expect(contrast("100 30% 30%", "38 25% 97%")).toBeCloseTo(6.4, 1)
    expect(contrast("100 30% 70%", "220 15% 8%")).toBeCloseTo(10.24, 1)
  })

  it("the ring is the ink", () => {
    expect(block(":root")["--ring"]).toBe(block(":root")["--primary"])
    expect(block(".dark")["--ring"]).toBe(block(".dark")["--primary"])
  })

  it("the scrim is ink in both themes, never --foreground", () => {
    expect(block(":root")["--scrim"]).toBe("0 0% 4%")
    expect(block(".dark")["--scrim"]).toBeUndefined()
    expect(block(":root")["--scrim-alpha"]).toBe("0.25")
    expect(block(".dark")["--scrim-alpha"]).toBe("0.55")
  })

  it("retired aurora-era tokens and classes are gone", () => {
    for (const name of ["--shadow-warm", "--shadow-warm-sm", "--shadow-warm-md", "--shadow-warm-lg"]) {
      expect(CSS).not.toContain(`${name}:`)
    }
    // Honey amber (the old --accent) and the old forest primary.
    expect(CSS).not.toContain("38 80% 55%")
    expect(CSS).not.toContain("152 45% 30%")
    for (const cls of [
      ".hover-card-effect",
      ".modern-button",
      ".glass-effect",
      ".shimmer",
      ".floating",
      ".fade-in",
      ".slide-up",
      ".scale-animation",
      ".card-flip",
      ".hero-section",
      ".content-section",
      ".testimonial-card",
      ".animated-underline",
      ".text-gradient",
    ]) {
      expect(CSS).not.toContain(`${cls} `)
      expect(CSS).not.toContain(`${cls}{`)
    }
  })

  it("content never animates itself in", () => {
    for (const name of ["fadeIn", "slideUp", "scale", "shimmer", "floating"]) {
      expect(CSS).not.toContain(`@keyframes ${name}`)
    }
  })

  it("keeps the Tailwind v4 compatibility pieces the tree still needs", () => {
    expect(CSS).toContain('@import "./tailwind-v3-palette.css"')
    expect(CSS).toContain("@utility space-x-*")
    expect(CSS).toContain("@utility space-y-*")
    expect(CSS).toContain("@utility container")
    expect(CSS).toMatch(/border-color: hsl\(var\(--border\)\)/)
  })

  it("declares the three voices and the transitional serif alias", () => {
    for (const v of ["--font-display", "--font-body", "--font-mono", "--font-sans", "--font-serif"]) {
      expect(CSS).toContain(`${v}: var(`)
    }
    expect(CSS).toMatch(/--font-serif: var\(--font-display\)/)
  })

  it("clamps the radius scale at 18px", () => {
    for (const step of ["xl", "2xl", "3xl", "4xl"]) {
      expect(CSS).toMatch(new RegExp(`--radius-${step}: 1\\.125rem;`))
    }
  })
})
