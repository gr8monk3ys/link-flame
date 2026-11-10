/**
 * The launch catalogue: Link Flame's own products only.
 *
 * - Guides are PDFs delivered by download link ("digital"). Their files are
 *   not in this public repo; load them with `npm run catalogue:upload-assets`.
 * - The tote and tee are printed per order by Printful ("printful"). Variant
 *   ids are Printful catalog variant ids (checked against the public catalog
 *   API, November 2026): Econscious EC8000 tote (product 367, Oyster) and
 *   Stanley/Stella SATU041 garment-dyed organic tee (product 1472, Stone).
 *   Both are in stock for US fulfillment; the tee is not offered for Canada,
 *   so checkout ships to the US only.
 *
 * Used by prisma/seed.ts (dev, CI) and prisma/apply-launch-catalogue.ts
 * (production, non-destructive). Titles are the matching key: renaming one
 * here creates a new product on the next apply.
 */

export type LaunchFulfillment = 'digital' | 'printful';

export interface LaunchVariant {
  sku: string;
  size: string;
  color: string;
  colorCode: string;
  material: string;
  price?: number;
  printfulVariantId: number;
  isDefault?: boolean;
}

export interface LaunchProduct {
  title: string;
  subtitle: string;
  description: string;
  price: number;
  image: string;
  category: string;
  featured: boolean;
  fulfillment: LaunchFulfillment;
  printfulVariantId?: number;
  printFile?: string;
  /** Asset filenames (in the private products folder) a buyer receives. */
  assetFiles?: string[];
  variants?: LaunchVariant[];
}

/** Digital and print-on-demand stock never runs out; this keeps the
 * storefront's in-stock checks happy without tracking it. */
export const UNLIMITED_INVENTORY = 9999;

const GUIDE_FILES = {
  audit: 'link-flame-waste-audit-workbook.pdf',
  kitchen: 'link-flame-one-swap-kitchen.pdf',
  bathroom: 'link-flame-plastic-free-bathroom.pdf',
} as const;

// Printful base prices (Nov 2026): S-XL $17.60, 2XL $19.60, 3XL $21.60.
const teeSizes: Array<[size: string, printfulVariantId: number, price?: number]> = [
  ['S', 46046],
  ['M', 46053],
  ['L', 46060],
  ['XL', 46067],
  ['2XL', 46074, 40],
  ['3XL', 46081, 42],
];

export const launchProducts: LaunchProduct[] = [
  {
    title: 'The Waste Audit Workbook',
    subtitle: 'Count one week of household trash, then choose your first swap.',
    description:
      'The Waste Audit Workbook helps you find out what your household actually throws away. You make a tally mark at the moment of disposal for seven days, with no sorting through garbage. Then you add up the week, estimate a year, and rank possible swaps by how often you would use them and how easy they are.\n\nInside: a counting method that never has you handle garbage, seven printable daily tally sheets, a weekly summary, a worksheet that turns one week into a yearly estimate, a ranking worksheet that flags swaps needing many uses to pay off, a 90-day re-audit page and a one-page first-swap commitment.\n\nPDF, 23 pages, US Letter. Print the worksheets as often as your household needs.',
    price: 7,
    image: '/images/products/guide-waste-audit-workbook.png',
    category: 'Guides',
    featured: true,
    fulfillment: 'digital',
    assetFiles: [GUIDE_FILES.audit],
  },
  {
    title: 'The One-Swap Kitchen',
    subtitle: 'Four weeks, four kitchen swaps, with honest notes on each.',
    description:
      'The One-Swap Kitchen is a four-week plan that changes one thing at a time. Each week you try a single swap, such as cloth in place of paper towels, food wraps, produce bags, a dish brush or a coffee filter. Every chapter says what it costs, how many uses it needs to pay off, and when to skip it. The guide also covers composting, including apartment options, and buying in bulk without creating new waste.\n\nInside: a guide to using what you already own first, a five-question method for judging any reusable, four weekly swaps each with a "Skip it if" note, a week-by-week tracker, a pantry inventory sheet, a bulk and refill shopping list and a "what didn\'t work" page.\n\nPDF, 25 pages, US Letter.',
    price: 9,
    image: '/images/products/guide-one-swap-kitchen.png',
    category: 'Guides',
    featured: true,
    fulfillment: 'digital',
    assetFiles: [GUIDE_FILES.kitchen],
  },
  {
    title: 'The Plastic-Free Bathroom Field Guide',
    subtitle: 'Swap bathroom items one at a time, only as they run out.',
    description:
      'The Plastic-Free Bathroom Field Guide goes through the bathroom item by item: toothbrushes, floss, soap, shampoo bars, deodorant, razors, cotton rounds, toilet paper and cleaning. For each, it describes the plastic version, the alternatives, the trade-offs and what to do with the item at the end of its life. A separate chapter explains how to read terms such as biodegradable, compostable and recyclable.\n\nInside: ten item-by-item chapters, a chapter on reading packaging claims, a bathroom inventory sheet, a run-out-order planner, a swap log and a one-page summary checklist. It names no brands and makes no health claims.\n\nPDF, 32 pages, US Letter.',
    price: 9,
    image: '/images/products/guide-plastic-free-bathroom.png',
    category: 'Guides',
    featured: true,
    fulfillment: 'digital',
    assetFiles: [GUIDE_FILES.bathroom],
  },
  {
    title: 'The Swap Starter Set',
    subtitle: 'All three guides for choosing, testing and keeping swaps. Save $6.',
    description:
      'The Swap Starter Set bundles the three Link Flame guides into one purchase. Start with the Waste Audit Workbook to count what your household throws away. Use the One-Swap Kitchen to try four kitchen swaps over four weeks. Use the Plastic-Free Bathroom Field Guide to replace bathroom items as they run out.\n\nIncludes The Waste Audit Workbook, The One-Swap Kitchen and The Plastic-Free Bathroom Field Guide: three PDFs, 80 pages in all, with worksheets you can print as often as you like.',
    price: 19,
    image: '/images/products/guide-swap-starter-set.png',
    category: 'Guides',
    featured: true,
    fulfillment: 'digital',
    assetFiles: [GUIDE_FILES.audit, GUIDE_FILES.kitchen, GUIDE_FILES.bathroom],
  },
  {
    title: 'Measured, Not Promised Tote',
    subtitle: 'Organic cotton tote with a line to count the bags you refuse.',
    description:
      'A sturdy everyday tote printed with the Link Flame line "Measured, not promised." and a blank BAGS REFUSED: line you can mark up with a fabric pen.\n\nPrinted to order on the Econscious EC8000 tote in Oyster: certified organic cotton twill, 8 oz/yd², 16" x 14½" x 5", 24½" straps, rated to 30 lb. Made when you order, so it usually ships within 2–5 business days.\n\nCare: machine wash cold inside out, hang to dry.',
    price: 32,
    image: '/images/products/tote-measured-not-promised.png',
    category: 'Bags',
    featured: false,
    fulfillment: 'printful',
    printfulVariantId: 10458,
    printFile: '/print/tote-measured-not-promised.png',
  },
  {
    title: 'One Swap at a Time Tee',
    subtitle: 'Garment-dyed organic cotton tee, printed to order.',
    description:
      'A relaxed organic cotton tee printed with "One swap at a time." on the front.\n\nPrinted to order on the Stanley/Stella Creator 2.0 Vintage tee (SATU041) in Stone: 100% organic ring-spun cotton, 5.6 oz/yd², relaxed fit. It is garment-dyed, so each shirt varies slightly in colour. Made when you order, so it usually ships within 2–5 business days. Printed items cannot be returned for size, so compare against a tee you own before ordering.\n\nCare: machine wash cold inside out, hang to dry.',
    price: 38,
    image: '/images/products/tee-one-swap-at-a-time.png',
    category: 'Apparel',
    featured: false,
    fulfillment: 'printful',
    printFile: '/print/tee-one-swap-at-a-time.png',
    variants: teeSizes.map(([size, printfulVariantId, price]) => ({
      sku: `LF-TEE-NAT-${size}`,
      size,
      color: 'Stone',
      colorCode: '#d4cdb7',
      material: 'Organic cotton',
      ...(price ? { price } : {}),
      printfulVariantId,
      isDefault: size === 'M',
    })),
  },
];

/** Product data for prisma.product.create/update (without variants). */
export function productData(product: LaunchProduct) {
  return {
    title: product.title,
    subtitle: product.subtitle,
    description: product.description,
    price: product.price,
    image: product.image,
    category: product.category,
    featured: product.featured,
    fulfillment: product.fulfillment,
    printfulVariantId: product.printfulVariantId ?? null,
    printFile: product.printFile ?? null,
    hasVariants: Boolean(product.variants?.length),
    inventory: UNLIMITED_INVENTORY,
    isSubscribable: false,
    isImperfect: false,
  };
}

export function variantData(variant: LaunchVariant, sortOrder: number) {
  return {
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    colorCode: variant.colorCode,
    material: variant.material,
    price: variant.price ?? null,
    printfulVariantId: variant.printfulVariantId,
    isDefault: variant.isDefault ?? false,
    sortOrder,
    inventory: UNLIMITED_INVENTORY,
  };
}
