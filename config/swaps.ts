/**
 * Checked swaps: products from other brands, with what could be confirmed
 * and what could not.
 *
 * Link Flame does not sell, ship or test these products. Every entry is a
 * document check done on `checkedOn`: the brand's own page, then the
 * certifier's own listing or a published study.
 *
 * Rules for editing this file:
 * - `brandClaims` are the brand's words, paraphrased. They are not facts.
 * - `confirmed` holds only what a certifier's own page or a published study
 *   shows. Each item needs the URL that shows it.
 * - "Could not confirm" means we looked and could not verify it. It does not
 *   mean the claim is false, so never write "not certified".
 * - When a page is read again, update `checkedOn` and the price together.
 * - `affiliateUrl` is set only after a program has accepted the shop. Setting
 *   it marks the link as paid on the page (see `lib/swaps.ts`).
 */

export const SWAP_CATEGORIES = [
  "Food packaging",
  "Produce bags",
  "Paper towels and wipes",
  "Coffee and tea",
  "Bathroom",
  "Cleaning",
  "Takeout and delivery",
  "Other",
] as const

export type SwapCategory = (typeof SWAP_CATEGORIES)[number]

export interface SwapSource {
  label: string
  url: string
  kind: "brand" | "certifier" | "study"
}

export interface SwapFinding {
  text: string
  /** The page that shows it. Required for confirmed findings. */
  sourceUrl?: string
}

export interface Swap {
  slug: string
  brand: string
  product: string
  category: SwapCategory
  /** The single-use item this stands in for. */
  replaces: string
  /** Price as read on `checkedOn`. */
  price: string
  priceNote?: string
  /** ISO date (YYYY-MM-DD) of the page reads. */
  checkedOn: string
  /** The brand's own product page. */
  url: string
  /** Paid link. Set only once a program has accepted the shop. */
  affiliateUrl?: string
  materials: string
  brandClaims: readonly string[]
  confirmed: readonly (SwapFinding & { sourceUrl: string })[]
  notProven: readonly SwapFinding[]
  endOfLife: string
  sources: readonly SwapSource[]
  /** Set when part of the brand's pages could not be read. */
  limited?: string
}

const CHECKED_ON = "2026-11-09"

const bCorp = (slug: string) =>
  `https://www.bcorporation.net/en-us/find-a-b-corp/company/${slug}/`

const CLIMATE_LABEL = "https://climateneutral.org/certified-brands"
const SAFER_CHOICE = "https://www.epa.gov/saferchoice/products"

const MARLEYS = "https://www.marleysmonsters.com/products/unpaper-towels-color-mixes-2"
const BLUEBIRDS = "https://threebluebirds.com/products/cardinals-on-sand-swedish-dishcloth"
const WGAC = "https://us.whogivesacrap.org/products/100-recycled-toilet-paper-jumbo-rolls"
const WGAC_FOOTPRINT = "https://blog.whogivesacrap.org/home/we-officially-have-a-carbon-footprint"
const BEES_WRAP = "https://www.beeswrap.com/products/the-tri-fecta"
const STASHER = "https://www.stasherbag.com/products/sandwich-3-pack"
const STASHER_REPURPOSE = "https://www.stasherbag.com/pages/repurpose-program"
const ECOBAGS = "https://ecobags.com/products/produce-bag-3-set-1"
const DANISH_EPA = "https://www2.mst.dk/Udgiv/publications/2018/02/978-87-93614-73-4.pdf"
const COFFEESOCK = "https://coffeesock.com/shop-all-vNHGy-fUstF/p/hario-v60-style"
const BITE = "https://www.bitetoothpastebits.com/products/fluoride-free-toothpaste-4oz"
const ADA_TOOTHPASTE = "https://www.ada.org/resources/ada-library/oral-health-topics/toothpastes"
const HIBAR = "https://www.hellohibar.com/products/maintain-shampoo-bar"
const LEAF = "https://leafshave.com/products/leaf-two-razor"
const LEAF_RECYCLING = "https://leafshave.com/pages/recycling-with-leaf"
const PLAINE = "https://www.plaineproducts.com/products/shampoo"
const BLUELAND = "https://www.blueland.com/products/the-clean-essentials"
const BLUELAND_PACKAGING = "https://www.blueland.com/pages/packaging"
const BLUELAND_CERTS = "https://www.blueland.com/pages/certifications"
const MELIORA = "https://meliorameansbetter.com/products/laundry-powder-detergent"
const MELIORA_SUSTAINABILITY = "https://meliorameansbetter.com/pages/sustainability"
const MADE_SAFE_MELIORA =
  "https://index.madeworks.com/products/meliora-cleaning-products-laundry-powder"
const DROPPS = "https://www.dropps.com/products/laundry-pods-64-ct"
const PVA_STUDY = "https://pmc.ncbi.nlm.nih.gov/articles/PMC8199957/"
const KLEAN = "https://www.kleankanteen.com/products/water-bottle-classic-18-oz"
const KLEAN_STEEL = "https://www.kleankanteen.com/pages/recycled-steel"
const KEEPCUP = "https://us.keepcup.com/products/original-clear"
const KEEPCUP_IMPACT = "https://us.keepcup.com/pages/minimising-our-impact"
const KEEPCUP_LCA =
  "https://cdn.brandfolder.io/FJLTS6WX/at/q9krvx-7hd0lc-75gket/Edge_-_KeepCup_LCA_Report_v7.pdf"
const TO_GO_WARE =
  "https://www.chicobag.com/shop/to-go-ware-9/to-go-ware-bamboo-utensil-set-repete-refine-380"

export const SWAPS: readonly Swap[] = [
  {
    slug: "marleys-monsters-unpaper-towels",
    brand: "Marley's Monsters",
    product: "Reusable UNpaper Towels, Solid Colors",
    category: "Paper towels and wipes",
    replaces: "Paper towels",
    price: "$45.00 for 12",
    priceNote:
      "A 24-pack was $85.00. A site-wide 20% sale banner was showing; these are the prices without it.",
    checkedOn: CHECKED_ON,
    url: MARLEYS,
    materials:
      "Single-ply 100% cotton flannel with sewn edges, about 10 x 12 inches each, on a kraft paper tube. The fabric is not prewashed, so it shrinks a little. This listing says cotton, not organic cotton; the brand sells an organic line as a separate product.",
    brandClaims: [
      "A reusable swap that cuts paper towel waste and cost.",
      "The towels last five years or more with proper care. The brand calls this an estimate.",
      "Handmade in Eugene, Oregon.",
      "The packaging has no plastic.",
    ],
    confirmed: [],
    notProven: [
      {
        text: "The five-year life and the payback time are the brand's own estimates. The page cites no test or study.",
        sourceUrl: MARLEYS,
      },
      {
        text: "The page gives two wash temperatures: hot in the description and warm in the care notes.",
        sourceUrl: MARLEYS,
      },
      {
        text: "The page claims no certification, and we found no life cycle study from the brand.",
      },
    ],
    endOfLife: "Not stated on the product page.",
    sources: [
      { label: "Marley's Monsters product page", url: MARLEYS, kind: "brand" },
      {
        label: "Marley's Monsters about page",
        url: "https://www.marleysmonsters.com/pages/about-us",
        kind: "brand",
      },
    ],
  },
  {
    slug: "three-bluebirds-swedish-dishcloth",
    brand: "Three Bluebirds",
    product: "Swedish Dishcloth, Cardinals on Sand",
    category: "Paper towels and wipes",
    replaces: "Paper towels and sponges",
    price: "$6.95",
    checkedOn: CHECKED_ON,
    url: BLUEBIRDS,
    materials:
      "70% cellulose and 30% cotton that the brand calls organic. Printed with inks the brand calls water-based. 6.5 x 8 inches.",
    brandClaims: [
      "One cloth replaces up to 17 rolls of paper towels.",
      "A cloth lasts up to 200 washes.",
      "Plastic-free, and fully biodegradable and compostable.",
      "The brand gives 1% of revenue to environmental causes.",
    ],
    confirmed: [],
    notProven: [
      {
        text: "The 17-roll and 200-wash figures have no test or study on the page.",
        sourceUrl: BLUEBIRDS,
      },
      {
        text: "The compost claim names no test and no compost standard. The page does not say if it means home or industrial composting.",
        sourceUrl: BLUEBIRDS,
      },
      {
        text: "The page names no certification for the organic cotton.",
        sourceUrl: BLUEBIRDS,
      },
      {
        text: "The 1% donation is the brand's claim. We could not confirm it; the giving directory did not load for us.",
      },
    ],
    endOfLife: "The brand says a worn-out cloth can go in the compost.",
    sources: [{ label: "Three Bluebirds product page", url: BLUEBIRDS, kind: "brand" }],
  },
  {
    slug: "who-gives-a-crap-recycled-toilet-paper",
    brand: "Who Gives A Crap",
    product: "100% Recycled Toilet Paper",
    category: "Bathroom",
    replaces: "Toilet paper made from virgin pulp",
    price: "$68.00 for 48 rolls",
    priceNote: "24 rolls were $42.00. A subscription price of $53.00 for 48 rolls was also showing.",
    checkedOn: CHECKED_ON,
    url: WGAC,
    materials:
      "100% recycled paper, 3-ply, 385 sheets per roll. Whitened with hydrogen peroxide and oxygen, not chlorine. Each roll is wrapped in paper.",
    brandClaims: [
      "Made from post-consumer paper, with no plastic.",
      "A life cycle study done with the consultancy Edge Environment found a 22% lower carbon footprint than toilet paper made from virgin trees.",
      "Shipping is carbon neutral through purchased offsets.",
      "The company donates 50% of its profits.",
    ],
    confirmed: [
      {
        text: "The company is a certified B Corp, listed as Good Goods Holdings Pty Ltd, certified since February 2016.",
        sourceUrl: bCorp("who-gives-a-crap"),
      },
    ],
    notProven: [
      {
        text: "This is still a single-use product. It is a lower-impact paper, not a reusable swap.",
      },
      {
        text: "We did not find the full life cycle report, so we could not check the 22% figure against it.",
        sourceUrl: WGAC_FOOTPRINT,
      },
      {
        text: "The brand says a third party verified its company carbon footprint to ISO 14064-3. That covers the company footprint, not the product study. We did not check it with the verifier.",
        sourceUrl: WGAC_FOOTPRINT,
      },
      {
        text: "Carbon-neutral shipping depends on purchased offsets. We did not check the quality of the credits.",
        sourceUrl: WGAC_FOOTPRINT,
      },
      {
        text: "Each roll has its own paper wrap. The brand says this uses about the same paper as one wrap around a 6-pack.",
        sourceUrl: WGAC,
      },
    ],
    endOfLife:
      "The brand says the paper is flushable and septic-safe, and that it breaks down in under 10 seconds in its own test. The lab is not named.",
    sources: [
      { label: "Who Gives A Crap product page", url: WGAC, kind: "brand" },
      {
        label: "Who Gives A Crap impact page",
        url: "https://us.whogivesacrap.org/pages/our-impact",
        kind: "brand",
      },
      { label: "Who Gives A Crap carbon footprint post", url: WGAC_FOOTPRINT, kind: "brand" },
      { label: "B Lab directory listing", url: bCorp("who-gives-a-crap"), kind: "certifier" },
    ],
  },
  {
    slug: "bees-wrap-assorted-3-pack",
    brand: "Bee's Wrap",
    product: "Assorted 3 Pack",
    category: "Food packaging",
    replaces: "Cling film and plastic food bags",
    price: "$19.99",
    checkedOn: CHECKED_ON,
    url: BEES_WRAP,
    materials:
      "Cotton coated with beeswax, plant oil and tree resin. The brand calls the cotton and the oil organic. Three sizes: 7 x 8, 10 x 11 and 13 x 14 inches.",
    brandClaims: [
      "The wrap makes a breathable seal that keeps food fresh.",
      "It can be reused many times and lasts up to a year with proper care.",
      "The cotton is GOTS-certified organic.",
      "The beeswax is responsibly sourced.",
    ],
    confirmed: [
      {
        text: "The company is a certified B Corp, certified since April 2019.",
        sourceUrl: bCorp("bees-wrap"),
      },
    ],
    notProven: [
      {
        text: "GOTS certification is the brand's claim. The brand names no supplier and the GOTS database did not load for us, so we could not confirm it.",
      },
      {
        text: "The wrap must stay away from all heat: cool water only, no microwave and no oven.",
        sourceUrl: BEES_WRAP,
      },
      {
        text: "It contains beeswax, so it is not vegan. The brand sells a vegan wrap as a separate product.",
        sourceUrl: BEES_WRAP,
      },
      {
        text: "The page names no certification for the beeswax sourcing.",
        sourceUrl: BEES_WRAP,
      },
      { text: "We found no study that compares the wrap with plastic film." },
    ],
    endOfLife:
      "The brand says to cut a worn wrap into strips for the compost, or to use it as a fire starter.",
    sources: [
      { label: "Bee's Wrap product page", url: BEES_WRAP, kind: "brand" },
      { label: "B Lab directory listing", url: bCorp("bees-wrap"), kind: "certifier" },
    ],
  },
  {
    slug: "stasher-sandwich-2-pack",
    brand: "Stasher",
    product: "Sandwich 2-Pack",
    category: "Food packaging",
    replaces: "Single-use plastic sandwich and snack bags",
    price: "$20.24",
    priceNote:
      "Shown as a sale price against a regular price of $26.99. A sold-out notice was also on the page, so stock was unclear.",
    checkedOn: CHECKED_ON,
    url: STASHER,
    materials:
      "Food-grade platinum silicone. The brand says it is free of lead, latex, BPA, BPS and phthalates.",
    brandClaims: [
      "One bag replaces hundreds of plastic bags a year.",
      "Safe in the dishwasher, microwave and freezer, and in the oven up to 425 F.",
      "Products are sent to outside labs for testing.",
    ],
    confirmed: [],
    notProven: [
      {
        text: "The figure for bags replaced has no source on the brand's page.",
        sourceUrl: "https://www.stasherbag.com/pages/about-us",
      },
      {
        text: "The brand names outside test labs. It links no reports or certificates, so we could not check the results.",
        sourceUrl: STASHER,
      },
      {
        text: "The brand itself says silicone does not biodegrade.",
        sourceUrl: STASHER_REPURPOSE,
      },
      {
        text: "The repurpose page we read gave no mail-in steps or limits, so we could not check how that route works in practice.",
        sourceUrl: STASHER_REPURPOSE,
      },
      { text: "We found no life cycle study from the brand." },
    ],
    endOfLife:
      "Silicone does not biodegrade, the brand says. It offers a free repurpose route for worn bags through TerraCycle.",
    sources: [
      { label: "Stasher product page", url: STASHER, kind: "brand" },
      {
        label: "Stasher about page",
        url: "https://www.stasherbag.com/pages/about-us",
        kind: "brand",
      },
      { label: "Stasher repurpose program", url: STASHER_REPURPOSE, kind: "brand" },
    ],
  },
  {
    slug: "ecobags-organic-cotton-produce-bags",
    brand: "ECOBAGS",
    product: "Organic Cotton Gauze Produce Bag, 3 Set",
    category: "Produce bags",
    replaces: "Thin single-use plastic produce bags",
    price: "$17.24 for 3",
    priceNote: "A sold-out notice was also on the page, so stock was unclear.",
    checkedOn: CHECKED_ON,
    url: ECOBAGS,
    materials:
      "1.3 oz cotton gauze that the brand calls certified organic, unbleached and untreated. Packed in paper the brand calls FSC-certified recycled. Designed in New York and made by hand in India.",
    brandClaims: [
      "The bags are ultralight.",
      "They are commercially compostable and can go to textile recycling.",
      "The company is a B Corp.",
    ],
    confirmed: [
      {
        text: "The company is a certified B Corp, listed as Eco-Bags Products, certified since November 2010.",
        sourceUrl: bCorp("eco-bags-products"),
      },
    ],
    notProven: [
      {
        text: "The page names no scheme for the organic cotton claim. We could not confirm it.",
        sourceUrl: ECOBAGS,
      },
      {
        text: "A 2018 Danish EPA life cycle study of grocery carrier bags found that an organic cotton carrier bag must be reused at least 149 times to match a plastic carrier bag on climate alone, and 20,000 times when every indicator is counted. The report says the high figure comes from ozone depletion alone.",
        sourceUrl: DANISH_EPA,
      },
      {
        text: "That study covers carrier bags, not thin produce bags, so its numbers do not transfer directly to this product. We found no study of produce bags.",
      },
    ],
    endOfLife:
      "The brand says the bags are commercially compostable and can go to textile recycling. It does not claim home composting.",
    sources: [
      { label: "ECOBAGS product page", url: ECOBAGS, kind: "brand" },
      { label: "B Lab directory listing", url: bCorp("eco-bags-products"), kind: "certifier" },
      {
        label: "Danish EPA, Life Cycle Assessment of grocery carrier bags (2018)",
        url: DANISH_EPA,
        kind: "study",
      },
    ],
  },
  {
    slug: "coffeesock-v60-filters",
    brand: "CoffeeSock",
    product: "Hario V60 Style Filters, 2-pack",
    category: "Coffee and tea",
    replaces: "Disposable paper coffee filters",
    price: "$16.99 for 2",
    checkedOn: CHECKED_ON,
    url: COFFEESOCK,
    materials:
      "Unbleached cotton that the brand calls 100% organic. Made in Austin, Texas.",
    brandClaims: [
      "One filter replaces more than 500 paper filters.",
      "A filter lasts from several months to over a year.",
      "The cotton is GOTS certified.",
      "A worn filter is compostable.",
    ],
    confirmed: [],
    notProven: [
      {
        text: "The 500-filter figure has no stated basis.",
        sourceUrl: "https://coffeesock.com/",
      },
      {
        text: "GOTS certification is the brand's claim. The brand gives no certificate number or mill name and the GOTS database did not load for us, so we could not confirm it.",
        sourceUrl: "https://coffeesock.com/faqs",
      },
      {
        text: "Care takes work: rinse with hot water and no soap, dry fully, and boil now and then. The brand says to replace the filter when the fabric thins or the taste suffers.",
        sourceUrl: "https://coffeesock.com/brew-and-care",
      },
    ],
    endOfLife:
      "The brand says the filter is compostable, and that cutting it into 1-inch pieces speeds this up.",
    sources: [
      { label: "CoffeeSock product page", url: COFFEESOCK, kind: "brand" },
      { label: "CoffeeSock FAQ", url: "https://coffeesock.com/faqs", kind: "brand" },
      {
        label: "CoffeeSock brew and care page",
        url: "https://coffeesock.com/brew-and-care",
        kind: "brand",
      },
    ],
  },
  {
    slug: "bite-toothpaste-bits",
    brand: "Bite",
    product: "Fluoride-Free Toothpaste Bits, 4 oz",
    category: "Bathroom",
    replaces: "Toothpaste in plastic tubes",
    price: "$48.00",
    priceNote: "A refill was $32.00.",
    checkedOn: CHECKED_ON,
    url: BITE,
    limited:
      "This entry is incomplete. The brand's ingredient, sustainability and end-of-life pages load by script and we could not read them. Treat the materials and end-of-life lines as not checked.",
    materials:
      "Not checked. The short product description says the bits are made without plastic and without fluoride, with a mint flavour. They come in a glass jar.",
    brandClaims: [
      "Made without plastic and without fluoride.",
      "Sold in a refillable glass jar, with refills in pouches.",
      "The site footer shows cruelty-free and vegan badges.",
    ],
    confirmed: [
      {
        text: "The company is a certified B Corp, listed as The Kind Lab PBC (doing business as Bite Toothpaste Bits), certified since September 2022.",
        sourceUrl: bCorp("the-kind-lab-pbc-dba-bite-toothpaste-bits"),
      },
    ],
    notProven: [
      {
        text: "The American Dental Association says a toothpaste that carries its Seal with a cavity-protection claim must contain fluoride. This product has none. The brand also sells a fluoride version. We did not check if any Bite product has the Seal.",
        sourceUrl: ADA_TOOTHPASTE,
      },
      {
        text: "We could not read a live page that says what the refill pouch is made of, so we make no compost statement about it.",
      },
      {
        text: "The footer badges are the brand's claims. The certifiers' pages did not load for us, so we could not confirm them.",
      },
    ],
    endOfLife: "Not checked. The jar is glass and refillable.",
    sources: [
      { label: "Bite product page", url: BITE, kind: "brand" },
      {
        label: "Bite refill page",
        url: "https://www.bitetoothpastebits.com/products/fluoride-free-toothpaste-refill",
        kind: "brand",
      },
      {
        label: "B Lab directory listing",
        url: bCorp("the-kind-lab-pbc-dba-bite-toothpaste-bits"),
        kind: "certifier",
      },
      {
        label: "American Dental Association, Toothpastes",
        url: ADA_TOOTHPASTE,
        kind: "study",
      },
    ],
  },
  {
    slug: "hibar-maintain-shampoo-bar",
    brand: "HiBAR",
    product: "Maintain Shampoo Bar",
    category: "Bathroom",
    replaces: "Liquid shampoo in plastic bottles",
    price: "$14.95",
    checkedOn: CHECKED_ON,
    url: HIBAR,
    materials:
      "A solid bar. The first ingredients include sodium cocoyl isethionate (from coconut oil), shea butter and vegetable glycerin. Packed in cardboard. Made in Minneapolis.",
    brandClaims: [
      "Plastic-free, and free of sulfates and parabens.",
      "One bar replaces two bottles of liquid shampoo.",
      "Leaping Bunny certified and vegan.",
      "The cardboard box is FSC-certified and recyclable.",
    ],
    confirmed: [],
    notProven: [
      {
        text: "The page gives two different claims for how long a bar lasts: as long as two big bottles in one place, and at least as long as one 24 oz bottle in its FAQ.",
        sourceUrl: HIBAR,
      },
      {
        text: "Leaping Bunny certification is the brand's claim. The certifier's brand pages did not load for us, so we could not confirm it.",
      },
      {
        text: "The FSC claim for the packaging is the brand's. We could not confirm it in the FSC database.",
      },
      {
        text: "The page shows a running count of plastic bottles saved and gives no method for it.",
        sourceUrl: HIBAR,
      },
    ],
    endOfLife:
      "The brand says the cardboard box is recyclable, and that its shipping materials are compostable, recyclable or biodegradable.",
    sources: [{ label: "HiBAR product page", url: HIBAR, kind: "brand" }],
  },
  {
    slug: "leaf-shave-leaf-two-razor",
    brand: "Leaf Shave",
    product: "Leaf Two Razor",
    category: "Bathroom",
    replaces: "Disposable plastic razors",
    price: "$109.00",
    priceNote: "A kit was $149.00. The brand also lists a newer version 2.1.",
    checkedOn: CHECKED_ON,
    url: LEAF,
    materials:
      "An all-metal razor with a pivoting head. It takes standard steel safety razor blades. The brand does not name the metal alloy.",
    brandClaims: [
      "Plastic-free by design, with no plastic refills.",
      "Built for years of daily use.",
      "Takes standard safety razor blades.",
    ],
    confirmed: [],
    notProven: [
      {
        text: "The claim of years of use is not tested or sourced on the page.",
        sourceUrl: LEAF,
      },
      {
        text: "The brand says most curbside programs cannot take razor blades. Used blades go to scrap metal or back to the brand by mail.",
        sourceUrl: LEAF_RECYCLING,
      },
      {
        text: "The page claims no certification, and we found no life cycle study from the brand.",
      },
    ],
    endOfLife:
      "Collect used blades in a tin. The brand says to recycle the full tin as scrap metal or mail it back. It also takes back razor handles.",
    sources: [
      { label: "Leaf Shave product page", url: LEAF, kind: "brand" },
      { label: "Leaf Shave recycling page", url: LEAF_RECYCLING, kind: "brand" },
    ],
  },
  {
    slug: "plaine-products-shampoo",
    brand: "Plaine Products",
    product: "Shampoo, 16 oz",
    category: "Bathroom",
    replaces: "Shampoo in single-use plastic bottles",
    price: "$33.00",
    priceNote: "With a pump it was $33.75.",
    checkedOn: CHECKED_ON,
    url: PLAINE,
    materials:
      "An aluminum bottle with a reusable pump. The brand says the formula is vegan and free of sulfates and parabens.",
    brandClaims: [
      "Empty bottles are returned free, washed and refilled.",
      "Shipping boxes are reused about five times before they are recycled.",
      "Leaping Bunny certified.",
    ],
    confirmed: [
      {
        text: "The company is a certified B Corp, certified since January 2018.",
        sourceUrl: bCorp("plaine-products"),
      },
    ],
    notProven: [
      {
        text: "Leaping Bunny certification is the brand's claim. The certifier's pages did not load for us, so we could not confirm it.",
        sourceUrl: "https://www.plaineproducts.com/pages/faqs",
      },
      {
        text: "Return trips add transport. We found no life cycle study, so the net effect against a plastic bottle is not measured.",
      },
      {
        text: "The brand reuses only the bottles that meet its reuse criteria.",
        sourceUrl: PLAINE,
      },
      {
        text: "The page shows a running count of plastic bottles saved and gives no method for it.",
        sourceUrl: PLAINE,
      },
    ],
    endOfLife:
      "Mail the empty bottle back to the brand for washing and reuse. The brand says aluminum can also be recycled.",
    sources: [
      { label: "Plaine Products product page", url: PLAINE, kind: "brand" },
      {
        label: "Plaine Products FAQ",
        url: "https://www.plaineproducts.com/pages/faqs",
        kind: "brand",
      },
      {
        label: "Plaine Products sustainability page",
        url: "https://www.plaineproducts.com/pages/sustainable-products",
        kind: "brand",
      },
      { label: "B Lab directory listing", url: bCorp("plaine-products"), kind: "certifier" },
    ],
  },
  {
    slug: "blueland-clean-essentials",
    brand: "Blueland",
    product: "The Clean Essentials",
    category: "Cleaning",
    replaces: "Bottled spray cleaners and hand soap",
    price: "$46.00",
    priceNote: "With the brand's Autoship subscription it was $36.80.",
    checkedOn: CHECKED_ON,
    url: BLUELAND,
    materials:
      "Four refillable bottles (foaming hand soap, multi-surface, bathroom, and glass and mirror cleaner), each with one tablet that dissolves in water. The brand says the hand soap bottle is glass. The pages we read do not say what the spray bottles are made of.",
    brandClaims: [
      "The kit saves 35 plastic containers a year.",
      "91% lower emissions than a conventional plastic bottle.",
      "The tablets contain no plastic.",
      "Cradle to Cradle Certified.",
      "Carbon neutral since 2020.",
    ],
    confirmed: [
      {
        text: "The company is a certified B Corp, listed as One Home Brands, Inc., certified since March 2021.",
        sourceUrl: bCorp("one-home-brands-inc"),
      },
      {
        text: "EPA's Safer Choice product list includes the four products in this kit.",
        sourceUrl: SAFER_CHOICE,
      },
      {
        text: "The Climate Label directory lists Blueland as currently certified.",
        sourceUrl: CLIMATE_LABEL,
      },
    ],
    notProven: [
      {
        text: "The 91% emissions figure has no method on the product page.",
        sourceUrl: BLUELAND,
      },
      {
        text: "Cradle to Cradle certification is the brand's claim. We could not confirm a current certificate; the certifier's registry page did not load for us.",
      },
      {
        text: "The brand says its wrappers and pouches are compostable in industrial composting only.",
        sourceUrl: BLUELAND_PACKAGING,
      },
      {
        text: "The brand reaches carbon neutrality partly by buying credits.",
        sourceUrl: BLUELAND_CERTS,
      },
    ],
    endOfLife:
      "The bottles are refilled. The brand says pouches and wrappers can go to industrial composting, and that pumps and nozzles can be mailed back for recycling.",
    sources: [
      { label: "Blueland product page", url: BLUELAND, kind: "brand" },
      { label: "Blueland packaging page", url: BLUELAND_PACKAGING, kind: "brand" },
      { label: "Blueland certifications page", url: BLUELAND_CERTS, kind: "brand" },
      { label: "B Lab directory listing", url: bCorp("one-home-brands-inc"), kind: "certifier" },
      { label: "EPA Safer Choice product search", url: SAFER_CHOICE, kind: "certifier" },
      { label: "The Climate Label certified brands", url: CLIMATE_LABEL, kind: "certifier" },
    ],
  },
  {
    slug: "meliora-laundry-powder",
    brand: "Meliora",
    product: "Laundry Powder Detergent, 128 loads",
    category: "Cleaning",
    replaces: "Liquid laundry detergent in plastic jugs",
    price: "$20.99",
    priceNote: "A refill bag was $16.99.",
    checkedOn: CHECKED_ON,
    url: MELIORA,
    materials:
      "Baking soda, washing soda and a vegetable soap made from coconut oil. It comes in a paper-and-steel canister with a stainless steel scoop.",
    brandClaims: [
      "Plastic-free, preservative-free and concentrated.",
      "MADE SAFE Certified.",
      "Leaping Bunny certified and vegan.",
      "A member of 1% for the Planet.",
    ],
    confirmed: [
      {
        text: "The MADE SAFE index lists this laundry powder as certified.",
        sourceUrl: MADE_SAFE_MELIORA,
      },
      {
        text: "The company is a certified B Corp, certified since May 2015.",
        sourceUrl: bCorp("meliora-cleaning-products"),
      },
    ],
    notProven: [
      {
        text: "Leaping Bunny and 1% for the Planet are the brand's claims. Those directories did not load for us, so we could not confirm them.",
        sourceUrl: MELIORA_SUSTAINABILITY,
      },
      { text: "The page cites no stain-removal test.", sourceUrl: MELIORA },
      {
        text: "The scented versions list fragrance allergens. The brand says to put the powder in the drum, not the drawer.",
        sourceUrl: MELIORA,
      },
    ],
    endOfLife:
      "The canister can be reused. To recycle it, the brand says to separate the paper from the steel. The refill comes in a kraft paper bag.",
    sources: [
      { label: "Meliora product page", url: MELIORA, kind: "brand" },
      {
        label: "Meliora refill page",
        url: "https://meliorameansbetter.com/products/laundry-powder-detergent-refill",
        kind: "brand",
      },
      { label: "Meliora sustainability page", url: MELIORA_SUSTAINABILITY, kind: "brand" },
      { label: "MADE SAFE product index", url: MADE_SAFE_MELIORA, kind: "certifier" },
      {
        label: "B Lab directory listing",
        url: bCorp("meliora-cleaning-products"),
        kind: "certifier",
      },
    ],
  },
  {
    slug: "dropps-laundry-pods",
    brand: "Dropps",
    product: "Laundry Pods, 64 count",
    category: "Cleaning",
    replaces: "Liquid laundry detergent in plastic jugs",
    price: "$28.89",
    checkedOn: CHECKED_ON,
    url: DROPPS,
    materials:
      "Single-use detergent pods in a water-soluble film of polyvinyl alcohol (PVA), packed in a paperboard box.",
    brandClaims: [
      "The film dissolves and biodegrades. The brand cites a lab test for ready biodegradability (OECD 301).",
      "The box can go in curbside recycling.",
      "Shipping is carbon neutral through a partner named Clearloop.",
      "Leaping Bunny, Cradle to Cradle Material Health and USDA Certified Biobased.",
    ],
    confirmed: [
      {
        text: "The company is a certified B Corp, listed as Dropps, PBC, certified since December 2022.",
        sourceUrl: bCorp("dropps"),
      },
    ],
    notProven: [
      {
        text: "These are single-use pods. They replace a plastic jug, not the product inside it.",
      },
      {
        text: "A 2021 model-based estimate for the US (Rolsky and Kelkar) says about 77% of PVA from pods stays intact after conventional wastewater treatment. The brand's lab test points the other way. Neither is a direct test of this brand's film, so its fate after the wash is disputed.",
        sourceUrl: PVA_STUDY,
      },
      {
        text: "An industry-funded critique of that study exists. We did not read it or weigh it here.",
      },
      {
        text: "Leaping Bunny, Cradle to Cradle Material Health and USDA Biobased are the brand's claims. We could not confirm them in those directories.",
        sourceUrl: DROPPS,
      },
      {
        text: "We did not find the pods in EPA's Safer Choice product list on the day we checked. The product page does not claim that they are in it.",
        sourceUrl: SAFER_CHOICE,
      },
    ],
    endOfLife:
      "The brand says the box can go in curbside recycling. The film dissolves in the wash; what happens to it after that is disputed.",
    sources: [
      { label: "Dropps product page", url: DROPPS, kind: "brand" },
      { label: "B Lab directory listing", url: bCorp("dropps"), kind: "certifier" },
      { label: "EPA Safer Choice product search", url: SAFER_CHOICE, kind: "certifier" },
      {
        label: "Rolsky and Kelkar (2021), Int J Environ Res Public Health 18(11):6027",
        url: PVA_STUDY,
        kind: "study",
      },
    ],
  },
  {
    slug: "klean-kanteen-classic-18oz",
    brand: "Klean Kanteen",
    product: "18oz Classic with Sport Cap",
    category: "Takeout and delivery",
    replaces: "Single-use plastic water bottles",
    price: "$19.95",
    priceNote: "Shown as a sale price.",
    checkedOn: CHECKED_ON,
    url: KLEAN,
    materials:
      "Single-wall 18/8 stainless steel that the brand says is 90% post-consumer recycled. The Sport Cap is plastic with a silicone spout. The bottle is not insulated.",
    brandClaims: [
      "The steel is 90% post-consumer recycled, certified by the test firm Intertek.",
      "The move to recycled steel cut the emissions from raw materials.",
      "Free of BPA, BPS, BPF and lead.",
      "A lifetime limited warranty.",
    ],
    confirmed: [
      {
        text: "The company is a certified B Corp, certified since September 2012.",
        sourceUrl: bCorp("klean-kanteen"),
      },
      {
        text: "The Climate Label directory lists Klean Kanteen as currently certified.",
        sourceUrl: CLIMATE_LABEL,
      },
    ],
    notProven: [
      {
        text: "The recycled-content certificate is the brand's claim. We could not confirm it in an Intertek listing.",
        sourceUrl: KLEAN_STEEL,
      },
      {
        text: "The emissions saving from recycled steel is the brand's own calculation. Its method was not on the page.",
        sourceUrl: KLEAN_STEEL,
      },
      { text: "The cap is plastic, and the bottle does not keep drinks hot or cold.", sourceUrl: KLEAN },
    ],
    endOfLife: "Not stated on the pages we read.",
    sources: [
      { label: "Klean Kanteen product page", url: KLEAN, kind: "brand" },
      { label: "Klean Kanteen recycled steel page", url: KLEAN_STEEL, kind: "brand" },
      { label: "B Lab directory listing", url: bCorp("klean-kanteen"), kind: "certifier" },
      { label: "The Climate Label certified brands", url: CLIMATE_LABEL, kind: "certifier" },
    ],
  },
  {
    slug: "keepcup-original-clear",
    brand: "KeepCup",
    product: "Original Clear",
    category: "Coffee and tea",
    replaces: "Single-use paper coffee cups",
    price: "$21.00",
    priceNote: "The 12 oz size. The 16 oz size was $22.00.",
    checkedOn: CHECKED_ON,
    url: KEEPCUP,
    materials:
      "A plastic cup, lid and plug with a silicone band. The product page disagrees with itself: one line says polypropylene and another says Tritan. It says the cup is made with recycled materials and gives no percentage.",
    brandClaims: [
      "The cup has a positive impact after 24 uses.",
      "The company is a B Corp and a member of 1% for the Planet.",
    ],
    confirmed: [
      {
        text: "The company is a certified B Corp, certified since August 2014.",
        sourceUrl: bCorp("keepcup"),
      },
      {
        text: "A life cycle study that the brand paid for (Edge Environment, December 2023) is public. It reports that with one coffee a day, a KeepCup has a lower climate impact than paper cups after 24 days, and than compostable cups after 10 days.",
        sourceUrl: KEEPCUP_LCA,
      },
    ],
    notProven: [
      {
        text: "The 24-day figure is a climate result under the study's assumptions. It is not a figure for every environmental impact, and how you wash the cup changes it.",
        sourceUrl: KEEPCUP_IMPACT,
      },
      {
        text: "The report itself suggests an outside critical review before its results are used in public comparisons.",
        sourceUrl: KEEPCUP_LCA,
      },
      {
        text: "The brand says it has not yet found a recycling route for the silicone bands it collects.",
        sourceUrl: KEEPCUP_IMPACT,
      },
      {
        text: "Membership of 1% for the Planet is the brand's claim. That directory did not load for us, so we could not confirm it.",
      },
    ],
    endOfLife:
      "The brand says broken plastic parts are recycled by local processors in the UK and Australia. It states no route for the US.",
    sources: [
      { label: "KeepCup product page", url: KEEPCUP, kind: "brand" },
      { label: "KeepCup impact page", url: KEEPCUP_IMPACT, kind: "brand" },
      { label: "B Lab directory listing", url: bCorp("keepcup"), kind: "certifier" },
      {
        label: "Edge Environment, KeepCup LCA Report v7 (2023, paid for by the brand)",
        url: KEEPCUP_LCA,
        kind: "study",
      },
    ],
  },
  {
    slug: "to-go-ware-bamboo-utensil-set",
    brand: "To-Go Ware",
    product: "Bamboo Utensil Set",
    category: "Takeout and delivery",
    replaces: "Single-use plastic cutlery",
    price: "$15.99",
    priceNote: "Sold through ChicoBag's shop, which now hosts To-Go Ware.",
    checkedOn: CHECKED_ON,
    url: TO_GO_WARE,
    materials:
      "A bamboo fork, knife, spoon, chopsticks and straw with a food-safe coating; the page does not say what the coating is made of. The case is a fabric the brand says is made from recycled bottles.",
    brandClaims: [
      "One set replaces up to 1,300 single-use plastic utensils over its life.",
      "A five-year warranty.",
      "The case fabric is certified to the Global Recycled Standard.",
      "The company is a B Corp, climate neutral, and a member of 1% for the Planet.",
    ],
    confirmed: [
      {
        text: "The company is a certified B Corp, listed as ChicoBag & To-Go Ware.",
        sourceUrl: bCorp("chicobag-company"),
      },
      {
        text: "The Climate Label directory lists To-Go Ware as currently certified.",
        sourceUrl: CLIMATE_LABEL,
      },
    ],
    notProven: [
      {
        text: "The 1,300-utensil figure has no basis on the page.",
        sourceUrl: TO_GO_WARE,
      },
      {
        text: "1% for the Planet membership and the recycled-fabric certificate are the brand's claims. We could not confirm them.",
      },
      {
        text: "The page calls the bamboo sustainably sourced and names no certificate.",
        sourceUrl: TO_GO_WARE,
      },
      {
        text: "The page makes no compost claim for the utensils, so we make none.",
        sourceUrl: TO_GO_WARE,
      },
    ],
    endOfLife:
      "The brand runs a take-back program for worn products. The page does not say the utensils can be composted.",
    sources: [
      { label: "To-Go Ware product page at ChicoBag", url: TO_GO_WARE, kind: "brand" },
      { label: "B Lab directory listing", url: bCorp("chicobag-company"), kind: "certifier" },
      { label: "The Climate Label certified brands", url: CLIMATE_LABEL, kind: "certifier" },
    ],
  },
]
