import { Inter as FontSans, Lora } from "next/font/google"

// JetBrains Mono used to be declared here too. Nothing imported it and
// `--font-mono` is not wired into tailwind.config.js, but next/font preloads
// every font a module declares, so every page fetched a 40 KB monospace file
// at high priority ahead of the hero image. `font-mono` classes already
// resolve to Tailwind's default stack and still do.

// `display: "swap"` is next/font's default; it is spelled out because the
// swap is what makes the fonts safe to load late: text paints in the
// size-adjusted fallback at first render and never blocks the hero.
export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

// Lora is a variable font (wght 400-700), so asking for it without a weight
// list gets one file that covers 400/500/600/700 — the same glyphs the
// four-weight declaration rendered.
export const fontSerif = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})
