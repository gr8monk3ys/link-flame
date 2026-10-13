/**
 * The static brand assets are committed output of scripts/generate-brand.mjs.
 * These checks keep them present, well-formed, on-system (no gradient, no
 * filter, no font reference) and in agreement with the React mark.
 */
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { MARK_PATH } from "@/components/brand/Logo"

const ROOT = process.cwd()
const PUBLIC = join(ROOT, "public")
const BRAND = join(PUBLIC, "brand")

const MOSS = "#456336"
const MOSS_NIGHT = "#abc99c"

const SVGS = [
  "mark.svg",
  "mark-dark.svg",
  "mark-mono.svg",
  "logo-horizontal.svg",
  "logo-horizontal-dark.svg",
  "logo-stacked.svg",
  "logo-stacked-dark.svg",
]

const PNGS: Array<[string, number, number]> = [
  ["favicon-16x16.png", 16, 16],
  ["favicon-32x32.png", 32, 32],
  ["apple-touch-icon.png", 180, 180],
  ["android-chrome-192x192.png", 192, 192],
  ["android-chrome-512x512.png", 512, 512],
  ["android-chrome-512x512-maskable.png", 512, 512],
  ["og.png", 1200, 630],
]

function pngSize(file: string) {
  const buf = readFileSync(file)
  // PNG: 8-byte signature, then the IHDR chunk: length(4) "IHDR"(4) width(4) height(4).
  expect(buf.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  expect(buf.subarray(12, 16).toString("ascii")).toBe("IHDR")
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

function parseSvg(text: string) {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml")
  expect(doc.querySelector("parsererror")).toBeNull()
  expect(doc.documentElement.tagName).toBe("svg")
  return doc
}

describe("brand assets", () => {
  it("the generator carries the same MARK_PATH as <LogoMark>", () => {
    const script = readFileSync(join(ROOT, "scripts", "generate-brand.mjs"), "utf8")
    const component = readFileSync(join(ROOT, "components", "brand", "Logo.tsx"), "utf8")
    const scriptPath = script.match(/const MARK_PATH =\s*\n?\s*"([^"]+)"/)?.[1]
    const componentPath = component.match(/export const MARK_PATH =\s*\n?\s*"([^"]+)"/)?.[1]
    expect(scriptPath).toBeDefined()
    expect(componentPath).toBe(MARK_PATH)
    expect(scriptPath).toBe(MARK_PATH)
    // Plate, leaf, slit: three closed subpaths on the 24-unit grid.
    expect(MARK_PATH.startsWith("M0 0H24V24H0Z")).toBe(true)
    expect(MARK_PATH.match(/Z/g)).toHaveLength(3)
  })

  it.each(SVGS)("public/brand/%s parses as XML with no gradient, filter or font", (name) => {
    const file = join(BRAND, name)
    expect(existsSync(file)).toBe(true)
    const text = readFileSync(file, "utf8")
    const doc = parseSvg(text)
    expect(doc.documentElement.getAttribute("viewBox")).toMatch(/^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/)
    expect(doc.querySelector("linearGradient, radialGradient, filter")).toBeNull()
    expect(text).not.toMatch(/font-family|@font-face|<text/)
    expect(text).not.toMatch(/NaN/)
  })

  it("the mark files carry the same path as <LogoMark>, as an evenodd cut-out", () => {
    for (const name of ["mark.svg", "mark-dark.svg", "mark-mono.svg"]) {
      const doc = parseSvg(readFileSync(join(BRAND, name), "utf8"))
      const path = doc.querySelector("path")
      expect(path?.getAttribute("d")).toBe(MARK_PATH)
      expect(path?.getAttribute("fill-rule")).toBe("evenodd")
    }
    const mark = readFileSync(join(BRAND, "mark.svg"), "utf8")
    expect(mark).toContain('fill-rule="evenodd"')
    expect(mark).toContain(MOSS)
    expect(readFileSync(join(BRAND, "mark-dark.svg"), "utf8")).toContain(MOSS_NIGHT)
    expect(readFileSync(join(BRAND, "mark-mono.svg"), "utf8")).toContain('fill="#000"')
  })

  it("the lockups set 'Flame' in Moss", () => {
    for (const [name, moss] of [
      ["logo-horizontal.svg", MOSS],
      ["logo-stacked.svg", MOSS],
      ["logo-horizontal-dark.svg", MOSS_NIGHT],
      ["logo-stacked-dark.svg", MOSS_NIGHT],
    ] as const) {
      const doc = parseSvg(readFileSync(join(BRAND, name), "utf8"))
      expect(doc.querySelector("title")?.textContent).toBe("Link Flame")
      const fills = Array.from(doc.querySelectorAll("path")).map((p) => p.getAttribute("fill"))
      // mark, "Link " in ink, "Flame" in Moss
      expect(fills).toHaveLength(3)
      expect(fills[0]).toBe(moss)
      expect(fills[2]).toBe(moss)
      expect(fills[1]).not.toBe(moss)
    }
  })

  it("public/icon.svg is the favicon form of the mark", () => {
    const text = readFileSync(join(PUBLIC, "icon.svg"), "utf8")
    const doc = parseSvg(text)
    expect(text).not.toMatch(/<text|font-family|#10b981/)
    const paths = doc.querySelectorAll("path")
    expect(paths).toHaveLength(2)
    expect(paths[0].getAttribute("fill")).toBe("#f9f8f5")
    expect(paths[1].getAttribute("d")).toBe(MARK_PATH)
    expect(paths[1].getAttribute("fill")).toBe(MOSS)
  })

  it("ships a README with the rules", () => {
    const readme = readFileSync(join(BRAND, "README.md"), "utf8")
    expect(readme).toMatch(/clear space/i)
    expect(readme).toMatch(/16px/)
    expect(readme).toMatch(/96px/)
    expect(readme).toMatch(/do not.*rotate/i)
    expect(readme).toMatch(/brand:generate/)
  })

  it.each(PNGS)("public/%s is a %i×%i PNG", (name, width, height) => {
    const file = join(PUBLIC, name)
    expect(existsSync(file)).toBe(true)
    expect(pngSize(file)).toEqual({ width, height })
  })

  it("favicon.ico holds the 16, 32 and 48 sizes", () => {
    const buf = readFileSync(join(PUBLIC, "favicon.ico"))
    // ICONDIR: reserved(2)=0, type(2)=1, count(2); then 16-byte entries with width, height.
    expect(buf.readUInt16LE(0)).toBe(0)
    expect(buf.readUInt16LE(2)).toBe(1)
    const count = buf.readUInt16LE(4)
    const sizes = Array.from({ length: count }, (_, i) => buf.readUInt8(6 + i * 16))
    expect(sizes.sort((a, b) => a - b)).toEqual([16, 32, 48])
  })

  it("docs/brand/lockups.png is the 2x contact sheet", () => {
    expect(pngSize(join(ROOT, "docs", "brand", "lockups.png"))).toEqual({ width: 2400, height: 1520 })
  })

  it("site.webmanifest points at the app icons in the notebook colours", () => {
    const manifest = JSON.parse(readFileSync(join(PUBLIC, "site.webmanifest"), "utf8"))
    expect(manifest.name).toBe("Link Flame")
    expect(manifest.short_name).toBe("Link Flame")
    expect(manifest.theme_color).toBe(MOSS)
    expect(manifest.background_color).toBe("#f9f8f5")
    const icons = manifest.icons as Array<{ src: string; sizes: string; type: string; purpose?: string }>
    expect(icons.map((i) => i.src)).toEqual([
      "/android-chrome-192x192.png",
      "/android-chrome-512x512.png",
      "/android-chrome-512x512-maskable.png",
    ])
    expect(icons[2].purpose).toBe("maskable")
    for (const icon of icons) {
      expect(icon.type).toBe("image/png")
      expect(existsSync(join(PUBLIC, icon.src))).toBe(true)
    }
  })
})
