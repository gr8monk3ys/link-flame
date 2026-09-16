import type { ThemeProviderProps } from "next-themes/dist/types"

/**
 * The props the root layout mounts next-themes' ThemeProvider with.
 *
 * Lives in a plain module, not next to the "use client" provider: a value
 * imported from a client module into a server component arrives as a client
 * reference, and spreading that passed no props at all (next-themes silently
 * fell back to `data-theme` with no default).
 *
 * The strict CSP allows next-themes' inline pre-paint script by SHA-256 hash,
 * and that script's text depends on these values: tests/unit/csp.test.tsx
 * renders the provider with exactly these props to check the hash in
 * lib/csp.ts.
 */
export const SITE_THEME_PROPS = {
  attribute: "class",
  defaultTheme: "light",
  enableSystem: true,
  disableTransitionOnChange: true,
} satisfies ThemeProviderProps
