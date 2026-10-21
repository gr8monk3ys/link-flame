# Link Flame design revamp: "The Stock Ledger"

**Date:** 2026-10-13 · **Status:** approved (owner: "same language, own ink") · **Ships as:** v0.2.0

## 1. Intent

Re-skin Link Flame from its "Screened Shelf" identity (forest primary, honey-amber accent, brown-tinted `shadow-warm-*` elevation, gradient washes, Inter + Lora from Google Fonts) to the design language of lscaturchio.xyz and InfiniStar — warm paper, one ink, sand hairlines, flat surfaces, a serif that speaks and a monospace that catalogues — while keeping Link Flame its own product through a different ink and its own signature objects.

The owner's words: _same language, own ink_. The three sites should read as siblings made by the same hand, not as one site with three names.

What does not change: routes, data, behaviour, product claims and copy (phase 3 owns those), the accessibility floors (every text token ≥ 4.5:1 in both themes, Lighthouse accessibility ≥ 95 on the home page in both themes), the Lighthouse score floors in CI, and the CSP (self-hosted fonts need no new `font-src`).

## 2. Creative north star

**The Stock Ledger.** Link Flame is a shopkeeper's notebook. Every product is an entry: a square photo plate like a print pasted onto the page, a name in serif, a mono catalogue line underneath — `BLUELAND · B CORP · 120 BOTTLES/YR`. Numbers are the product ("Measured, not promised"), so figures are set in mono, tabular, on hairline-ruled ledger rows, never in a filled band.

What Link Flame keeps that the siblings do not have: the **product plate** as the unit of the catalogue, the **impact ledger** of summed figures, and a **storefront** (cart, checkout, orders, subscriptions, loyalty, admin) that the notebook language extends to as rows on paper.

What Link Flame drops: the honey accent and its light-sweep button, the brown shadow vocabulary, every gradient (section washes, the announcement band, the animated underline, gradient text), lifting cards, glass cards, the framer-motion entrance wrappers, the count-up numerals, Google-hosted fonts.

## 3. Tokens

### 3.1 Colour

Paper and night neutrals are **identical to lscaturchio.xyz and InfiniStar** — same stationery. Only the ink differs.

| Token                                | Light (paper)               | Dark (night)                | Role                                                                    |
| ------------------------------------ | --------------------------- | --------------------------- | ----------------------------------------------------------------------- |
| `--background`                       | `38 25% 97%` (#f9f8f5)      | `220 15% 8%` (#111317)      | the page                                                                |
| `--card` / `--popover`               | `38 25% 98%`                | `220 15% 10%`               | a surface one shade lighter than the page                               |
| `--muted`                            | `38 18% 92%`                | `220 10% 16%`               | recessed / tinted paper; the empty plate                                |
| `--accent`                           | `32 50% 92%`                | `210 16% 16%`               | sand highlight for hover fills (honey is retired)                       |
| `--foreground`                       | `210 15% 12%`               | `0 0% 98%`                  | ink (text)                                                              |
| `--muted-foreground`                 | `215 10% 42%`               | `220 10% 70%`               | metadata, captions, wall labels                                         |
| `--border` / `--input`               | `30 18% 86%`                | `220 10% 18%`               | the sand hairline                                                       |
| `--primary` / `--ring`               | **`100 30% 30%`** (#456336) | **`100 30% 70%`** (#abc99c) | **Moss Ink** — the one pen                                              |
| `--primary-foreground`               | `0 0% 100%`                 | `220 15% 8%`                | text on a Moss fill                                                     |
| `--secondary`                        | `100 25% 36%`               | `100 20% 36%`               | Moss Soft, the rare secondary fill; white / night-ink text              |
| `--destructive`                      | `0 72% 38%`                 | `0 70% 70%`                 | error text and destructive buttons                                      |
| `--success` / `--warning` / `--info` | as the siblings             | as the siblings             | status only, each with a `-muted` 10–15% tint                           |
| `--scrim` / `--scrim-alpha`          | `0 0% 4%` / 0.25            | same / 0.55                 | the modal scrim (ink in both themes; see the Scrim Rule)                |

Measured (`tests/unit/design-tokens.test.ts`): Moss on paper **6.40:1**, white on Moss **6.79:1**; dark Moss on night **10.24:1**, night text on dark Moss **10.24:1**; Moss Soft with its foreground 5.37:1 / 5.41:1; Ink Muted on tinted paper 4.72:1. Every pair in the table clears 4.5:1 in both themes, so Moss may be used for small text.

Removed tokens: `--shadow-warm`, `--shadow-warm-sm/-md/-lg`; the honey `--accent 38 80% 55%`; the forest `--primary 152 45% 30%`.

**Why Moss.** A storefront about products minus the plastic wants a green, and the forest green it had was the generic eco green. Moss (hue 100) is dirt-and-leaf rather than mint; at 30% lightness it is dark enough to be the only colour on the page and still read as the brand, and it clears contrast at any size in both themes without a second "small text" token. The leaf-flame mark is the same ink on a square plate.

### 3.2 Typography

Three voices with fixed jobs, the same three as the siblings:

- **Fraunces** (display; variable, optical size auto) — speaks. Headings, the wordmark, product names, the impact ledger's figures. Never body, controls, prices or labels.
- **Instrument Sans** (body; variable) — reads. Everything the shopper reads or types, including buttons.
- **IBM Plex Mono** 400/500/600 (label and figure) — catalogues. The wall label: `0.72rem`, weight 500, `0.16em` tracking, uppercase, tabular numerals, `--muted-foreground`. Kickers, certifications, values, dates, counts, order numbers, the catalogue line. Prices and totals are mono at 0.875rem with `tabular-nums`.

Scale (fluid, `clamp()`, weights step down 720 → 700 → 650 → 620 → 560): Display `clamp(2.4rem, 5.2vw, 4.9rem)` — the home masthead only; Headline `clamp(1.9rem, 3.6vw, 3.2rem)` (the default `h1`) — one per page; Title `clamp(1.55rem, 2.4vw, 2.25rem)` (the default `h2`) — sections and ledger figures; Card Title `1.25rem` — a product name under a plate; Subsection `1.075rem`. Body `1rem` / 1.65.

**Fonts are self-hosted.** `lib/fonts.ts` loads `@fontsource-variable/fraunces`, `@fontsource-variable/instrument-sans` and `@fontsource/ibm-plex-mono` (400/500/600) with `next/font/local`: body `display: swap` and preloaded; display `preload: false`; mono `display: optional, preload: false` (the personal site measured 0.135 CLS from a swapping mono label). CSS variables `--font-display`, `--font-body`, `--font-mono` on `<html>`; `--font-sans` is the body voice and `--font-serif` a transitional alias of the display voice. Inter and Lora are gone and `next/font/google` fails a unit test.

### 3.3 Shape, space, motion

- Radius: controls 18px (`rounded-xl`), small controls 14px, fields 8px (`rounded-sm`), Card and dialogs 18px, chips and header pills full. The scale is clamped at 18px. **Product plates are square** (0px, `plate`): squareness marks the work, roundness marks the interface.
- Borders: always 1px `--border`, often at 40–90% opacity. No 2px outlines except the focus ring.
- Elevation: **flat paper**. Exactly two shadows exist: the sticky header sheet (`0 8px 30px rgba(0,0,0,0.08)`) and the primary CTA's 1px ledge. Modals separate with the scrim.
- Grain: a fixed 3.5% SVG noise on `body::after`.
- Spacing: sections 64/80/96px; rows 16/24px; cards 24/32px; the 4px Tailwind scale otherwise.
- Motion: **content does not animate itself in.** Delete the `fadeIn`/`slideUp`/`scale`/`shimmer`/`floating` keyframes and the framer-motion wrappers; the impact numerals do not count up. Hover/focus 150–200ms; the ink underline 240ms. Under `prefers-reduced-motion` every duration collapses to `0.01ms` except the loaders, which slow to 3s.
- Focus: one treatment everywhere — `:focus-visible { outline: 2px solid primary; outline-offset: 2px }` in the base layer. Tailwind `ring-*` focus stacks are removed from the primitives.

## 4. Signature objects

- **Product plate**: square 1:1 image plate (`plate`, `object-cover`, no hover scale, no scrim), name in Fraunces `text-card-title`, one mono catalogue line `brand · certification · impact`, price in mono tabular. Sale: mono `SALE` + struck price. Imperfect: mono `IMPERFECT · −20%`.
- **Ledger rows**: text-led lists (orders, subscriptions, saved items, settings, admin tables, blog index, FAQ) are hairline-divided rows — mono label above, semibold title, muted description, mono figure at the right. Lists cap at 42rem; plate grids 2 → 4 columns at 72rem.
- **Impact ledger** (replaces the full-bleed forest `ImpactBand`): on paper, hairline above and below, a `dl` of mono-tabular numerals at Title size in Fraunces with mono unit labels; static; renders nothing when there is no data.
- **Wall labels** (`label-mono`): kickers, certifications, values, dates, counts, order numbers, SKU-like codes.
- **Cart / checkout**: rows on paper, no cards-in-cards; the order summary is a ledger with a hairline before the total; one primary button per view. Stripe Elements styled via the appearance API to paper, card, hairline and Moss.
- **Header**: sticky 72px, 90% paper + 12px blur, 40% hairline, the horizontal `Logo` lockup, nav links `ink-underline`, search / account / cart in round hairline pills. **Announcement strip**: hairline-bottomed paper with mono text and a Moss link. **Footer**: 60% hairline above, `1.1fr / 2fr`, mono column heads. **Mobile nav**: a paper sheet behind the scrim, no slide-in.
- **Empty states**: wall label + one serif line + one primary action.
- **Mark**: the leaf-flame on a square Moss plate (`components/brand/Logo.tsx`, `public/brand/`), wordmark "Link Flame" in Fraunces 700 with "Flame" in Moss.

## 5. Engineering

- **Enforcement**: `scripts/check-design-system.mjs` (`npm run design:check`, in CI after lint) scans `app/`, `components/`, `lib/`, `hooks/` `*.tsx` for the hard rules palette / flat-paper / no-gradient / one-glass / serif-speaks / tiny-font / no-entrance, with a `LEGACY` ratchet (`status-hue`, `palette`, `shadow`, `shadow-warm`, `backdrop-blur`, `gradient-utility`, `entrance`, `font-serif`, and a `v3-palette` note for `styles/tailwind-v3-palette.css`) whose counts may only fall. ALLOWLIST: the header sheet (one shadow, one blur) and the dev-only breakpoint indicator.
- **Tests**: `tests/unit/design-tokens.test.ts` (every token pair ≥ 4.5:1 in both themes, the stationery and the ink by value, retired tokens and keyframes absent, the v4 compatibility pieces present), `tests/unit/fonts.test.ts` (files exist, three variables, no `next/font/google`), `tests/unit/tailwind-v4-renames.test.ts` (kept), `tests/e2e/contrast.spec.ts` (rendered contrast on every public route in both themes).
- **Docs**: `DESIGN.md` (frontmatter + prose + the enforcement and ratchet tables), `.impeccable/design.json` sidecar, this spec, the Styling bullet in `CLAUDE.md`, the stack line in `README.md`.

## 6. Delivery

Four PRs on the trunk, each green and each a conventional commit so release-please folds them into **v0.2.0**:

1. `build(tailwind): migrate to Tailwind v4` (#119) — pixel-equivalent; `styles/tailwind-v3-palette.css` keeps v3's raw palette values until the page PRs retire the last raw class.
2. `feat(brand): Link Flame mark, lockups, favicons and app icons` (#116) — the leaf-flame, `public/brand/`, `site.webmanifest`.
3. `feat(design): Stock Ledger notebook tokens, fonts, primitives and enforcement` — **this PR (b)**: §3, §4 shells, §5. The app is on the new stationery but the pages still carry the previous composition; the ratchet baseline is measured here.
4. `feat(design): storefront and marketing pages on the ledger` — **PR (c)**: home, products, product page, brands, bundles, impact, blog, guides, FAQ, about, contact; the impact ledger; plates; drives `status-hue`, `gradient-utility`, `entrance`, `font-serif` down.
5. `feat(design): account, admin, cart and checkout on the ledger` — **PR (d)**: rows for every list, the order-summary ledger, Stripe appearance, admin tables; drives every ratchet entry to zero and deletes `styles/tailwind-v3-palette.css` and the `--font-serif` alias.

Each PR runs the full CI (lint, design:check, typecheck, unit, e2e incl. contrast, build, Lighthouse) before merge.

## 7. Out of scope

Copy that changes product claims, the support address and the domain (phase 3). The `next-themes` bump (#110: the pre-paint script's hash is bundler-dependent from 0.3). Prisma 7 (#112).
