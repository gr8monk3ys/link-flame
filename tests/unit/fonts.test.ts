/**
 * Fonts are self-hosted and never fetched at build time. next/font/local reads
 * the files from node_modules/@fontsource*, so the check is that each
 * referenced file exists and that nothing under app/, components/, lib/ or
 * hooks/ imports next/font/google.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const FONTS_TS = readFileSync(join(ROOT, "lib/fonts.ts"), "utf8")
const LAYOUT = readFileSync(join(ROOT, "app/layout.tsx"), "utf8")

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (n === "__tests__" || n === "node_modules") return []
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : []
  })
}

describe("self-hosted fonts", () => {
  it("references woff2 files that exist on disk", () => {
    const srcs = [...FONTS_TS.matchAll(/(?:src|path):\s*"([^"]+\.woff2)"/g)].map((m) => m[1])
    expect(srcs.length).toBeGreaterThanOrEqual(5)
    for (const src of srcs) {
      expect({ src, exists: existsSync(join(ROOT, "lib", src)) }).toEqual({ src, exists: true })
    }
  })

  it("exposes the three voices as CSS variables", () => {
    for (const v of ["--font-display", "--font-body", "--font-mono"]) {
      expect(FONTS_TS).toContain(`variable: "${v}"`)
    }
  })

  it("preloads the body only, and keeps the mono label from swapping", () => {
    expect(FONTS_TS.match(/preload: false/g)).toHaveLength(2)
    expect(FONTS_TS).toContain('display: "optional"')
  })

  it("applies all three variables on <html>", () => {
    for (const v of ["fontDisplay.variable", "fontBody.variable", "fontMono.variable"]) {
      expect(LAYOUT).toContain(v)
    }
  })

  it("never imports next/font/google anywhere under app/, components/, lib/ or hooks/", () => {
    const offenders = ["app", "components", "lib", "hooks"]
      .flatMap((dir) => walk(join(ROOT, dir)))
      .filter((f) => readFileSync(f, "utf8").includes("next/font/google"))
      .map((f) => f.replace(ROOT, "").replace(/\\/g, "/"))
    expect(offenders).toEqual([])
  })

  it("no longer declares Inter or Lora", () => {
    expect(FONTS_TS).not.toMatch(/\bInter\b|\bLora\b/)
  })
})
