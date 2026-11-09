# Launch checklist

This list takes Link Flame from the placeholder demo catalogue to a shop that sells its own products. The code is ready. The steps below are accounts, keys and data that only the owner can set up.

## What the shop sells

| Product | Kind | Price | How it reaches the buyer |
|---|---|---|---|
| The Waste Audit Workbook | PDF, 23 pages | $7 | Download link on the confirmation page, in the order email and on the account order page |
| The One-Swap Kitchen | PDF, 25 pages | $9 | Same |
| The Plastic-Free Bathroom Field Guide | PDF, 32 pages | $9 | Same |
| The Swap Starter Set | All three PDFs | $19 | Same |
| Measured, Not Promised Tote | Printful, Econscious EC8000, Oyster | $32 | Printed and shipped by Printful |
| One Swap at a Time Tee | Printful, Stanley/Stella SATU041, Stone, S-3XL | $38 (2XL $40, 3XL $42) | Printed and shipped by Printful |

Printful's base costs (November 2026): the tote is $15.87, the tee is $17.60 (2XL $19.60, 3XL $21.60), plus Printful's shipping. Check them again in the Printful dashboard before launch.

The guide PDFs and manuscripts are paid products. They are **not** in this public repository. They are in the private repository `gr8monk3ys/link-flame-products` (manuscripts, rendered PDFs, `listings.md`), cloned next to this one.

## How an order flows

1. Stripe Checkout takes payment. It asks for a shipping address only when the cart holds a printed item. Shipping is US only.
2. The Stripe webhook (`/api/webhook`) marks the order paid. Then it:
   - creates one download token per guide file (10 downloads each), and
   - sends the printed lines to Printful (`lib/printful.ts`).
3. Printful creates a **draft** order unless `PRINTFUL_AUTO_CONFIRM=true`. Draft means nothing is charged or printed until you confirm it in the Printful dashboard.
4. When Printful ships, its webhook (`/api/printful/webhook`) stores the tracking number and emails the buyer.
5. If the order cannot be sent to Printful, it is kept and marked `printfulStatus = failed` with the error. Fix the cause, then call `POST /api/orders/<id>/printful` as an admin to retry.

## Owner steps, in order

### 1. Accounts and keys

- [ ] **Stripe live mode.** Put the live keys in Vercel: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- [ ] **Stripe webhooks.** Create two endpoints and give each its own secret (`npm run preflight:production` refuses a shared one):
  - `https://<domain>/api/webhook` → `STRIPE_WEBHOOK_SECRET`
  - `https://<domain>/api/subscriptions/webhook` → `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET`
- [ ] **Stripe Tax.** Checkout runs with `automatic_tax` on. Turn on Stripe Tax and add a registration for each state where you must collect sales tax. Without a registration, Stripe charges $0 tax. Digital goods are taxable in some states.
- [ ] **Printful.** Create a store of type "Manual order platform / API". Create a private token with the orders scope. Set these in Vercel:
  - `PRINTFUL_API_KEY`
  - `PRINTFUL_STORE_ID` (only if the token covers more than one store)
  - `PRINTFUL_WEBHOOK_SECRET` (24 or more random characters)
  - `PRINTFUL_AUTO_CONFIRM`: leave it `false` for the first orders, so you see each draft before it is printed.
- [ ] **Printful payment method.** Add a card or Printful wallet funds. Printful charges you when an order is confirmed.
- [ ] **Register the Printful webhook** after the site is deployed:
  ```bash
  PRINTFUL_API_KEY=... PRINTFUL_WEBHOOK_SECRET=... node scripts/register-printful-webhook.mjs https://<domain>
  ```
- [ ] **Email (Resend).** Verify a sending domain in Resend. Set `RESEND_API_KEY`, `EMAIL_FROM` (on that domain) and `ADMIN_EMAIL`. If `EMAIL_FROM` is empty, no mail is sent. Download links still show on the confirmation page and the account page.
- [ ] **Support address.** Set `NEXT_PUBLIC_SUPPORT_EMAIL` to a mailbox you read. Policies and emails show it. The production preflight requires it.
- [ ] **Domain.** The shop runs on `link-flame.vivancedata.com`. Set `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to the domain you will sell on. The download links and Printful print-file URLs are built from it. `linkflame.com` is not owned.
- [ ] Run `npm run preflight:production` against the production env and fix what it reports.

### 2. Database (before merging this PR)

Vercel does not run migrations. Apply them by hand **before** the merge deploys the new code.

1. In Neon, create a branch of production as a backup.
2. Apply the migration. It only adds columns and tables and deletes nothing:
   ```bash
   DATABASE_URL=<prod> DIRECT_URL=<prod direct> npx prisma migrate deploy
   ```
3. Put the launch products in. Run a dry run first and read the plan:
   ```bash
   DATABASE_URL=<prod> npm run catalogue:apply
   DATABASE_URL=<prod> npm run catalogue:apply -- --apply --remove-placeholders
   ```
   `--remove-placeholders` deletes the old demo products that no order references, then deletes bundles and brands left empty. A demo product that an order references is kept, set to zero stock and printed in the output.
4. Upload the guide PDFs:
   ```bash
   DATABASE_URL=<prod> npm run catalogue:upload-assets -- --dir ../link-flame-products/dist --apply
   ```

**Never run `prisma db seed` against production.** The seed deletes orders and every product.

### 3. Test one real order of each kind

- [ ] Buy the $7 workbook with a real card. Check the download on the confirmation page, in the email and on the account order page. Refund it in Stripe.
- [ ] Buy a tote. Check that a draft appears in Printful with the right print file and address. Confirm it, or cancel it and refund.
- [ ] When the tote ships, check that the order page shows the tracking number and the email arrives.

### 4. Business

- [ ] Business registration and a seller's permit or sales-tax registration for California (and other states as you pass their thresholds).
- [ ] Read the policies and change any default you do not agree with. The defaults are dated November 8, 2026:
  - Guides: 30-day money-back refund.
  - Printed items: reprint or refund within 30 days for misprints, damage or defects, with a photo. No returns for size or change of mind.
  - Shipping: US only. $5.99, free at $75 or more. Production takes 2-5 business days, delivery 5-10 business days.
- [ ] Contact form messages are stored in the database (`Contact` table). They are emailed to `ADMIN_EMAIL` only when email is set up.

### 5. Before you promote the shop

- [ ] Replace the drawn product plates in `public/images/products/` with Printful mockups of the real tote and tee.
- [ ] The social links in `config/site.ts` (twitter, instagram, pinterest `linkflame`) point to handles nobody has checked. Claim them or remove the links.
- [ ] The about, impact and sustainability pages state 1% for the Planet, TerraCycle and carbon-neutral shipping as **goals**. Change the copy when one becomes true, and not before.

## Undo

- Code: revert the PR on main. Vercel deploys the revert.
- Data: the Neon backup branch from step 2.1. The migration only adds, so the old code also runs on the migrated database.
