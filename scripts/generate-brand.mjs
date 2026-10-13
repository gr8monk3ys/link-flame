#!/usr/bin/env node
/**
 * generate-brand.mjs — every static brand asset, from one path.
 *
 *   npm run brand:generate        (node scripts/generate-brand.mjs)
 *
 * The mark is the leaf-flame: a square Moss plate with a leaf whose tip rises
 * into a flame cut out of it in paper (components/brand/Logo.tsx has the
 * rationale). This script is the source of truth for everything under
 * public/brand/, the favicons, app icons and OG image in public/, and
 * docs/brand/lockups.png; the output is committed so the build never runs it.
 *
 * Writes:
 *   public/brand/mark.svg, mark-dark.svg, mark-mono.svg
 *   public/brand/logo-horizontal{,-dark}.svg, logo-stacked{,-dark}.svg
 *     (wordmark converted to outlines with opentype.js — no font reference)
 *   public/icon.svg (the favicon form of the mark)
 *   public/favicon.ico (16+32+48), favicon-16x16.png, favicon-32x32.png
 *   public/apple-touch-icon.png (180), android-chrome-192x192.png,
 *     android-chrome-512x512.png, android-chrome-512x512-maskable.png
 *   public/og.png (1200×630)
 *   docs/brand/lockups.png (a 2x contact sheet for the README and PRs)
 *
 * MARK_PATH must equal the constant in components/brand/Logo.tsx;
 * tests/unit/brand-assets.test.ts fails when the two drift.
 *
 * Output is deterministic: run it twice and `git status` stays clean.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"
import pngToIco from "png-to-ico"

// opentype.js ships CJS; createRequire keeps this file plain ESM.
const require = createRequire(import.meta.url)
const opentype = require("opentype.js")

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PUBLIC = join(ROOT, "public")
const BRAND = join(PUBLIC, "brand")
const DOCS = join(ROOT, "docs", "brand")
const DISPLAY_FONT = join(ROOT, "node_modules/@fontsource/fraunces/files/fraunces-latin-700-normal.woff")
const MONO_FONT = join(ROOT, "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff")

/* ------------------------------------------------------------------ tokens */

// The notebook palette. Literal because an SVG file has no CSS variables.
const MOSS = "#456336" // hsl(100 30% 30%)
const MOSS_NIGHT = "#abc99c" // hsl(100 30% 70%)
const PAPER = "#f9f8f5"
const NIGHT = "#111317"
const INK = "#1a1f23"
const NIGHT_INK = "#fafafa"

/* -------------------------------------------------------------------- mark */

// Plate (first subpath), leaf-flame (second, a hole under evenodd) and the
// midrib slit (third, inside the leaf, so it fills back). Same string as
// Logo.tsx.
const MARK_PATH =
  "M0 0H24V24H0ZM16 2C14.3 6.8 20 10 20 15C20 18.8 16.4 22 12 22C7.6 22 4 18.8 4 15C4 8.8 11 5.2 16 2ZM10.4 20.5C10.4 15 12 10.5 14 7C14.1 10.5 13.5 15 13.5 20.5Z"
const LEAF_PATH = MARK_PATH.slice(MARK_PATH.indexOf("M16"), MARK_PATH.indexOf("M10.4"))
const MARK_UNITS = 24

// Fraunces 700: sCapHeight 1400 / unitsPerEm 2000.
const CAP_HEIGHT = 0.7
const TRACKING = -0.02

const markPath = (fill) => `<path fill="${fill}" fill-rule="evenodd" d="${MARK_PATH}"/>`

/** The mark alone, viewBox 0 0 24 24. The leaf is transparent. */
function markSvg(fill) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_UNITS} ${MARK_UNITS}">${markPath(fill)}</svg>`
}

/**
 * The mark with the leaf filled (the favicon form). Outside the plate stays
 * transparent, but the leaf is paper rather than a hole so the favicon reads
 * the same on a light and a dark tab strip. The slit is part of MARK_PATH, so
 * it is drawn in ink on top of the paper leaf.
 */
function faviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_UNITS} ${MARK_UNITS}"><path fill="${PAPER}" d="${LEAF_PATH}"/>${markPath(MOSS)}</svg>`
}

/** The mark on a paper ground with `padding` (fraction of the side) around it. No transparency. */
function appIconSvg(padding) {
  const inner = 1 - padding * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="${PAPER}"/><g transform="translate(${padding} ${padding}) scale(${inner / MARK_UNITS})">${markPath(MOSS)}</g></svg>`
}

/* ---------------------------------------------------------------- wordmark */

async function loadFont(file) {
  const buf = await readFile(file)
  // opentype.parse wants the exact ArrayBuffer slice; Buffer.buffer is the pool.
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
}

/**
 * Serialise an opentype.js Path to SVG path data at two decimals. Not
 * `Path.toPathData`: opentype.js 2.0 memoises its rounding on the float's
 * fractional part and that cache hands back NaN for some sizes.
 */
function pathData(path) {
  const n = (v) => {
    if (!Number.isFinite(v)) throw new Error(`non-finite coordinate in outlined text: ${v}`)
    return String(Math.round(v * 100) / 100)
  }
  let d = ""
  for (const c of path.commands) {
    if (c.type === "M" || c.type === "L") d += `${c.type}${n(c.x)} ${n(c.y)}`
    else if (c.type === "Q") d += `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
    else if (c.type === "C") d += `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
    else if (c.type === "Z") d += "Z"
    else throw new Error(`unknown path command ${c.type}`)
  }
  return d
}

/**
 * "Link Flame" as two outlined paths, "Link " and "Flame", at `fontSize` with
 * the baseline at (x, y). Kerning stays on; the split falls on the space so
 * it costs nothing.
 */
function wordmark(font, x, y, fontSize) {
  const opts = { kerning: true, letterSpacing: TRACKING }
  const link = font.getPath("Link ", x, y, fontSize, opts)
  const advance = font.getAdvanceWidth("Link ", fontSize, opts)
  const flame = font.getPath("Flame", x + advance, y, fontSize, opts)
  const a = link.getBoundingBox()
  const b = flame.getBoundingBox()
  return {
    link: pathData(link),
    flame: pathData(flame),
    bbox: { x1: a.x1, y1: Math.min(a.y1, b.y1), x2: b.x2, y2: Math.max(a.y2, b.y2) },
  }
}

/** Any other line of text, outlined: one path, baseline at (x, y). `letterSpacing` is in em. */
function textPath(font, text, x, y, fontSize, letterSpacing = 0) {
  const path = font.getPath(text, x, y, fontSize, { kerning: true, letterSpacing })
  return { d: pathData(path), bbox: path.getBoundingBox() }
}

const r2 = (n) => Math.round(n * 100) / 100

/**
 * A lockup, drawn at mark size M. Horizontal: mark, a gap of M/2 (12px at the
 * component's default 24px), wordmark with cap height M. Stacked: mark above,
 * the same gap, wordmark centred beneath with cap height M/2. The viewBox is
 * tight around the ink.
 */
function lockupSvg(font, { variant, markFill, inkFill, accentFill }) {
  const M = 96
  const GAP = M / 2
  let markX, markY, wm
  if (variant === "horizontal") {
    const fontSize = M / CAP_HEIGHT
    markX = 0
    markY = 0
    wm = wordmark(font, M + GAP, M, fontSize)
  } else {
    const cap = M / 2
    const fontSize = cap / CAP_HEIGHT
    const probe = wordmark(font, 0, 0, fontSize)
    const width = probe.bbox.x2 - probe.bbox.x1
    markX = (width - M) / 2 + probe.bbox.x1
    markY = 0
    wm = wordmark(font, 0, M + GAP + cap, fontSize)
  }
  const x1 = Math.min(markX, wm.bbox.x1)
  const y1 = Math.min(markY, wm.bbox.y1)
  const x2 = Math.max(markX + M, wm.bbox.x2)
  const y2 = Math.max(markY + M, wm.bbox.y2)
  const scale = M / MARK_UNITS
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r2(x1)} ${r2(y1)} ${r2(x2 - x1)} ${r2(y2 - y1)}">` +
    `<title>Link Flame</title>` +
    `<g transform="translate(${r2(markX)} ${r2(markY)}) scale(${r2(scale)})">${markPath(markFill)}</g>` +
    `<path fill="${inkFill}" d="${wm.link}"/>` +
    `<path fill="${accentFill}" d="${wm.flame}"/>` +
    `</svg>`
  )
}

/* ------------------------------------------------------------------ raster */

function png(svg, width, background) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    // Every glyph is outlined, so no system font is ever consulted; this keeps
    // the output identical on any machine.
    font: { loadSystemFonts: false },
    ...(background ? { background } : {}),
  })
  return resvg.render().asPng()
}

const dataUri = (buf) => `data:image/png;base64,${buf.toString("base64")}`

/**
 * public/og.png — 1200×630 on paper: the mark, "Link Flame" in Fraunces 700
 * Ink with "Flame" in Moss, and the kicker in Plex Mono beneath. Flat; no
 * gradient, no photo.
 */
function ogSvg(display, mono) {
  const W = 1200
  const H = 630
  const X = 96
  const M = 112 // mark side
  const cap = 104
  const fontSize = cap / CAP_HEIGHT
  const wm = wordmark(display, X, 400, fontSize)
  if (wm.bbox.x2 > W - X) throw new Error(`og wordmark overflows: ${wm.bbox.x2}`)
  const kicker = textPath(mono, "Everyday essentials, minus the plastic.", X, 470, 26, 0.02)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${PAPER}"/>` +
    `<g transform="translate(${X} ${X}) scale(${r2(M / MARK_UNITS)})">${markPath(MOSS)}</g>` +
    `<path fill="${INK}" d="${wm.link}"/>` +
    `<path fill="${MOSS}" d="${wm.flame}"/>` +
    `<path fill="${INK}" opacity="0.72" d="${kicker.d}"/>` +
    `</svg>`
  )
}

/**
 * docs/brand/lockups.png — a 2x contact sheet: the mark at 16/32/88, the two
 * lockups, by day and by night.
 */
function contactSheet(display, mono) {
  const W = 1200
  const H = 760
  const rows = [
    { y: 0, bg: PAPER, mark: MOSS, ink: INK, label: "PAPER · MOSS #456336" },
    { y: H / 2, bg: NIGHT, mark: MOSS_NIGHT, ink: NIGHT_INK, label: "NIGHT · MOSS #ABC99C" },
  ]
  const parts = []
  for (const row of rows) {
    parts.push(`<rect y="${row.y}" width="${W}" height="${H / 2}" fill="${row.bg}"/>`)
    let x = 48
    const cy = row.y + 110
    for (const size of [16, 32, 88]) {
      parts.push(
        `<image x="${x}" y="${cy - size / 2}" width="${size}" height="${size}" href="${dataUri(png(markSvg(row.mark), size, row.bg))}"/>`
      )
      x += size + 32
    }
    const lockup = (variant) =>
      lockupSvg(display, { variant, markFill: row.mark, inkFill: row.ink, accentFill: row.mark })
    const hw = 420
    parts.push(
      `<image x="${x + 48}" y="${cy - 32}" width="${hw}" height="64" href="${dataUri(png(lockup("horizontal"), hw * 2, row.bg))}"/>`
    )
    const sw = 200
    parts.push(
      `<image x="${x + 48 + hw + 96}" y="${row.y + 40}" width="${sw}" height="${sw * 1.1}" preserveAspectRatio="xMidYMin" href="${dataUri(png(lockup("stacked"), sw * 2, row.bg))}"/>`
    )
    const label = textPath(mono, `${row.label} · MARK 16 / 32 / 88 · HORIZONTAL · STACKED`, 48, row.y + H / 2 - 40, 13, 0.12)
    parts.push(`<path fill="${row.ink}" opacity="0.6" d="${label.d}"/>`)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${parts.join("")}</svg>`
  return png(svg, W * 2)
}

/* -------------------------------------------------------------------- main */

async function main() {
  await mkdir(BRAND, { recursive: true })
  await mkdir(DOCS, { recursive: true })
  const display = await loadFont(DISPLAY_FONT)
  const mono = await loadFont(MONO_FONT)

  const lockup = (variant, night) =>
    lockupSvg(display, {
      variant,
      markFill: night ? MOSS_NIGHT : MOSS,
      inkFill: night ? NIGHT_INK : INK,
      accentFill: night ? MOSS_NIGHT : MOSS,
    })
  const svgs = {
    "mark.svg": markSvg(MOSS),
    "mark-dark.svg": markSvg(MOSS_NIGHT),
    "mark-mono.svg": markSvg("#000"),
    "logo-horizontal.svg": lockup("horizontal", false),
    "logo-horizontal-dark.svg": lockup("horizontal", true),
    "logo-stacked.svg": lockup("stacked", false),
    "logo-stacked-dark.svg": lockup("stacked", true),
  }
  for (const [name, svg] of Object.entries(svgs)) {
    await writeFile(join(BRAND, name), `${svg}\n`)
  }

  const favicon = faviconSvg()
  await writeFile(join(PUBLIC, "icon.svg"), `${favicon}\n`)

  const pngs = {
    "favicon-16x16.png": png(favicon, 16),
    "favicon-32x32.png": png(favicon, 32),
    "apple-touch-icon.png": png(appIconSvg(0.12), 180),
    "android-chrome-192x192.png": png(appIconSvg(0.12), 192),
    "android-chrome-512x512.png": png(appIconSvg(0.12), 512),
    // Maskable safe zone is a circle of 80% diameter; a square inscribed in
    // it has a side of 0.8/√2 ≈ 0.566, so 22% padding keeps the plate inside.
    "android-chrome-512x512-maskable.png": png(appIconSvg(0.22), 512),
    "og.png": png(ogSvg(display, mono), 1200),
  }
  for (const [name, buf] of Object.entries(pngs)) {
    await writeFile(join(PUBLIC, name), buf)
  }
  await writeFile(
    join(PUBLIC, "favicon.ico"),
    await pngToIco([png(favicon, 16), png(favicon, 32), png(favicon, 48)])
  )

  await writeFile(join(DOCS, "lockups.png"), contactSheet(display, mono))

  console.log(
    `brand: ${Object.keys(svgs).length} SVGs in public/brand, icon.svg + ${Object.keys(pngs).length} PNGs + favicon.ico in public, docs/brand/lockups.png`
  )
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
