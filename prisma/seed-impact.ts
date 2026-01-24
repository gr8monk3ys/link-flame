/**
 * Seed script for Environmental Impact Metrics and Product Impacts
 *
 * Run with: npx tsx prisma/seed-impact.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Environmental Impact Metrics to seed
const impactMetrics = [
  {
    name: "Plastic Bottles Saved",
    slug: "plastic-bottles-saved",
    unit: "bottles",
    iconName: "bottle",
    description:
      "Number of single-use plastic bottles avoided by choosing reusable alternatives",
    comparison:
      "That's {value} weeks of single-use plastic avoided!",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Single-Use Items Replaced",
    slug: "single-use-items-replaced",
    unit: "items",
    iconName: "recycle",
    description:
      "Disposable items replaced by reusable eco-friendly alternatives",
    comparison: "Equivalent to {value} months of disposable items!",
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Carbon Offset",
    slug: "carbon-offset",
    unit: "kg CO2",
    iconName: "leaf",
    description:
      "Kilograms of CO2 offset through sustainable product choices",
    comparison: "Like planting {value} trees for a year!",
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Trees Planted",
    slug: "trees-planted",
    unit: "trees",
    iconName: "tree",
    description:
      "Trees planted through our partnership with reforestation organizations",
    comparison: "{value} kg of CO2 absorbed per year!",
    sortOrder: 4,
    isActive: true,
  },
  {
    name: "Water Saved",
    slug: "water-saved",
    unit: "liters",
    iconName: "droplet",
    description:
      "Liters of water saved by choosing products with lower water footprints",
    comparison: "That's {value} showers worth of water!",
    sortOrder: 5,
    isActive: true,
  },
  {
    name: "Waste Diverted",
    slug: "waste-diverted",
    unit: "kg",
    iconName: "trash",
    description:
      "Kilograms of waste diverted from landfills through reusable products",
    comparison: "{value} pounds kept out of landfills!",
    sortOrder: 6,
    isActive: true,
  },
];

// Map of product titles to their environmental impact values per unit
// Each entry maps a metric slug to the impact value per single product purchase
const productImpactData: Record<
  string,
  Record<string, number>
> = {
  "Bamboo Water Bottle": {
    "plastic-bottles-saved": 365, // Replaces 365 plastic bottles per year
    "single-use-items-replaced": 365,
    "carbon-offset": 2.5, // kg CO2
    "waste-diverted": 0.5, // kg
  },
  "Reusable Produce Bags - Set of 5": {
    "plastic-bottles-saved": 0,
    "single-use-items-replaced": 500, // 100 uses per bag
    "carbon-offset": 1.0,
    "waste-diverted": 0.3,
  },
  "Bamboo Cutlery Set": {
    "plastic-bottles-saved": 0,
    "single-use-items-replaced": 200,
    "carbon-offset": 1.5,
    "waste-diverted": 0.2,
  },
  "Natural Loofah Sponge - 3 Pack": {
    "plastic-bottles-saved": 0,
    "single-use-items-replaced": 36, // 12 per sponge
    "carbon-offset": 0.5,
    "waste-diverted": 0.1,
  },
  "Beeswax Food Wraps": {
    "plastic-bottles-saved": 0,
    "single-use-items-replaced": 300, // Replaces plastic wrap
    "carbon-offset": 1.0,
    "waste-diverted": 0.2,
  },
  "Bamboo Toothbrush Set": {
    "plastic-bottles-saved": 0,
    "single-use-items-replaced": 4, // 4 toothbrushes
    "carbon-offset": 0.3,
    "waste-diverted": 0.05,
  },
  "Stainless Steel Lunch Container": {
    "plastic-bottles-saved": 0,
    "single-use-items-replaced": 250,
    "carbon-offset": 2.0,
    "waste-diverted": 0.4,
  },
  "Wool Dryer Balls - Set of 6": {
    "plastic-bottles-saved": 0,
    "single-use-items-replaced": 1000, // Replaces dryer sheets
    "carbon-offset": 1.0,
    "waste-diverted": 0.3,
  },
  "Bamboo Bathroom Set": {
    "plastic-bottles-saved": 3, // Replaces plastic bathroom items
    "single-use-items-replaced": 10,
    "carbon-offset": 0.8,
    "waste-diverted": 0.2,
  },
  "Reusable Coffee Filter": {
    "plastic-bottles-saved": 0,
    "single-use-items-replaced": 500,
    "carbon-offset": 0.5,
    "water-saved": 100,
    "waste-diverted": 0.2,
  },
  "Natural Cleaning Kit": {
    "plastic-bottles-saved": 10,
    "single-use-items-replaced": 20,
    "carbon-offset": 1.5,
    "water-saved": 50,
    "waste-diverted": 0.3,
  },
  "Bamboo Dish Brush": {
    "plastic-bottles-saved": 0,
    "single-use-items-replaced": 12,
    "carbon-offset": 0.2,
    "waste-diverted": 0.05,
  },
  "Organic Cotton Napkins - Set of 8": {
    "plastic-bottles-saved": 0,
    "single-use-items-replaced": 1000,
    "carbon-offset": 0.8,
    "water-saved": 200,
    "waste-diverted": 0.4,
  },
  "Compost Bin with Charcoal Filter": {
    "plastic-bottles-saved": 0,
    "single-use-items-replaced": 0,
    "carbon-offset": 50, // Significant composting impact
    "waste-diverted": 100, // kg of food waste composted per year
  },
  "Glass Food Storage Set": {
    "plastic-bottles-saved": 0,
    "single-use-items-replaced": 500,
    "carbon-offset": 2.0,
    "waste-diverted": 0.5,
  },
};

async function seedImpactMetrics() {
  console.log("Seeding impact metrics...");

  // Clear existing impact data
  await prisma.orderImpact.deleteMany();
  await prisma.userImpact.deleteMany();
  await prisma.productImpact.deleteMany();
  await prisma.impactMetric.deleteMany();

  // Create impact metrics
  const createdMetrics: Record<string, string> = {};
  for (const metric of impactMetrics) {
    const created = await prisma.impactMetric.create({
      data: metric,
    });
    createdMetrics[metric.slug] = created.id;
    console.log(`  Created metric: ${metric.name}`);
  }

  return createdMetrics;
}

async function seedProductImpacts(metricIds: Record<string, string>) {
  console.log("\nSeeding product impacts...");

  // Get all products
  const products = await prisma.product.findMany();
  const productByTitle = new Map(products.map((p) => [p.title, p.id]));

  let impactCount = 0;
  for (const [productTitle, impacts] of Object.entries(productImpactData)) {
    const productId = productByTitle.get(productTitle);
    if (!productId) {
      console.log(`  Skipping ${productTitle} - product not found`);
      continue;
    }

    for (const [metricSlug, value] of Object.entries(impacts)) {
      const metricId = metricIds[metricSlug];
      if (!metricId) {
        console.log(`  Skipping metric ${metricSlug} - not found`);
        continue;
      }

      if (value > 0) {
        await prisma.productImpact.create({
          data: {
            productId,
            metricId,
            valuePerUnit: value,
          },
        });
        impactCount++;
      }
    }
    console.log(`  Added impacts for: ${productTitle}`);
  }

  console.log(`\nCreated ${impactCount} product impact records`);
}

async function main() {
  console.log("Starting impact data seeding...\n");

  const metricIds = await seedImpactMetrics();
  await seedProductImpacts(metricIds);

  console.log("\nImpact data seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding impact data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
