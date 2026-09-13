---
name: Link Flame
description: A warm, paper-toned eco storefront where forest green carries the action and honey amber is spent sparingly.
colors:
  # Light theme (styles/globals.css :root). Values are the HSL tokens resolved to hex.
  forest: "#2a6f4f"
  forest-deep: "#1f513a"
  forest-bright: "#36a16f"
  honey: "#e8a530"
  honey-dark: "#bd8728"
  paper: "#fcfaf8"
  paper-card: "#fdfdfc"
  linen: "#f3eee8"
  linen-muted: "#f3f0ed"
  ink: "#2c2521"
  ink-muted: "#766960"
  sand-border: "#e5e1dc"
  ember: "#ef4444"
  ember-foreground: "#fafafa"
  # Dark theme (.dark)
  night: "#15110f"
  night-card: "#1f1b19"
  night-popover: "#1a1614"
  night-secondary: "#302b27"
  night-muted: "#2c2826"
  night-border: "#322d29"
  bone: "#efebe7"
  bone-muted: "#a39b8f"
  ember-deep: "#7f1d1d"
  ember-deep-foreground: "#fef2f2"
  night-accent-foreground: "#1d1916"
  # Utility whites used on colored surfaces (announcement bar, sale badge)
  white: "#ffffff"
typography:
  display:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "clamp(2.75rem, 6vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.1em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  scale:
    xs: "0.75rem"
    sm: "0.875rem"
    base: "1rem"
    lg: "1.125rem"
    xl: "1.25rem"
    2xl: "1.5rem"
    3xl: "1.875rem"
    4xl: "2.25rem"
    5xl: "3rem"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  4xl: "80px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "40px"
  button-primary-lg:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "8px 32px"
    height: "48px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.forest}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "40px"
  button-accent:
    backgroundColor: "{colors.honey}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 32px"
    height: "48px"
  card:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
  badge:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  impact-band:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.paper}"
    padding: "64px 16px"
---

# Design System: Link Flame

## Overview

**Creative North Star: "The Screened Shelf"**

Link Flame looks like a small shop that stocks few things on purpose. The
ground is warm paper, not white; the type pairs a bookish serif (Lora) for
what the shop believes with a plain sans (Inter) for what it sells; and one
forest green does the work of the brand. The accent, a honey amber, appears
rarely and only where the shop wants a second decision made (the quiz).
Everything else is tonal: linen-toned secondary surfaces, sand-coloured
borders, and shadows tinted brown rather than black so that lifted elements
still look like they sit on paper.

The system is confident but quiet. Sections own their own vertical rhythm
(64 to 112px), cards keep a single soft border and a warm shadow that only
deepens on hover, and the one loud moment on the home page is the full-bleed
forest band that prints the catalogue's summed impact in serif numerals. The
copy carries the attitude ("Measured, not promised"); the visuals stay out of
its way.

**Key Characteristics:**
- Warm paper ground (`paper`), never pure white in light mode
- One brand hue (`forest`), spent on actions, links, icons, and the impact band
- Honey amber is a second-decision colour, not a decoration
- Lora for headings and big numbers; Inter for everything the shopper acts on
- Brown-tinted shadows (`warm-*`), never grey
- 12px is the default corner; pills for badges and value chips
- Light and dark are both first-class; every colour has a dark twin

## Colors

A three-part palette: a forest green that is the brand, a honey amber held in
reserve, and a warm neutral ramp built from brown-tinted paper.

### Primary
- **Forest** (`forest`): the brand hue. Primary buttons, links, active nav,
  icon tints, the impact band ground, and the focus ring. Also the only
  colour allowed to fill a whole section.
- **Forest Deep** (`forest-deep`): the darker step used for hover on solid
  green (rendered as 90% opacity of Forest in Tailwind) and for gradient
  stops inside the primary ramp.
- **Forest Bright** (`forest-bright`): the dark-theme primary, lifted so it
  clears 4.5:1 on Night.

### Secondary
- **Honey** (`honey`): the accent. Used on the quiz call-to-action button
  and on gradient washes at 10% opacity behind sections. Always paired with
  Ink text; never with white.
- **Honey Dark** (`honey-dark`): the dark-theme accent, still paired with
  dark text because amber is a mid-tone in both themes.

### Neutral
- **Paper** (`paper`): page ground in light mode and the text colour on
  Forest surfaces.
- **Paper Card** (`paper-card`): card and popover ground, one step whiter
  than the page so cards read as objects.
- **Linen** (`linen`): secondary surfaces (footer, hero image well, hover
  fills, secondary buttons).
- **Linen Muted** (`linen-muted`): skeleton loaders and muted chips.
- **Ink** (`ink`): body and heading text.
- **Ink Muted** (`ink-muted`): secondary text. Tuned to 42% lightness so it
  clears 4.5:1 on both Paper Card and Linen Muted.
- **Sand Border** (`sand-border`): borders and input strokes.
- **Ember** (`ember`) / **Ember Foreground**: destructive actions only.
- **Night / Night Card / Night Popover / Night Secondary / Night Muted /
  Night Border**: the dark-theme grounds, all brown-tinted so the dark
  theme is still "paper at night", not slate.
- **Bone / Bone Muted**: dark-theme text and secondary text.
- **White**: only on saturated grounds that are not tokens (the announcement
  bar gradient, the "Sale" badge).

### Named Rules
**The One Hue Rule.** Forest is the only colour that may fill a section.
Honey may fill a button; nothing else may fill anything.

**The Tinted Secondary Rule.** Secondary text on a Forest surface is Paper
at reduced opacity (90%, never lower than 85%); on a Paper surface it is Ink
Muted. Never grey.

**The Dark Twin Rule.** Every light token has a dark-theme value in
`styles/globals.css`. Hard-coded Tailwind palette colours (`text-green-700`,
`bg-blue-100`) are legacy drift in the commitment strips and admin pages;
new work uses the tokens.

## Typography

**Display Font:** Lora (with Georgia, serif)
**Body Font:** Inter (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (for code and tabular data only)

**Character:** Bookish and plain. Lora gives headings and impact numbers the
weight of something printed; Inter keeps prices, buttons, and product copy
functional. Neither is condensed or tracked tight beyond -0.025em.

### Hierarchy
- **Display** (600, `clamp(2.75rem, 6vw, 4.5rem)`, 1.05): the home hero
  headline only. Second line takes Forest.
- **Headline** (600, 1.875rem to 2.25rem, 1.1): section headings (`h2`),
  always Lora. Also the impact-band numerals at 2.25rem to 3rem, tabular.
- **Title** (600, 1.125rem to 1.5rem, 1.25): card titles, `h3`, product
  names. Inter, tight tracking.
- **Body** (400, 1rem, 1.625): product copy, blog prose. Lead paragraphs use
  1.125rem. Max measure is `max-w-2xl` (42rem) on centred intros and
  `max-w-xl` (36rem) on the hero.
- **Label** (500, 0.875rem, 0.1em to 0.12em tracking, uppercase): eyebrows
  and unit labels in the impact band; 0.75rem for product category tags.

### Named Rules
**The Serif Speaks First Rule.** Every `h1` and `h2` is Lora. Sans headings
are reserved for `h3` and below.

**The Tabular Numbers Rule.** Any number that counts (impact totals, prices
in a list) sets `tabular-nums`.

## Layout

Single centred column, `max-w-7xl` (80rem), gutters 16 / 24 / 32px at the
`sm` / `lg` breakpoints. The header is sticky, 72px tall, on a 95% Paper
ground with backdrop blur; the announcement bar sits above it and wraps to
three lines on mobile, so the header height is never assumed.

Sections own their vertical padding (`py-16 lg:py-20`, 64 to 80px; the CTA
section goes to `py-28`, 112px). The page wrapper adds none. Grids step from
one column to two at `sm` and four at `lg` for products, three at `lg` for
brands. Hero is a 5/7 split on twelve columns at `lg`, stacked below.

Spacing rhythm is the Tailwind 4px scale; the recurring steps are 4, 8, 16,
24, 32, 48, 64, 80.

## Elevation & Depth

Hybrid, with tonal layering as the default. Cards sit on Paper Card against
a Paper page, separated by a Sand border at 70% and a barely-there warm
shadow; hover deepens the shadow rather than lifting the card. Section
grounds alternate Paper, Linen washes, and the one solid Forest band. The
header floats on blur, not shadow.

### Shadow Vocabulary
- **warm-sm** (`box-shadow: 0 1px 2px 0 rgba(120, 85, 40, 0.05)`): card at rest.
- **warm** (`box-shadow: 0 1px 3px 0 rgba(120, 85, 40, 0.08), 0 1px 2px -1px rgba(120, 85, 40, 0.08)`): popovers, dropdowns.
- **warm-md** (`box-shadow: 0 4px 6px -1px rgba(120, 85, 40, 0.08), 0 2px 4px -2px rgba(120, 85, 40, 0.06)`): card hover, primary button hover.
- **warm-lg** (`box-shadow: 0 10px 15px -3px rgba(120, 85, 40, 0.08), 0 4px 6px -4px rgba(120, 85, 40, 0.06)`): the hero photograph well.

### Named Rules
**The Brown Shadow Rule.** Shadows are tinted `rgba(120, 85, 40, a)`. A
neutral black shadow on this ground reads as a different product.

## Shapes

Softly rounded throughout. The base radius token is 12px (`--radius`), used
as `rounded-xl` on cards and `rounded-lg` on buttons; inputs step down to
10px, small buttons to 8px. Image wells go to 16px, the CTA section to 24px.
Badges, value chips, icon discs, and the eyebrow pill are full pills. Borders
are 1px Sand (or 2px Forest at 20% on outline buttons). No hard corners
anywhere in the storefront.

## Components

### Buttons
- **Shape:** rounded (8px), height 40px default, 48px large, 36px small.
- **Primary:** Forest ground, Paper text, 500 weight 0.875rem; large size
  is 1rem with 32px side padding.
- **Hover / Focus:** 90% Forest plus `warm-md` shadow; active scales to
  0.98; focus is a 2px Forest ring offset 2px on the page ground.
- **Outline:** 2px Forest at 20% border, Forest text, 5% Forest fill on hover.
- **Secondary:** Linen ground, Ink text.
- **Accent:** Honey ground, Ink text; only the quiz CTA. Carries a slow
  light sweep (`.modern-button`) on hover.
- **Ghost / Link:** ghost fills with accent on hover; link is Forest text
  with an underline offset of 4px.

### Chips (badges)
- **Style:** pill, 0.75rem semibold, 2px by 10px padding. Default is Forest
  ground with Paper text; secondary is Linen; outline is Ink text on nothing.
- **State:** eco-value badges use tinted 10% Forest ground with Forest text
  (`.badge`); the sale badge is a red pill with white text.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Paper Card; hero value tiles use Paper Card with a 1px
  Sand border and swap to a Linen wash on hover.
- **Shadow Strategy:** `warm-sm` at rest, `warm-md` on hover (300ms).
- **Border:** 1px Sand at 70%.
- **Internal Padding:** 24px (header and content), 16px on product tiles,
  20px on hero value tiles.

### Inputs / Fields
- **Style:** 1px Sand stroke, transparent ground, 10px radius, 40px tall,
  0.875rem text, Ink Muted placeholder.
- **Focus:** 2px Forest ring offset 2px, no outline.
- **Disabled:** 50% opacity, not-allowed cursor.

### Navigation
- Sticky header on 95% Paper with blur and a 60% Sand bottom border. Logo
  mark plus bold wordmark; top-level items use the Radix navigation-menu
  trigger style with 0.875rem medium text; dropdown panels are 400 to 600px
  two-column lists of title plus one-line description, rows rounded 10px and
  filling with the accent token on hover. Right cluster: search, loyalty
  badge (sm+), account, cart in Ink Muted turning Forest on hover. Mobile
  collapses to a sheet at `md`.
- Announcement bar: emerald-to-green gradient with white text and a
  dismiss button. (Legacy hard-coded palette; documented, not endorsed.)
- Footer: Linen at 30% over a 40% Sand top border, five-column grid at
  `lg`, serif column headings, Ink Muted links turning Ink on hover.

### Impact Band (signature)
Full-bleed Forest section, Paper text. Eyebrow label at 90% Paper, Lora
headline, a two-to-four column `dl` of Lora numerals (2.25 to 3rem, tabular,
counting up on entry) over a 20% Paper left rule, with the unit as an
uppercase label and the metric name below. Closes with an arrow link to
`/impact`. Renders nothing when there is no data.

### Hero
5/7 grid: Forest eyebrow, Lora display headline whose second line is Forest,
Ink Muted lead, primary plus outline buttons, and a 4:3 (3:2 on `sm`) photo
in a 16px-radius Linen well with `warm-lg`. Below it, four value tiles.

## Do's and Don'ts

### Do:
- **Do** set every colour through the HSL tokens in `styles/globals.css`
  and the Tailwind aliases (`bg-primary`, `text-muted-foreground`), so the
  dark theme follows for free.
- **Do** keep secondary text on Forest at 90% Paper or stronger; 70% and
  80% both fall below 4.5:1 (3.7:1 and 4.3:1).
- **Do** use Lora for `h1`, `h2`, and counted numerals; Inter elsewhere.
- **Do** let data-driven sections return `null` when empty.
- **Do** tint shadows brown (`warm-*`) and borders Sand.
- **Do** keep hover motion to 200 to 300ms with a shadow or colour change;
  the count-up in the impact band is the page's one authored moment.

### Don't:
- **Don't** fill a section with any colour other than Forest, or a button
  with any colour other than Forest, Honey, Linen, or Ember.
- **Don't** pair Honey with white or Paper text; it is 2.7:1 in dark mode.
- **Don't** add new Tailwind palette colours (`green-700`, `blue-100`,
  `purple-600`); the commitment strips and admin pages that use them are
  drift to migrate, not a pattern to extend.
- **Don't** use gradient text; emphasis is weight, size, or Forest.
- **Don't** put a coloured `border-left` thicker than 1px on a card or
  callout.
- **Don't** use bounce or elastic easing; ease-out only.
