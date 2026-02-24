export const BRAND_CERTIFICATIONS = [
  {
    slug: "b-corp",
    name: "B Corp Certified",
    description: "Meets highest standards of social and environmental performance",
  },
  {
    slug: "1-percent-planet",
    name: "1% for the Planet",
    description: "Donates 1% of sales to environmental causes",
  },
  {
    slug: "fair-trade",
    name: "Fair Trade Certified",
    description: "Ensures fair wages and safe working conditions",
  },
  {
    slug: "climate-neutral",
    name: "Climate Neutral Certified",
    description: "Carbon emissions measured and offset",
  },
  {
    slug: "leaping-bunny",
    name: "Leaping Bunny",
    description: "Cruelty-free certification",
  },
  {
    slug: "usda-organic",
    name: "USDA Organic",
    description: "Certified organic by USDA",
  },
  {
    slug: "ewg-verified",
    name: "EWG Verified",
    description: "Meets Environmental Working Group standards",
  },
  {
    slug: "made-safe",
    name: "MADE SAFE",
    description: "Free of known toxic ingredients",
  },
] as const

export const BRAND_VALUES = [
  {
    slug: "women-owned",
    name: "Women-Owned",
    description: "Business owned by women",
  },
  {
    slug: "bipoc-owned",
    name: "BIPOC-Owned",
    description: "Business owned by Black, Indigenous, or People of Color",
  },
  {
    slug: "family-owned",
    name: "Family-Owned",
    description: "Family-owned business",
  },
  {
    slug: "small-batch",
    name: "Small Batch",
    description: "Products made in small batches",
  },
  {
    slug: "made-in-usa",
    name: "Made in USA",
    description: "Products manufactured in the United States",
  },
  {
    slug: "plastic-free",
    name: "Plastic-Free",
    description: "Committed to plastic-free products and packaging",
  },
  {
    slug: "zero-waste",
    name: "Zero Waste",
    description: "Working towards zero waste operations",
  },
  {
    slug: "carbon-negative",
    name: "Carbon Negative",
    description: "Removes more carbon than it produces",
  },
  {
    slug: "regenerative",
    name: "Regenerative",
    description: "Uses regenerative agriculture practices",
  },
  {
    slug: "vegan",
    name: "Vegan",
    description: "All products are 100% vegan",
  },
] as const

export type BrandCertification = (typeof BRAND_CERTIFICATIONS)[number]
export type BrandValue = (typeof BRAND_VALUES)[number]
