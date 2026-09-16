# Product

<!-- impeccable:product-schema 1 -->

<!-- Derived from repository evidence (README, CLAUDE.md, config/site.ts,
     app/about-us, prisma/seed-data, components/home) without an owner
     interview. Every statement not backed by code or copy is marked
     "(inferred)" and needs owner confirmation. -->

## Platform

web

## Users

- Shoppers replacing everyday disposables (bottles, brushes, wraps, soap,
  refills) with plastic-free or reusable alternatives. The home hero and
  about page address them directly: "Everyday essentials, minus the plastic."
- (inferred) They are consumers, not businesses: the SaaS/organization layer
  was deliberately removed in PR #58 because it "had no user".
- (inferred) Many arrive undecided; the storefront invests in a four-question
  product quiz ("Most people begin with one swap, not twenty") and
  value-based entry points rather than a category tree.
- Readers of the blog and "Guides & Tips" sections (green home, zero waste,
  fashion & beauty, clean transport, sustainable travel).
- Store operators using `/admin/*` (products, blog, orders). Role-gated via
  `requireRole`.

## Product Purpose

Link Flame is a single eco-commerce storefront with a blog. It sells a
deliberately small catalogue where every product carries certifications,
sustainability values, and a measured per-unit yearly impact versus its
single-use equivalent, and the shop is built to surface that: filter by
values, see what a year of swaps adds up to, buy imperfect stock at a
discount.

Success, as the code defines it: a shopper completes a swap (checkout via
Stripe), ideally more than once (product subscriptions, loyalty points,
referrals, gift cards, bundles, wishlists are all wired into the shop).

## Positioning

"Measured, not promised." Each product is assigned a per-unit yearly impact
(bottles displaced, items replaced, CO2e avoided) and the storefront sums
those into a catalogue-wide figure on the home page (`ImpactBand`) and an
`/impact` page explaining the method. Products earn shelf space by passing
screening on materials, maker, and certifications, and are re-screened.

(inferred) The differentiator is the number, not the assortment: the same
brands are sold elsewhere, but here each one carries a published impact
figure the shopper can add up.

## Operating Context

- Shopping flows: `/products`, `/collections` (filter by values such as
  plastic-free, zero-waste, vegan, cruelty-free), `/bundles` (build a kit),
  `/imperfect` (discounted cosmetic seconds), `/gift-cards`, `/quiz`,
  `/cart`, `/checkout`, `/order-confirmation`, `/wishlists`, `/account/*`.
- Content flows: `/blogs`, `/guides-and-tips/*`, `/brands/[slug]`,
  `/sustainability`, `/impact`, `/terracycle` (take-back program),
  `/about-us`, `/faq`, `/community`, `/write-for-us`.
- Operator flows: `/admin/products`, `/admin/blog`, `/admin/orders`.
- Guest cart persists in a 30-day cookie; checkout and webhooks run through
  Stripe; a service worker provides an `/offline` page.
- Currency is USD; free shipping threshold is $35 (`config/constants.ts`).
- Feature flags in `config/constants.ts`: wishlist and product reviews are
  off by default, newsletter on. (inferred) These flags may lag the actual
  UI, which renders wishlist routes and review counts.

## Capabilities and Constraints

- Stack: Next.js 16 App Router, React 19, PostgreSQL on Neon via Prisma,
  NextAuth v5 (split Edge/Node config), Stripe checkout and two webhook
  secrets, Tailwind v3, npm.
- Every API route is `force-dynamic`; the home page renders at request time
  because the database is not reachable during the Vercel build. Sections
  that depend on data (`FeaturedProducts`, `FeaturedBrands`, `ImpactBand`)
  render nothing rather than placeholders when data is absent.
- Optional services switch off when unset: Stripe, Upstash Redis (rate
  limiting), Resend (email), Sentry.
- Do not reintroduce the multi-tenant SaaS layer (organizations, seat
  billing, API keys, audit log) removed in PR #58.
- Terminology used in code and copy: "values" (plastic-free, zero-waste,
  vegan, cruelty-free, women-owned, Black-owned, small business),
  "certifications" (1% for the Planet, B Corp, Climate Neutral, Plastic
  Free, Vegan, Cruelty Free, ...), "impact metrics" (plastic-bottles-saved,
  single-use-items-replaced, carbon-offset, trees-planted, water-saved,
  waste-diverted), "Perfectly Imperfect" (cosmetic seconds), "Subscribe &
  Save", "Build a Kit" (bundles).
- Undecided: whether the live domain is `link-flame.vivancedata.com`
  (current deploy), `link-flame-rouge.vercel.app` (README), or
  `linkflame.com` (`lib/url.ts` production fallback, contact emails). The
  owner should confirm the canonical domain.

## Brand Commitments

- Name: Link Flame. Logo: `components/icons` `logo`; favicon and
  `public/og.png` exist.
- Commitments stated in copy and seed data: 1% for the Planet member,
  carbon-neutral shipping, plastic-free packaging, ethical sourcing,
  TerraCycle recycling partner. (inferred) These are presented as facts
  about the business; the repository holds no verification documents for
  them, so future work should not extend them (no new percentages, offsets,
  or partner claims).
- Voice, as written in the current copy: plain, specific, slightly dry
  ("Measured, not promised", "Screened, not scraped", "Waste is a design
  flaw"). Avoids slogans; explains the mechanism.
- Social handles referenced: @linkflame on Twitter, Instagram, Pinterest.
  (inferred) Whether these accounts exist is unverified.

## Evidence on Hand

- Seeded catalogue: partner brands (`prisma/seed-data/brands.ts`, e.g. Grove
  Collaborative, Package Free Shop, Ethique, Blueland, Tentree, EarthHero,
  Pela, Allbirds, By Humankind, Plaine Products), certifications
  (`prisma/seed-data/certifications.ts`), per-product impact data
  (`prisma/seed-data/impact-metrics.ts`), sample blog posts.
- (inferred) These brands are seed data for demonstration; there is no
  evidence of a commercial partnership or reseller agreement with any of
  them.
- Photography: `public/images/soap-bars.jpg`, `public/images/wall-hanger-plant.jpg`,
  `public/images/blogs/*`, `public/images/authors/*`, `public/images/team/*`,
  `docs/screenshot.png`.
- Value counts observed in `components/home/HeroSection.tsx`: plastic-free
  14, zero-waste 12, vegan 5, cruelty-free 3; women-owned, Black-owned and
  small business are 0 (so they are not linked from the hero).
- Absent, and not to be fabricated: customer testimonials, press,
  third-party benchmarks, real order volume, verified impact audits,
  pricing or revenue figures.

## Product Principles

1. Publish the number. Every sustainability claim on a surface should trace
   to a measured per-product figure or a named certification; no slogans.
2. Few things, on purpose. A small screened catalogue is the product; do not
   design for breadth (mega-menus, endless categories).
3. One swap first. Reduce the first decision (quiz, value tiles, bundles)
   rather than showing the whole shelf.
4. Empty data renders nothing. Sections that lack data disappear rather
   than showing zeros or placeholders, because a band of zeros says the
   opposite of what the section is for.
5. One storefront, no platform. Anything that serves running a platform
   rather than shopping, content, or sustainability is out of scope.

## Accessibility & Inclusion

- The codebase already holds contrast decisions in `styles/globals.css`
  (muted-foreground tuned to clear 4.5:1 on both card and muted surfaces;
  accent-foreground darkened in dark mode). Treat WCAG AA 4.5:1 for text as
  the working floor.
- Light and dark themes are both shipped (`next-themes`, class strategy);
  every surface must hold in both.
