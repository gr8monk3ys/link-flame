---
name: Link Flame
description: A shopkeeper's stock ledger — warm paper, Moss ink, a square photo plate for every product and the figures set in mono on hairline rows.
colors:
  moss-ink: "#456336"
  moss-ink-dark: "#abc99c"
  moss-soft: "#547345"
  paper: "#f9f8f5"
  paper-card: "#fbfaf9"
  paper-tinted: "#eeece7"
  paper-warm: "#f5ebe0"
  ink: "#1a1f23"
  ink-muted: "#606976"
  hairline: "#e2dbd5"
  night: "#111317"
  night-card: "#16181d"
  night-tinted: "#25272d"
  night-ink: "#fafafa"
  night-ink-muted: "#abb0ba"
  night-hairline: "#292c32"
  signal-error: "#a71b1b"
  signal-success: "#107535"
  signal-warning: "#935f06"
  signal-info: "#0950c3"
typography:
  display:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "clamp(2.4rem, 5.2vw, 4.9rem)"
    fontWeight: 720
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "clamp(1.9rem, 3.6vw, 3.2rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "clamp(1.55rem, 2.4vw, 2.25rem)"
    fontWeight: 650
    lineHeight: 1.18
    letterSpacing: "-0.026em"
  card-title:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 620
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.72rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.16em"
  figure:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  none: "0px"
  sm: "8px"
  md: "10px"
  lg: "14px"
  card: "18px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
  20: "80px"
  24: "96px"
components:
  button-primary:
    backgroundColor: "{colors.moss-ink}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
  badge-outline:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-filled:
    backgroundColor: "{colors.moss-ink}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  card:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
  input-field:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "40px"
  wall-label:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    padding: "0"
  ledger-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "16px 0"
  plate:
    backgroundColor: "{colors.paper-tinted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0"
  brand-mark:
    backgroundColor: "{colors.moss-ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0"
rules:
  - The One Pen Rule
  - The Sand Hairline Rule
  - The Tinted Paper Rule
  - The Wall Label Rule
  - The Serif Speaks Rule
  - The Measured Figure Rule
  - The Flat Paper Rule
  - The Two Sheets Rule
  - The Scrim Rule
  - The Square Plate Rule
---

# Design System: Link Flame

## Overview

**Creative North Star: "The Stock Ledger"**

Link Flame is a shopkeeper's notebook. Every product is an entry: a square photo plate like a print pasted onto the page, a name in serif, and one catalogue line in mono underneath — `BLUELAND · B CORP · 120 BOTTLES/YR` — brand, certification, impact figure. The numbers are the product. The site's claim is "Measured, not promised", so figures are set in mono, tabular, on hairline-ruled ledger rows, and never in a filled band.

The notebook is the same stationery as lscaturchio.xyz and InfiniStar, by design: warm off-white paper with a near-invisible grain, structure drawn with hairlines and space rather than boxes, a serif with personality for what the shop says, a plain sans for what the shopper reads, and a monospace label beside every piece of metadata. What tells the three notebooks apart is the pen. The personal site writes in forest green, InfiniStar in mulberry; Link Flame writes in **Moss** — a green that is dirt and leaf rather than mint and marketing, dark enough to be the only colour on the page and still read as the brand.

What Link Flame keeps that the siblings do not have: the **product plate** as the recurring unit of the catalogue, the **impact ledger** of summed figures, and a **storefront** — cart, checkout, orders, subscriptions, loyalty — which the notebook language extends to as rows on paper.

The system deliberately is not three things. It is not the screened-shelf storefront it replaced: no honey-amber accent, no brown-tinted shadows, no gradient washes behind sections, no sweep-of-light button, no card that lifts on hover. It is not SaaS furniture: no three-column feature tiles, no pill badges as decoration, no count-up numerals. And it is not a theme engine: one kind of paper, read by day or by night.

**Key Characteristics:**

- One paper ground, warm off-white with a fixed 3.5% noise grain; dark mode is a night variant of the same page.
- One ink, Moss, spent sparingly: links, hover, selection, the focus outline, the mark, the single primary button per view.
- Hairline rules and tint shifts structure the page; there are no floating cards and no decorative shadows.
- Three type voices with fixed jobs: Fraunces speaks, Instrument Sans reads, IBM Plex Mono catalogues.
- Squareness marks the work (product plates); roundness marks the interface (controls, chips, pills).
- Figures are mono and tabular on hairline rows — the ledger, not the banner.
- Motion is the interface responding to the shopper, never the page introducing itself.

## Colors

A warm, low-chroma paper palette with one Moss ink and a sand-toned hairline; dark mode inverts to a cool night page with the same ink lifted for contrast. Every pair below is measured by `tests/unit/design-tokens.test.ts` from the HSL triplets in `styles/globals.css`, and `tests/e2e/contrast.spec.ts` measures the rendered pages in both themes; the document does not get to be wrong about contrast.

### Primary

- **Moss Ink** (`100 30% 30%` #456336 light / `100 30% 70%` #abc99c dark; `--primary`, `--ring`): the one pen. Links, the hover colour of any interactive text, the 22% tint behind selected text, the fill of the single primary button, the focus outline, the mark, and the border that warms on a hovered surface. Measured **6.40:1 on paper** and **10.24:1 on night**; white on the light ink 6.79:1, night text on the dark ink 10.24:1. Because it clears 4.5:1 at any size there is no separate small-text token.
- **Moss Soft** (`100 25% 36%` #547345 light / `100 20% 36%` dark; `--secondary`): a lighter moss for the rare secondary fill, white text on it (5.37:1 light, 5.41:1 dark). It exists so a second ink never has to be invented.

Honey amber is retired. `--accent` is now Paper Warm, a hover fill, not a colour.

### Neutral

- **Paper** (`38 25% 97%` #f9f8f5; `--background`): the page. Warm off-white, hue 38, with the noise grain laid over it.
- **Paper Card** (`38 25% 98%`; `--card`, `--popover`): a surface one shade lighter than the page, used for buttons, inputs, list rows, cards and menus so they sit on the paper rather than above it.
- **Paper Tinted** (`38 18% 92%`; `--muted`): the recessed tone. Disabled controls, the tab rail, the empty plate behind a product with no photograph.
- **Paper Warm** (`32 50% 92%`; `--accent`): a sand highlight for hover fills and the rare emphasised block.
- **Ink** (`210 15% 12%`; `--foreground`): body text. A cool near-black with a blue cast that keeps the warm paper from going yellow.
- **Ink Muted** (`215 10% 42%`; `--muted-foreground`): captions, wall labels, descriptions, placeholders. Everything that is metadata rather than the work. 5.27:1 on paper, 4.72:1 on tinted paper.
- **Hairline** (`30 18% 86%`; `--border`, `--input`): the rule. A sand tone, never grey, drawn at 1px and often at 40–90% opacity.
- **Night** (`220 15% 8%`), **Night Card** (`220 15% 10%`), **Night Tinted** (`220 10% 16%`), **Night Ink** (`0 0% 98%`), **Night Ink Muted** (`220 10% 70%`), **Night Hairline** (`220 10% 18%`): the dark-mode counterparts, hue 220, cool rather than warm.

### Signal

- **Error** (`0 72% 38%` light / `0 70% 70%` dark; `--destructive`), **Success** (`142 76% 26%` / `142 71% 45%`), **Warning** (`38 92% 30%` / `38 92% 50%`), **Info** (`217 91% 40%` / `217 91% 65%`): status colours for form errors, toasts, order states and stock warnings only, each with a `-muted` 10–15% tinted background. They never appear as decoration, and they are reached through the tokens (`text-destructive`, `bg-success-muted`), never as `green-700`.
- A sale is a mono `SALE` label and a struck price, not a red pill. Imperfect stock is a mono `IMPERFECT · −20%` label. Certifications are wall labels, not coloured badges.

### Named Rules

**The One Pen Rule.** Moss is the only chromatic accent on any surface, and it marks action or emphasis, never area. If a screen has moss in more than a few places, it has too many. No gradient anywhere, on anything.

**The Sand Hairline Rule.** Dividers are 1px of Hairline, sand-toned, never neutral grey and never thicker. Depth of structure is expressed by more rules and more space, not by darker lines.

**The Tinted Paper Rule.** A "contained" surface is the same paper at a different tint (Paper Card lighter, Paper Tinted darker), bordered by a hairline. It is never a white box on a grey page.

## Typography

**Display Font:** Fraunces, variable, optical size auto — self-hosted from `@fontsource-variable/fraunces`, `preload: false`.
**Body Font:** Instrument Sans, variable — self-hosted from `@fontsource-variable/instrument-sans`, preloaded.
**Label/Mono Font:** IBM Plex Mono 400/500/600 — self-hosted from `@fontsource/ibm-plex-mono`, `display: optional` (a swapping mono label flips a catalogue line between one line and two; the sibling site measured 0.135 CLS from it).

No font is fetched at build time; `lib/fonts.ts` loads them with `next/font/local` and `tests/unit/fonts.test.ts` fails on any `next/font/google` import. The three variables sit on `<html>`.

**Character:** A high-contrast, slightly wonky serif doing the talking, a plain humanist sans doing the reading, and a monospace doing the filing. Fraunces at heavy weights and tight tracking gives headings and product names a printed, editorial presence; Instrument Sans at 1.65 stays out of the way; Plex Mono, small, uppercase and widely tracked, is the catalogue line under every plate and the figure on every ledger row.

### Hierarchy

- **Display** (Fraunces 720, clamp 2.4–4.9rem, 1.02, −0.035em, oldstyle numerals; `text-display`): the home masthead and nothing else.
- **Headline** (Fraunces 700, clamp 1.9–3.2rem, 1.12, −0.03em; `text-page-title`, the default `h1`): one per page.
- **Title** (Fraunces 650, clamp 1.55–2.25rem, 1.18, −0.026em; `text-section-title`, the default `h2`): section headings and the impact ledger's figures.
- **Card Title** (Fraunces 620, 1.25rem, 1.2, −0.02em; `text-card-title`): a product's name under its plate, a row title, a dialog title. A subsection step exists at 1.075rem / 560 (`text-subsection`).
- **Body** (Instrument Sans 400, 1rem, 1.65): reading text. Lead paragraphs use 1.125rem with `text-pretty`.
- **Description** (Instrument Sans 400, 0.875–1rem, Ink Muted): secondary copy under a title.
- **Label** (IBM Plex Mono 500, 0.72rem, 0.16em tracking, uppercase, tabular numerals, Ink Muted; `label-mono`): the wall label. Kickers, certifications, values, dates, counts, order numbers, SKU-like codes, the catalogue line. With `normal-case tracking-normal` it becomes the small mono link. `label-link` adds the 24px (44px on touch) tap-target floor.
- **Figure** (IBM Plex Mono 500, 0.875rem, `tabular-nums`): a price, a quantity, a total, an impact number in a row. Mono so columns of figures align; never Fraunces except at Title size in the impact ledger.

### Named Rules

**The Wall Label Rule.** Every piece of metadata (a date, a count, a brand, a certification) is set as a Label: mono, small, uppercase, tracked, muted. Metadata never borrows the body or heading voice. Every section, row and figure introduces itself with one before its title — the kicker _is_ the house device.

**The Serif Speaks Rule.** Fraunces appears only where the shop is speaking: `h1`–`h6`, the type-scale utilities, the wordmark, product names, the impact ledger's figures. Never in body copy, UI controls, prices or labels. `font-display` on a non-heading fails the build unless the element carries `data-voice="display"`; `font-serif` is a transitional alias the ratchet is counting down.

**The Measured Figure Rule.** Any number that counts — a price, a total, an impact figure, a stock level — is set in mono with `tabular-nums`, on paper, on a hairline row. Figures are never set in a filled band, never count up on entry, and never borrow a status colour to look impressive.

## Layout

The page is a single centred column on open paper, with three widths: narrow (42rem) for reading and for row lists, medium (56rem) for mixed content, wide (72rem) for the masthead, plate galleries and index headers. The `container` utility caps at 80rem (1400px on the 2xl screen) with 32px side padding. Horizontal padding inside pages is 16px, rising to 24px and 32px at the sm and lg breakpoints.

Vertical rhythm is generous. Sections breathe at 64px, then 80px at sm and 96px at lg; small sections at 32/48/64px. Rows pad at 16px (24px at sm), cards at 24px (32px at sm). Between sections sits a full-width hairline (`gallery-rule`), never a background change.

Two-column compositions are asymmetric editorial splits, never equal halves: the product page is `1fr / 1fr` only on the plate row and `1fr / 360px` for copy and the buy box; the footer is `1.1fr / 2fr`. Text-led lists (orders, subscriptions, saved items, account settings, admin tables, the blog index, the FAQ) are stacked rows separated by hairlines with the label above the title and the description below, not tiled cards; lists cap at 42rem. Plates are the exception: product galleries run 2 → 4 columns at 72rem with 16px gaps, because a product photograph is the work and the grid is how a ledger keeps its stock.

The header is sticky, 72px, 90% paper with a 12px blur and a 40% hairline beneath, with the announcement strip above it. Below md the asymmetric grids collapse to one column and the navigation becomes a paper sheet behind a scrim. Breakpoints are Tailwind's defaults.

## Elevation & Depth

Flat paper, tint shifts only. Every surface sits on one plane. Hierarchy is drawn with hairlines and with the three paper tints, and a hover is a colour change (border warming to Moss at 45%, background tinting to Moss at 5%), not a lift. The noise grain over the whole page is what stops large flat areas from reading as sterile screen white.

Two exceptions exist and are structural, not decorative: the sticky header carries a wide, soft shadow (`0 8px 30px rgba(0,0,0,0.08)`) so it reads as a separate sheet when content scrolls under it, and the primary button (`cta-primary`) carries a 1px ledge (`0 1px 0` of Moss at 25%) beneath its border so the one filled button feels pressed onto the page.

### Named Rules

**The Flat Paper Rule.** No shadow on any content surface, at rest or on hover. A hovered surface changes tint and border colour; it does not rise. The brown `shadow-warm-*` vocabulary is gone from the theme.

**The Two Sheets Rule.** The only elevated objects are the sticky header and the primary button's 1px ledge. Nothing else may add a shadow without changing this file first.

**The Scrim Rule.** A modal separates with a scrim, not a shadow. `overlay-scrim` — `hsl(var(--scrim) / var(--scrim-alpha))`, ink in both themes, 25% on paper and 55% at night — is the third sanctioned separation mechanism, and the only one available to an overlay, since the Two Sheets Rule has already spent both of its shadows. The scrim is ink rather than `--foreground` because `--foreground` inverts at night and would lay a white veil over the dark page.

## Shapes

The form language is soft-cornered paper with one square exception. Buttons and controls use 14px corners (`rounded-xl`... no: `rounded-lg` is 14px; `rounded-xl` is 18px — see the table below); small buttons 10px; fields 8px; the Card component, dialogs and menus 18px — and the radius scale is clamped there, so `rounded-2xl`, `-3xl` and `-4xl` from the previous system resolve to 18px. Chips, badges, the header pills (search, account, cart, theme) and round avatars are fully round.

| Utility | Radius | Used on |
| --- | --- | --- |
| `rounded-sm` | 8px | fields (`input-field`), menu items |
| `rounded-md` | 10px | small controls |
| `rounded-lg` | 14px | small buttons, tab rails, popover lists |
| `rounded-xl` | 18px | `Button`, `Card`, dialogs, the nav panel |
| `rounded-2xl` … `-4xl` | 18px | clamped; legacy spellings |
| `rounded-full` | pill | chips, header pills, avatars of people |
| `plate` | 0px | product and photo plates |

**The Square Plate Rule.** A product's photograph is a square 1:1 plate (`plate`, or `<Avatar shape="plate">`) with 0px corners and a 1px hairline, `object-cover`, no hover scale, no gradient scrim over the image — the print, pasted onto the ledger. Squareness marks the work; roundness marks the interface. A product with no photograph gets a Paper Tinted plate with its initial in Fraunces in Moss.

Borders are always 1px Hairline, frequently at reduced opacity. The header's 90% paper with 12px blur is the one glass surface; glass is for chrome that sits over itself, never for content.

## Components

### Buttons

- **Shape:** 18px radius (`rounded-xl`), 40px tall, 16px horizontal padding; small 36px / 14px radius; large 48px / 32px padding. Text is Instrument Sans 500 at 0.875rem.
- **Primary** (`cta-primary`, the `Button` default): Moss fill, white text, a 1px border of Moss at 42%, the ledge shadow. One per view — on the home page the quiz; on a product page "Add to cart"; in checkout the pay button. Hover brightens 6%; active presses 1px down.
- **Secondary / Outline** (`cta-secondary`): Paper Card fill, hairline, Ink text; hover tints the fill to Moss at 5%, warms the border to 45% and the text to Moss. **Ghost**: transparent until hovered, then Paper Card with a hairline. **Link**: Moss text with `ink-underline`. **Destructive**: the secondary shape with Error text.
- **Focus:** the global `:focus-visible` outline — 2px Moss at a 2px offset — on everything focusable, pre-coloured so it never interpolates. No `ring-*` stacks on any primitive.
- **Disabled:** Paper Tinted fill, Ink Muted text, hairline, no ledge, 60% opacity.
- The honey `accent` variant and the `.modern-button` light sweep are gone; the quiz CTA is a `default` button.

### Chips / Badges

- **Style:** fully round, 10px horizontal / 2px vertical padding, 0.75rem semibold.
- **Outline / Secondary** (the house chip, also the `.badge` class): Paper Card fill with a hairline, Ink text, hover text to Moss.
- **Filled** (`default`): Moss fill, white text. Reserve for a single status or count (the cart's item count).
- **Certifications, values and categories are not chips.** They are wall labels separated by `·`, or wall-label links separated by gap.

### Rows / Ledger

- Most "cards" are not cards. Text-led lists are stacked rows divided by hairlines: a mono label above, a semibold title that turns Moss on hover, a one- or two-line description in Ink Muted, and, where there is one, a mono figure at the right edge with `tabular-nums`. Lists cap at 42rem.
- **Tables** (`Table`) are ledgers: column heads as wall labels, hairline-divided rows, a tinted (never filled) footer.
- **Card:** Paper Card on Paper, 1px hairline, 18px radius, 24px padding, no shadow. Interactive cards warm the border on hover. Use one when the content genuinely is an object (a bundle, a gift card), not for a list.

### Fields

- **Field** (`input-field`; `Input`, `Textarea`, `Select`, `.date-field`): Paper Card fill, hairline, 8px radius, 40px tall, 0.875rem text, placeholder Ink Muted at 80%. Focus warms the border to Moss at 50% plus the global outline. Invalid fields take an Error border.
- **Checkbox:** 16px, Moss border, Moss fill when checked. **Slider:** tinted track, Moss range, Paper Card thumb with a Moss border.
- Stripe Elements are styled through the appearance API to paper, card, hairline and Moss.

### Header and Footer

- **Header:** sticky, 72px, 90% paper, 12px blur, 40% hairline beneath, the one structural shadow. The horizontal `Logo` lockup at the left; nav links in body sans with `ink-underline` (the underline scored in from the left over 240ms, kept on the active link); dropdown panels are opaque popover paper in a hairline with no shadow. Search, account and cart sit at the right in round hairline pills (`cta-secondary rounded-full size-9`); the cart count is the header's one filled disc.
- **Announcement strip:** a hairline-bottomed strip of paper above the header; three store facts as wall labels separated by `·`, the rewards link in Moss with `ink-underline`. Never a filled or gradient band.
- **Mobile nav:** a sheet of paper at the right edge behind the scrim, hairline on its left rule, section heads as wall labels. No slide-in.
- **Footer:** hairline above at 60%, `1.1fr / 2fr` grid with the lockup and the shop's line at the left and four columns at the right, column heads as wall labels, links in sans with `ink-underline`, a hairline before the legal line set in mono.

### Product Plate (signature)

A square 1:1 plate (`plate`) with a 1px hairline. Below it, outside the image: the name in Fraunces at Card Title, then one mono catalogue line — `BRAND · CERTIFICATION · IMPACT` — with tabular numerals, then the price in mono. Sale: a mono `SALE` label and a struck price. Imperfect stock: a mono `IMPERFECT · −20%` label. Hover: the name turns Moss and the plate border warms. No scale, no scrim, no rounding, no coloured badge over the photograph.

### Impact Ledger (signature)

Replaces the full-bleed forest band. On paper, a hairline above and below, a `dl` of figures: each figure in Fraunces at Title size with tabular numerals, its unit and its metric as wall labels beneath. Figures are static — the count-up is retired, because a number that arrives is less honest than a number that is there. Renders nothing when there is no data.

### Mark and Wordmark (signature)

The mark is the leaf-flame: a square plate of Moss ink — square corners, because squareness marks the work — with one silhouette cut out of it in paper, a teardrop whose tip rises and hooks to the right so it is a leaf and a flame at once, with a thin tapered midrib slit up its centre. One path, `fill-rule="evenodd"`, so the leaf is a true hole and whatever the mark sits on shows through. It is flat ink: no border, no gradient, no shadow. In the app it is `<LogoMark>` (`components/brand/Logo.tsx`), filled with `hsl(var(--primary))`, so it is Moss on paper by day and the lifted Moss at night with no `dark:` override; `Icons.logo` renders the same element for existing call sites.

The wordmark is "Link Flame" in Fraunces 700, tight tracking, Ink, with "Flame" in Moss — one phrase in ink, the house device. Two lockups (`<Logo variant>`): **horizontal** is the mark, a 12px gap and the wordmark, with the mark exactly as tall as the wordmark's capitals; **stacked** is the mark above, a 12px gap and the wordmark centred beneath at half the mark's height. In the component the wordmark is live text in `font-display` (marked `data-voice="display"`); the static files have it converted to outlines and reference no font.

Clear space around any lockup is half the mark's height. Minimum size: 16px for the mark alone, 96px wide for a lockup. Do not rotate, recolour, outline, add a shadow or a gradient, or set the wordmark in another face. Files: `public/brand/` (`mark.svg`, `mark-dark.svg`, `mark-mono.svg`, `logo-horizontal{,-dark}.svg`, `logo-stacked{,-dark}.svg`, a `README.md`), the favicons and app icons in `public/`, `public/og.png`, and `docs/brand/lockups.png`; all regenerated by `npm run brand:generate` from `scripts/generate-brand.mjs`. The manifest's `theme_color` is Moss; the viewport `themeColor` is paper by day and night by night.

### Dialogs and Menus

Opaque `--popover` inside a 1px hairline, 18px radius (menus 14px), 24px padding, over the scrim; bottom sheets on mobile. Titles are Card Title in Fraunces. No shadow, no open or close animation.

### Empty States

A wall label, one serif line, one primary action. Honest: "No orders yet" on paper, not an illustration.

## Motion

**Content does not animate itself in.** Nothing on a page mounts hidden and waits for a scroll observer or a mount transition to become readable; the failure mode is a blank page. The `fadeIn`, `slideUp`, `scale`, `shimmer` and `floating` keyframes and the framer-motion `FadeIn`/`SlideIn`/`ScaleIn`/`PopIn` wrappers are gone; `initial={{ opacity: 0` fails the build and the tw-animate-css entrance names are being ratcheted out. The impact figures do not count up.

What moves is the interface responding to the shopper:

- **Hover and focus** transition at 150ms (fast), 200ms (default) or 300ms (slow) with `ease`.
- **The ink underline** scores in over 240ms on `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Buttons** press 1px down on `:active` over 100ms.
- **Loading** is `animate-pulse` (skeleton blocks of tinted paper) and `animate-spin` (the `.loading-spinner` ring). The accordion opens over 200ms.

Under `prefers-reduced-motion` every animation and transition collapses to `0.01ms` (not 0s, which can skip `transitionend`), with one stated exception: the loading indicators slow to 3s rather than stopping, because a frozen loader reads as broken rather than as waiting.

## Do's and Don'ts

### Do:

- **Do** introduce every section, row and figure with a wall label before its title.
- **Do** divide with 1px sand hairlines and 64–96px of vertical space; let whitespace and rules do the structuring.
- **Do** spend Moss on action and emphasis only: links, hover, selection, the mark, one primary button per view.
- **Do** build text-led lists as hairline-divided rows and keep products as square plates in a gallery grid.
- **Do** route every colour through the tokens; status is `text-success`, `text-warning`, `text-info`, `text-destructive` and their `-muted` washes.
- **Do** set every price, quantity, total and impact figure in mono with `tabular-nums`, on paper.
- **Do** design dark mode as the same notebook at night: cool hue-220 page, the ink lifted to `100 30% 70%`, hairlines at 18% lightness.
- **Do** give an empty section an honest empty state in the same voice: a wall label, one serif line, one primary action.
- **Do** keep the one primary button per view; the second action is `outline` or `link`.

### Don't:

- **Don't** add shadows to content surfaces at rest or on hover; the header sheet and the CTA ledge are the only elevated objects.
- **Don't** reintroduce gradients, glow, glass cards or the brown shadow vocabulary; the screened shelf is gone.
- **Don't** build SaaS furniture: three-column feature tiles, pill badges as decoration, count-up numerals.
- **Don't** use monospace as a voice. It is the label beside the work and the figure on the row, never headings or body copy; the site is not a terminal.
- **Don't** set Fraunces in body text, controls, prices or labels, and don't set body copy in anything but Instrument Sans.
- **Don't** use neutral grey for rules or muted surfaces; every neutral is warm paper (hue 30–38) in light mode and cool night (hue 220) in dark.
- **Don't** introduce a second accent colour; Moss Soft exists for secondary fills and the four signal colours are for status only. Honey is gone.
- **Don't** round a product plate, scale it on hover or lay a badge over it; squareness marks the work.
- **Don't** fill a section or a figure with colour; the impact ledger is on paper.
- **Don't** define `--spacing-xs..4xl` tokens in `@theme`; in Tailwind v4 they shadow the `max-w-*` container scale and collapse layouts.
- **Don't** animate content in, and don't ship a skeleton that a reader without JavaScript would keep.

## Enforcement

Seven of the rules above are machine-checked, so breaking them fails the build the way a type error does. `scripts/check-design-system.mjs` runs in CI right after `lint`; run it locally with:

```bash
npm run design:check                         # grouped, readable report + the ratchet table
node scripts/check-design-system.mjs --json  # machine output
```

It reads `app/**/*.tsx`, `components/**/*.tsx`, `lib/**/*.tsx` and `hooks/**/*.tsx` (no dependencies, well under a second) and enforces:

| Rule           | What fails                                                                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `palette`      | `bg-/text-/border-/from-/…-{red,orange,amber,yellow,lime,green,emerald,slate,gray,zinc,neutral,stone,violet,purple,indigo,blue,sky,cyan,teal,fuchsia,pink,rose}-NNN`. Status goes through `text-success`, `text-warning`, `text-info`, `text-destructive` and their `-muted` washes. |
| `flat-paper`   | `shadow-{2xs…2xl}`, an arbitrary `shadow-[…]`, or a retired `shadow-warm-*` outside the header sheet.                                                                                                                                                             |
| `no-gradient`  | `bg-linear-*`, `bg-radial`, `bg-conic`, or a `*-gradient(` in markup.                                                                                                                                                                                              |
| `one-glass`    | `backdrop-blur` outside the header.                                                                                                                                                                                                                                |
| `serif-speaks` | `font-display` in a `className` on anything but `h1`–`h6`, a `*Title` primitive, or an element marked `data-voice="display"`; and the transitional `font-serif` alias.                                                                                           |
| `tiny-font`    | `text-[Npx]` below 12px.                                                                                                                                                                                                                                           |
| `no-entrance`  | A framer-motion `initial={{ opacity: 0` mount reveal, a retired keyframe by its `animate-[…]` spelling, or a tw-animate-css entrance name (`animate-in`, `fade-in-*`, `slide-in-from-*`).                                                                       |

### The ratchet

The notebook lands in three PRs — (b) tokens, fonts, primitives, shells and this document; (c) the storefront and marketing pages; (d) account, admin, cart and checkout. Until (c) and (d) have landed, the tree still carries the previous system's names. Rather than allowlist them, the script keeps a **LEGACY** table: for each retired name, a regex and the count measured on the branch that introduced the script. A hit that matches a legacy pattern is counted instead of reported. The count may only fall: a count above its baseline fails (something came back), and a count below it also fails until the baseline is lowered in the same PR, so the table in the script always says what is true. When an entry reaches zero it is deleted, and its names fail as plain violations of the rule that replaced them.

| Entry              | Rule           | Counts                                                                 | Replacement                                                               |
| ------------------ | -------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `status-hue`       | `palette`      | red / orange / amber / yellow / lime / green / emerald utilities        | status tokens, or a mono wall label where the hue was encoding data       |
| `palette`          | `palette`      | the other fifteen Tailwind families                                    | the paper / ink / hairline tokens                                         |
| `shadow`           | `flat-paper`   | `shadow-*` utilities                                                   | a hairline and a tint shift                                               |
| `shadow-warm`      | `flat-paper`   | the retired brown shadows (already render nothing)                     | delete the class                                                          |
| `backdrop-blur`    | `one-glass`    | `backdrop-blur*` outside the header                                    | an opaque surface, or `overlay-scrim`                                     |
| `gradient-utility` | `no-gradient`  | `bg-linear-*`, `bg-radial*`, `bg-conic*`                               | a flat token fill, or none                                                |
| `entrance`         | `no-entrance`  | `animate-in`, `fade-in-*`, `slide-in-from-*`, `animate-[fadeIn…]`      | render the content                                                        |
| `font-serif`       | `serif-speaks` | the transitional alias of `font-display`                               | `font-display` on a heading, or drop the class                            |
| `v3-palette`       | note           | `styles/tailwind-v3-palette.css` holds v3's values for the sites above | delete the file and its `@import` when `status-hue` and `palette` are zero |

The current baselines are in the script itself (`LEGACY`), printed on every run.

What is _not_ checked is not thereby allowed — wall labels before sections, square plates, mono figures and the one-button-per-view rule still need a human eye.

Genuine exceptions live in one place: the `ALLOWLIST` constant at the top of the script, one entry per exception with a one-line reason. It currently exempts the header sheet (shadow and glass) and the dev-only breakpoint indicator. Widening the allowlist is a policy decision and should read like one in the diff; loosening a rule's regex to make a violation disappear is not.
