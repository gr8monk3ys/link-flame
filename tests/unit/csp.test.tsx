import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { AnnouncementBar } from "@/components/announcement-bar"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { SITE_THEME_PROPS } from "@/config/theme"
import {
  INLINE_SCRIPT_HASHES,
  NONCE_ROUTE_PREFIXES,
  buildCspHeader,
  routeUsesNonce,
} from "@/lib/csp"

function inlineScripts(html: string): string[] {
  return Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((m) => m[1])
}

function sha256(source: string): string {
  return `sha256-${createHash("sha256").update(source, "utf8").digest("base64")}`
}

// next-themes renders `(${fn.toString()})(args)`, so the hash rendered here
// (from the package source) is not the one production serves (from the
// minified server bundle); see INLINE_SCRIPT_HASHES in lib/csp.ts.
const THEME_SCRIPT_SOURCE_HASH = "sha256-vQsXc0D1JvYJ7cfeKzl1GKst8EtTw7+Cu1OatpeSAUM="

describe("inline script hashes", () => {
  // The root layout renders these two scripts on every page. They run under
  // the nonce policy by hash, so a change to either (or a next-themes upgrade
  // that rewrites its script) must be mirrored in INLINE_SCRIPT_HASHES.
  it("trips when the next-themes pre-paint script for the layout's props changes", () => {
    const html = renderToStaticMarkup(
      <ThemeProvider {...SITE_THEME_PROPS}>
        <div />
      </ThemeProvider>
    )
    const scripts = inlineScripts(html)
    expect(scripts).toHaveLength(1)
    expect(
      sha256(scripts[0]),
      "next-themes' script changed: run `npm run build && npm run check:csp-hashes`, " +
        "put the served hash in INLINE_SCRIPT_HASHES.theme, then update THEME_SCRIPT_SOURCE_HASH"
    ).toBe(THEME_SCRIPT_SOURCE_HASH)
  })

  it("matches the announcement bar's dismissal script", () => {
    const scripts = inlineScripts(renderToStaticMarkup(<AnnouncementBar />))
    expect(scripts).toHaveLength(1)
    expect(sha256(scripts[0]), "update INLINE_SCRIPT_HASHES.announcement").toBe(
      INLINE_SCRIPT_HASHES.announcement
    )
  })
})

describe("routeUsesNonce", () => {
  it("keeps the nonce on session, cart and payment routes", () => {
    for (const prefix of NONCE_ROUTE_PREFIXES) {
      expect(routeUsesNonce(prefix)).toBe(true)
      expect(routeUsesNonce(`${prefix}/anything`)).toBe(true)
    }
  })

  it("does not nonce marketing and catalogue routes, so they can be static", () => {
    for (const path of ["/", "/about-us", "/products/abc", "/blogs", "/privacy", "/cartoons"]) {
      expect(routeUsesNonce(path)).toBe(false)
    }
  })
})

describe("buildCspHeader", () => {
  it("emits nonce + strict-dynamic + hashes when given a nonce", () => {
    const csp = buildCspHeader("abc123")
    const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src "))!
    expect(scriptSrc).toContain("'nonce-abc123'")
    expect(scriptSrc).toContain("'strict-dynamic'")
    expect(scriptSrc).toContain(`'${INLINE_SCRIPT_HASHES.theme}'`)
    expect(scriptSrc).toContain(`'${INLINE_SCRIPT_HASHES.announcement}'`)
    expect(scriptSrc).not.toContain("'unsafe-inline'")
  })

  it("emits the static policy without a nonce", () => {
    const csp = buildCspHeader()
    const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src "))!
    expect(scriptSrc).toContain("'unsafe-inline'")
    expect(scriptSrc).toContain("https://js.stripe.com")
    expect(scriptSrc).not.toContain("nonce-")
    expect(scriptSrc).not.toContain("strict-dynamic")
    expect(csp).toContain("frame-ancestors 'none'")
  })
})

describe("nonce routes render per request", () => {
  // A nonce can only be stamped on scripts at render time. A nonce route that
  // prerenders at build ships HTML without nonces, and the strict policy then
  // blocks every script on it. /cart, /checkout, /auth/* and /account/* are
  // client-rendered and would prerender without this.
  it("every nonce route prefix has a layout that forces dynamic rendering", () => {
    for (const prefix of NONCE_ROUTE_PREFIXES) {
      const layout = readFileSync(join(process.cwd(), "app", prefix, "layout.tsx"), "utf8")
      expect(layout, `app${prefix}/layout.tsx`).toContain("export const dynamic = 'force-dynamic'")
    }
  })
})
