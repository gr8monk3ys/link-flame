/**
 * Tailwind v4 renamed several utilities. The upgrade codemod handled the
 * tree once (2026-10-13); this keeps the old names from drifting back in via
 * copy-paste from v3-era snippets. Each pattern is a v3 spelling that v4
 * either ignores (silently producing no CSS) or interprets differently.
 *
 * `ring-offset-*` is deliberately absent: v4 still honours it alongside
 * `ring-*` and the codemod leaves it in place.
 *
 * `rounded-sm` is deliberately absent too: this theme overrides `--radius-sm`
 * (tailwind.config.js did the same under v3), so `rounded-sm` keeps meaning
 * `calc(var(--radius) - 4px)` and the codemod did not rename it.
 *
 * `shadow-sm` is absent because it is ambiguous: v3's `shadow-sm` became
 * `shadow-xs`, but v3's bare `shadow` (used on twenty admin cards) became
 * v4's `shadow-sm`, so the spelling is legitimately in the tree.
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const SOURCE_DIRS = ["app", "components", "lib", "hooks"]

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return name === "__tests__" ? [] : sourceFiles(full)
    return /\.(tsx|ts)$/.test(name) ? [full] : []
  })
}

const V3_ONLY: Array<{ pattern: RegExp; v4: string }> = [
  { pattern: /(?<![\w-])outline-none(?![\w-])/, v4: "outline-hidden" },
  { pattern: /(?<![\w-])bg-gradient-to-(r|l|t|b|tr|tl|br|bl)(?![\w-])/, v4: "bg-linear-to-*" },
  { pattern: /(?<![\w-])(flex-shrink|flex-grow)(-0)?(?![\w-])/, v4: "shrink / grow" },
  { pattern: /(?<![\w-])overflow-ellipsis(?![\w-])/, v4: "text-ellipsis" },
  { pattern: /(?<![\w-])decoration-slice(?![\w-])/, v4: "box-decoration-slice" },
  { pattern: /(?<![\w-])break-words(?![\w-])/, v4: "wrap-break-word" },
  { pattern: /\[text-wrap:(balance|pretty)\]/, v4: "text-balance / text-pretty" },
  { pattern: /(?<![\w-])backdrop-blur-sm(?![\w-])/, v4: "backdrop-blur-xs" },
  // `data-[state=open]:` (with a value) is still the v4 spelling; only the
  // bare boolean form lost its brackets.
  {
    pattern: /(?<![\w-])data-\[(disabled|checked|selected|active|highlighted)\]:/,
    v4: "data-<name>: (no brackets)",
  },
  // The codemod turns `variant="outline"` into `variant="outline-solid"` because
  // it cannot tell a cva variant name from the `outline` utility. The variant
  // name stays `outline`; only the utility (`outline-style: solid`) is spelled
  // `outline-solid` in v4.
  { pattern: /variant(\?)?[=:]\s*(["'])outline-solid\2/, v4: 'variant="outline"' },
  { pattern: /(["'|]\s*)outline-solid(\s*["'|])/, v4: '"outline" (a cva variant, not the utility)' },
]

describe("Tailwind v4 class names", () => {
  // Read the ~700 files once; a per-pattern re-read ran past vitest's 5 s
  // test timeout on a loaded machine.
  const files = SOURCE_DIRS.flatMap((dir) => sourceFiles(join(ROOT, dir))).map((path) => ({
    path: path.replace(ROOT, "").replace(/\\/g, "/").replace(/^\//, ""),
    source: readFileSync(path, "utf8"),
  }))

  it("scans a realistic number of files", () => {
    expect(files.length).toBeGreaterThan(200)
  })

  for (const { pattern, v4 } of V3_ONLY) {
    it(`uses ${v4} rather than ${pattern.source}`, () => {
      const offenders = files.filter((f) => pattern.test(f.source)).map((f) => f.path)
      expect(offenders).toEqual([])
    })
  }

  it("has no tailwind.config.js (the theme lives in styles/globals.css under @theme inline)", () => {
    expect(() => statSync(join(ROOT, "tailwind.config.js"))).toThrow()
  })

  it("imports Tailwind v4 in styles/globals.css", () => {
    const css = readFileSync(join(ROOT, "styles/globals.css"), "utf8")
    expect(css).toMatch(/^@import "tailwindcss";/m)
    expect(css).toMatch(/@theme inline \{/)
    expect(css).not.toMatch(/@tailwind (base|components|utilities)/)
  })

  it("keeps tailwind-merge on a major that understands v4 utilities", () => {
    const pkg = JSON.parse(
      readFileSync(join(ROOT, "node_modules/tailwind-merge/package.json"), "utf8")
    ) as { version: string }
    expect(pkg.version.split(".")[0]).toBe("3")
  })
})
