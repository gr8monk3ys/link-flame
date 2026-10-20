#!/usr/bin/env node
/* global console, process */
/**
 * check-design-system.mjs — make DESIGN.md fail the build the way TypeScript does.
 *
 * DESIGN.md (the Stock Ledger) documents named rules: The One Pen Rule, The
 * Flat Paper Rule, The Two Sheets Rule, The Serif Speaks Rule, … Prose does
 * not fail CI, so the rules that are mechanically checkable are checked here.
 * Zero dependencies, plain Node, one pass over app/, components/, lib/ and
 * hooks/ `*.tsx`.
 *
 *   node scripts/check-design-system.mjs          human-readable report
 *   node scripts/check-design-system.mjs --json   machine output
 *
 * Exit 0 when clean, 1 when any rule fires or the ratchet moves.
 *
 * Two kinds of finding:
 *
 *   HARD    a rule hit that is not covered by LEGACY. The first one fails.
 *   RATCHET the aurora-era names (raw palette hues, shadows, gradients, blur,
 *           entrance animations, font-serif) still in the tree. Each has a
 *           baseline measured on the branch that introduced this script
 *           (design/notebook-tokens, 2026-10-19). The count may only fall: a
 *           count above its baseline fails (something came back), and a count
 *           below it also fails until the baseline is lowered in the same PR,
 *           so the table always says what is true. Delete an entry when it
 *           reaches zero; its names then fail as plain violations of the rule
 *           that replaced them.
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const SCAN_DIRS = ["app", "components", "lib", "hooks"]

/* ------------------------------------------------------------------ policy */

/**
 * Every Tailwind hue is off-system. DESIGN.md → Colors → The One Pen Rule:
 * colour goes through the tokens, and status goes through text-success /
 * text-warning / text-info / text-destructive — never `green-500`.
 */
const STATUS_FAMILIES = ["red", "orange", "amber", "yellow", "lime", "green", "emerald"]
const OTHER_FAMILIES = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "violet",
  "purple",
  "indigo",
  "blue",
  "sky",
  "cyan",
  "teal",
  "fuchsia",
  "pink",
  "rose",
]
const PALETTE_FAMILIES = [...STATUS_FAMILIES, ...OTHER_FAMILIES]

const PALETTE_PREFIXES =
  "bg|text|border|from|to|via|ring|shadow|placeholder|divide|outline|fill|stroke|decoration|accent|caret"

const paletteRe = (families) =>
  new RegExp(`\\b(?:${PALETTE_PREFIXES})-(?:${families.join("|")})-[0-9]{2,3}\\b`, "g")

/**
 * Documented exemptions. One entry per exemption, one line saying WHY it is
 * data (or a sanctioned singleton) rather than styling. Changing what is
 * allowed is a one-line edit here — never a change to a rule's regex.
 *
 *   rule   which rule the exemption applies to
 *   file   repo-relative path, forward slashes
 *   block  optional: only inside this named declaration (`const NAME = ...`)
 *   lines  optional: only these 1-based line numbers
 *   limit  optional: exempt at most this many hits
 */
const ALLOWLIST = [
  {
    rule: "palette",
    file: "components/ui/tailwind-indicator.tsx",
    // Dev-only breakpoint badge; returns null in production, never ships to a user.
    why: "dev-only breakpoint indicator, returns null in production",
  },
  {
    rule: "flat-paper",
    file: "components/site-header.tsx",
    limit: 1,
    // DESIGN.md → Elevation → The Two Sheets Rule: the header sheet is one of the two sanctioned shadows.
    why: "the sticky header sheet, one of the two sanctioned shadows",
  },
  {
    rule: "one-glass",
    file: "components/site-header.tsx",
    limit: 1,
    // DESIGN.md → Shapes: glass is for chrome that sits over itself; the header is the instance.
    why: "the sticky header is the one glass surface",
  },
]

/**
 * The ratchet. `re` is the sub-pattern of the rule's hits that is legacy;
 * `baseline` is the count on this branch when the entry was written. Counts
 * may only fall. `note` entries are reminders with nothing to count.
 *
 * Baselines measured on design/notebook-tokens at the commit that added this
 * file (PR (b) of the notebook: tokens, fonts, primitives, shells). The page
 * PRs (c: storefront and marketing, d: account, admin, cart, checkout) drive
 * each one to zero.
 */
const LEGACY = {
  "status-hue": {
    rule: "palette",
    re: paletteRe(STATUS_FAMILIES),
    baseline: 1455,
    fix: "text-success / text-warning / text-destructive and their -muted washes, or a mono wall label where the hue was encoding data",
  },
  palette: {
    rule: "palette",
    re: paletteRe(OTHER_FAMILIES),
    baseline: 310,
    // The brief made `palette` a hard rule for these families; 300 sites is
    // too many to fix in the tokens PR, so they ratchet like the status hues.
    fix: "the paper / ink / hairline tokens (bg-card, text-muted-foreground, border-border)",
  },
  shadow: {
    rule: "flat-paper",
    re: /(?<![\w-])(?:[\w-]+:)*shadow-(?:2xs|xs|sm|md|lg|xl|2xl|\[[^\]]*\])(?![\w-])/g,
    baseline: 111,
    fix: "a hairline and a tint shift; nothing lifts (The Flat Paper Rule)",
  },
  "shadow-warm": {
    rule: "flat-paper",
    re: /(?<![\w-])(?:[\w-]+:)*shadow-warm(?:-(?:sm|md|lg))?(?![\w-])/g,
    baseline: 4,
    // The --shadow-warm-* theme tokens are gone, so these classes already
    // render no shadow; they are dead names waiting to be deleted.
    fix: "delete the class; the brown-shadow vocabulary is retired",
  },
  "backdrop-blur": {
    rule: "one-glass",
    re: /(?<![\w-])(?:[\w-]+:)*backdrop-blur(?:-[\w]+)?(?![\w-])/g,
    baseline: 10,
    fix: "an opaque popover / card surface, or overlay-scrim for a modal",
  },
  "gradient-utility": {
    rule: "no-gradient",
    re: /(?<![\w-])(?:[\w-]+:)*(?:bg-linear-|bg-radial|bg-conic)[\w-]*/g,
    baseline: 35,
    fix: "a flat token fill (bg-muted, bg-card) or no fill at all",
  },
  entrance: {
    rule: "no-entrance",
    re: /(?<![\w-])(?:[\w-]+:)*(?:animate-in|fade-in(?:-\d+)?|slide-in-from-[\w-]+|animate-\[(?:fadeIn|slideUp|scale)[^\]]*\])(?![\w-])/g,
    baseline: 22,
    fix: "render the content; hover, focus and loading indicators are the only things that move",
  },
  "font-serif": {
    rule: "serif-speaks",
    re: /(?<![\w-])(?:[\w-]+:)*font-serif(?![\w-])/g,
    baseline: 41,
    // `--font-serif` is kept in @theme as an alias of the display face only
    // while these sites migrate; delete the alias with the last call site.
    fix: "font-display on a heading (the base layer already sets it on h1–h6), or drop the class",
  },
  "v3-palette": {
    note: "styles/tailwind-v3-palette.css (and its @import in styles/globals.css) holds v3's raw palette values for the status-hue and palette sites above. Delete both when those two entries reach zero.",
  },
}

const RULES = {
  palette: {
    title: "Hardcoded Tailwind palette utilities",
    doc: "DESIGN.md → Colors → The One Pen Rule. Route every colour through the tokens; status is text-success / text-warning / text-info / text-destructive.",
  },
  "flat-paper": {
    title: "Shadow on a content surface",
    doc: "DESIGN.md → Elevation → The Flat Paper Rule and The Two Sheets Rule: only the header sheet and cta-primary's ledge cast a shadow.",
  },
  "no-gradient": {
    title: "Gradient fill or text",
    doc: "DESIGN.md → Colors → The One Pen Rule: ink marks action and emphasis, never area. No gradient anywhere.",
  },
  "one-glass": {
    title: "backdrop-blur outside the header",
    doc: "DESIGN.md → Shapes: glass is for chrome that sits over itself, not for content.",
  },
  "serif-speaks": {
    title: "Display font outside a heading",
    doc: 'DESIGN.md → Typography → The Serif Speaks Rule: Fraunces on h1–h6, the type-scale utilities and the wordmark only. Mark a deliberate exception with data-voice="display".',
  },
  "tiny-font": {
    title: "Literal font size below the 12px label step",
    doc: "DESIGN.md → Typography → Label: the wall label is the only thing under 12px, and it is a utility, not a literal.",
  },
  "no-entrance": {
    title: "Content animates itself in",
    doc: "DESIGN.md → Motion: content does not animate itself in. Hover, focus and loading indicators move; the page does not.",
  },
  ratchet: {
    title: "Legacy ratchet moved",
    doc: "The LEGACY table at the top of scripts/check-design-system.mjs: counts may only fall, and a lower count must lower its baseline in the same PR.",
  },
}

/* ------------------------------------------------------------------- files */

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".next" || entry.startsWith(".")) continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, out)
    else if (entry.endsWith(".tsx")) out.push(full)
  }
  return out
}

const cache = new Map()
function read(absPath) {
  let hit = cache.get(absPath)
  if (!hit) {
    const text = readFileSync(absPath, "utf8")
    hit = { text, lines: text.split("\n") }
    cache.set(absPath, hit)
  }
  return hit
}

// Forward slashes on every platform: ALLOWLIST entries are written with "/",
// and on Windows `relative()` returns "\".
const rel = (absPath) => relative(ROOT, absPath).split("\\").join("/")

/* --------------------------------------------------------------- allowlist */

/**
 * Line range [start, end] of `const NAME = ...` / `function NAME(...)`, found by
 * bracket matching. For a `const` the count starts at the `=` so a multi-line
 * type annotation does not close the block early; for a `function` it starts
 * at the declaration line, so the parameter list balances out.
 */
function blockRange(lines, name) {
  const head = new RegExp(
    `^\\s*(?:export\\s+)?(?:async\\s+)?(?:const|let|var|function)\\s+${name}\\b`
  )
  const start = lines.findIndex((line) => head.test(line))
  if (start === -1) return null
  const isBinding = /^\s*(?:export\s+)?(?:const|let|var)\b/.test(lines[start])

  let depth = 0
  let counting = !isBinding
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]
    for (let c = 0; c < line.length; c++) {
      const ch = line[c]
      if (!counting) {
        if (
          ch === "=" &&
          !"=><!".includes(line[c + 1] ?? "") &&
          !"=><!".includes(line[c - 1] ?? "")
        )
          counting = true
        continue
      }
      if (ch === "{" || ch === "(" || ch === "[") depth++
      else if (ch === "}" || ch === ")" || ch === "]") depth--
    }
    if (counting && depth <= 0 && i > start) return [start + 1, i + 1]
    if (counting && depth <= 0 && i === start && /[)}\]]/.test(line)) return [start + 1, i + 1]
  }
  return [start + 1, lines.length]
}

const rangeCache = new Map()
const used = new Map()

function take(entry) {
  const count = (used.get(entry) ?? 0) + 1
  used.set(entry, count)
  if (entry.limit === undefined) return entry
  return count <= entry.limit ? entry : null
}

function isAllowed(rule, file, line, lines) {
  for (const entry of ALLOWLIST) {
    if (entry.rule !== rule || entry.file !== file) continue
    if (entry.lines) {
      if (entry.lines.includes(line)) return take(entry)
      continue
    }
    if (entry.block) {
      const key = `${file}::${entry.block}`
      if (!rangeCache.has(key)) rangeCache.set(key, blockRange(lines, entry.block))
      const range = rangeCache.get(key)
      if (range && line >= range[0] && line <= range[1]) return take(entry)
      continue
    }
    return take(entry)
  }
  return null
}

/* ----------------------------------------------------------------- ratchet */

const legacyCounts = Object.fromEntries(
  Object.entries(LEGACY)
    .filter(([, entry]) => entry.re)
    .map(([name]) => [name, 0])
)

/** If `match` is a legacy name for `rule`, count it against the ratchet. */
function isLegacy(rule, match) {
  for (const [name, entry] of Object.entries(LEGACY)) {
    if (!entry.re || entry.rule !== rule) continue
    entry.re.lastIndex = 0
    if (entry.re.test(match)) {
      legacyCounts[name]++
      return true
    }
  }
  return false
}

/* ------------------------------------------------------------------- utils */

function* matchLines(lines, regex) {
  for (let i = 0; i < lines.length; i++) {
    regex.lastIndex = 0
    let m
    while ((m = regex.exec(lines[i])) !== null) {
      yield { line: i + 1, match: m[0], text: lines[i] }
      if (m[0] === "") regex.lastIndex++
    }
  }
}

const snippet = (text) => text.trim().replace(/\s+/g, " ").slice(0, 118)

/* ------------------------------------------------------------------- rules */

const violations = []
function report(rule, file, line, text) {
  violations.push({ rule, file, line, snippet: snippet(text) })
}

const files = SCAN_DIRS.flatMap((dir) => walk(join(ROOT, dir)))

function scan(rule, re, { transform } = {}) {
  for (const abs of files) {
    const file = rel(abs)
    const { lines } = read(abs)
    for (const hit of matchLines(lines, re)) {
      const keep = transform ? transform(hit) : hit.match
      if (!keep) continue
      if (isAllowed(rule, file, hit.line, lines)) continue
      if (isLegacy(rule, hit.match)) continue
      report(rule, file, hit.line, `${keep}  —  ${hit.text}`)
    }
  }
}

// palette — The One Pen Rule.
scan("palette", paletteRe(PALETTE_FAMILIES))

// flat-paper — The Flat Paper Rule and The Two Sheets Rule. `shadow-warm-*`
// no longer has a theme token behind it, so it renders nothing; it is still
// the retired vocabulary and still counts.
scan("flat-paper", /(?<![\w-])(?:[\w-]+:)*shadow-(?:2xs|xs|sm|md|lg|xl|2xl|\[[^\]]*\])(?![\w-])/g)
scan("flat-paper", /(?<![\w-])(?:[\w-]+:)*shadow-warm(?:-(?:sm|md|lg))?(?![\w-])/g)

// no-gradient — utilities and raw CSS functions in markup.
scan(
  "no-gradient",
  /(?<![\w-])(?:[\w-]+:)*(?:bg-linear-|bg-radial|bg-conic)[\w-]*|(?:linear|radial|conic)-gradient\(/g
)

// one-glass — glass is for chrome that sits over itself; the header is the instance.
scan("one-glass", /(?<![\w-])(?:[\w-]+:)*backdrop-blur(?:-[\w]+)?(?![\w-])/g)

// serif-speaks — `font-display` on anything that is not a heading, and the
// transitional `font-serif` alias.
scan("serif-speaks", /<([A-Za-z][\w.]*)\b[^>]*\bfont-display\b/g, {
  transform(hit) {
    const tag = hit.match.match(/^<([A-Za-z][\w.]*)/)[1]
    // h1–h6, and the Radix/shadcn *Title primitives, which render headings.
    if (/^h[1-6]$/.test(tag) || /Title$/.test(tag)) return null
    if (/data-voice=["']display["']/.test(hit.text)) return null
    return `<${tag}> font-display`
  },
})
scan("serif-speaks", /(?<![\w-])(?:[\w-]+:)*font-serif(?![\w-])/g)

// tiny-font — literal font sizes below the 12px label step.
scan("tiny-font", /text-\[([0-9]+(?:\.[0-9]+)?)px\]/g, {
  transform(hit) {
    return Number(hit.match.match(/([0-9.]+)px/)[1]) < 12 ? hit.match : null
  },
})

// no-entrance — framer-motion mount reveals (hard: the dependency is gone),
// the retired custom keyframes (by their animate-[…] spelling), and the
// tw-animate-css entrance names.
scan("no-entrance", /initial=\{\{\s*opacity:\s*0/g)
scan(
  "no-entrance",
  /(?<![\w-])(?:[\w-]+:)*(?:animate-in|fade-in(?:-\d+)?|slide-in-from-[\w-]+|animate-\[(?:fadeIn|slideUp|scale|shimmer|floating)[^\]]*\])(?![\w-])/g
)

// ratchet — compare the legacy counts with their baselines.
const ratchet = Object.entries(LEGACY)
  .filter(([, entry]) => entry.re)
  .map(([name, entry]) => ({ name, rule: entry.rule, baseline: entry.baseline, count: legacyCounts[name], fix: entry.fix }))

for (const row of ratchet) {
  if (row.count > row.baseline) {
    report(
      "ratchet",
      "scripts/check-design-system.mjs",
      0,
      `${row.name}: ${row.count} > baseline ${row.baseline} — something came back. Fix: ${row.fix}`
    )
  } else if (row.count < row.baseline) {
    report(
      "ratchet",
      "scripts/check-design-system.mjs",
      0,
      `${row.name}: ${row.count} < baseline ${row.baseline} — lower LEGACY["${row.name}"].baseline to ${row.count}`
    )
  }
}

/* ------------------------------------------------------------------ output */

const order = Object.keys(RULES)
violations.sort(
  (a, b) =>
    order.indexOf(a.rule) - order.indexOf(b.rule) || a.file.localeCompare(b.file) || a.line - b.line
)

if (process.argv.includes("--json")) {
  const byRule = Object.fromEntries(
    order.map((r) => [r, violations.filter((v) => v.rule === r).length])
  )
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: violations.length === 0,
        filesScanned: files.length,
        total: violations.length,
        rules: order,
        byRule,
        violations,
        ratchet,
        notes: Object.fromEntries(
          Object.entries(LEGACY)
            .filter(([, entry]) => entry.note)
            .map(([name, entry]) => [name, entry.note])
        ),
        allowlist: ALLOWLIST.map((entry) => ({
          rule: entry.rule,
          file: entry.file,
          block: entry.block,
          lines: entry.lines,
          limit: entry.limit,
          why: entry.why,
          applied: used.get(entry) ?? 0,
        })),
      },
      null,
      2
    )}\n`
  )
  process.exit(violations.length === 0 ? 0 : 1)
}

function printRatchet() {
  console.log("")
  console.log("Legacy ratchet (count / baseline — may only fall):")
  for (const row of ratchet) {
    const mark = row.count === row.baseline ? " " : row.count < row.baseline ? "↓" : "↑"
    console.log(
      `   ${mark} ${String(row.count).padStart(5)} / ${String(row.baseline).padEnd(5)} ${row.name.padEnd(18)} (${row.rule})`
    )
  }
  for (const [name, entry] of Object.entries(LEGACY)) {
    if (entry.note) console.log(`     note  ${name}: ${entry.note}`)
  }
}

if (violations.length === 0) {
  console.log(`design-system: OK — ${files.length} .tsx files, 0 violations`)
  printRatchet()
  process.exit(0)
}

console.log("")
console.log(`design-system: ${violations.length} violation(s) across ${files.length} .tsx files`)
for (const rule of order) {
  const hits = violations.filter((v) => v.rule === rule)
  if (hits.length === 0) continue
  console.log("")
  console.log(`── ${RULES[rule].title}  (${hits.length})`)
  for (const hit of hits) console.log(`   ${hit.file}${hit.line ? `:${hit.line}` : ""}  ${hit.snippet}`)
  console.log(`   → ${RULES[rule].doc}`)
}
console.log("")
console.log("Summary:")
for (const rule of order) {
  const count = violations.filter((v) => v.rule === rule).length
  console.log(`   ${String(count).padStart(3)}  ${rule}`)
}
console.log(`   ${String(violations.length).padStart(3)}  total`)
printRatchet()
console.log("")
console.log(
  `Genuine data and sanctioned singletons belong in ALLOWLIST at the top of ${rel(
    fileURLToPath(import.meta.url)
  )} — one entry, one reason.`
)
process.exit(1)
