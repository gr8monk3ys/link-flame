# Link Flame

An eco-friendly e-commerce storefront and blog: shoppers replace everyday disposables with plastic-free alternatives, with sustainability facts, loyalty and recycling programs attached.

## Language

### Catalogue

**Product**:
A thing the shop lists, priced in dollars, with sustainability flags (plastic-free, vegan, cruelty-free, organic) and a carbon footprint.
_Avoid_: Item, SKU

**Variant**:
A purchasable option of a Product (for example size or colour) with its own price and inventory.
_Avoid_: Option, size

**Fulfillment**:
How a Product reaches the customer: `stock` (shipped from inventory), `digital` (a download), or `printful` (printed on demand).
_Avoid_: Delivery type, shipping type

**Brand**:
An eco-friendly partner whose Products appear in the brand directory.
_Avoid_: Vendor, supplier

**Bundle**:
A curated set of Products sold together at a discount.
_Avoid_: Kit, pack

**Imperfect**:
A Product (or batch of one) sold at a percentage discount because of a stated flaw such as damaged packaging.
_Avoid_: Seconds, damaged

**Value**:
A shopper-facing attribute (for example vegan or plastic-free) assigned to Products and matched by the Quiz.
_Avoid_: Tag, filter

**Certification**:
A third-party sustainability credential such as B Corp, linked to Products.
_Avoid_: Badge, label

**Checked swap**:
A product from another brand that the shop does not sell, documented with what a certifier or study confirmed and what could not be confirmed.
_Avoid_: Recommendation, alternative

### Buying

**Cart**:
The set of CartItems a shopper (signed in or guest) intends to buy.
_Avoid_: Basket, bag

**Order**:
A paid purchase created from a Stripe Checkout session, with a payment status of paid, pending, failed or refunded.
_Avoid_: Purchase, transaction

**Digital download**:
A file sold with a digital Product, delivered through a token link limited to a number of downloads.
_Avoid_: Attachment, asset link

**Subscription**:
A recurring order of Products delivered at a frequency (weekly, biweekly, monthly, bimonthly) that can be paused, skipped or cancelled.
_Avoid_: Plan, recurring order

**Gift card**:
Store credit bought for someone else; it is `PENDING_PAYMENT` until Stripe confirms the payment, then `ACTIVE`.
_Avoid_: Voucher, coupon

### Rewards

**Loyalty points**:
Points earned from purchases, reviews, referrals and signup, and redeemed at 100 points per dollar of discount.
_Avoid_: Rewards, credits

**Loyalty tier**:
A level (Seedling, Sprout, Bloom, Flourish) set by lifetime points that scales the points earned per purchase.
_Avoid_: Level, rank

**Referral**:
A signup that arrived through a user's ReferralCode and rewards the referrer once completed.
_Avoid_: Invite

### Impact

**Impact metric**:
A unit of environmental benefit (for example plastic saved) that Products, Orders and Users accumulate.
_Avoid_: Eco score, stat

**Carbon offset**:
The carbon compensation recorded against an Order.
_Avoid_: Carbon credit

**TerraCycle submission**:
A customer's recycling shipment of used packaging through the TerraCycle program, tracked from label sent to processed.
_Avoid_: Recycling order, return

### Content

**Blog post**:
An authored article in the blog.
_Avoid_: Article, page

**Guide**:
Long-form how-to content under Guides & Tips (green home, zero waste, clean transport and so on), including calculators.
_Avoid_: Tutorial

**Quiz**:
The four-question product quiz that matches a shopper's answers to Values and Products.
_Avoid_: Survey, questionnaire
