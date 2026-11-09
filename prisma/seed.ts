import { PrismaClient } from '@prisma/client';
import { productValues, productValueAssignments } from './seed-data/product-values';
import { launchProducts, productData, variantData } from './seed-data/launch-catalogue';
import { quizQuestions } from './seed-data/quiz-questions';
import { impactMetrics } from './seed-data/impact-metrics';

const prisma = new PrismaClient();

/**
 * Development and CI seed. Destructive: it clears the catalogue, orders'
 * line items and blog data before recreating them. Never run it against
 * production; use `npm run catalogue:apply` there instead.
 */
async function main() {
  // Clear existing data (respect foreign key constraints)
  await prisma.quizResponse.deleteMany();
  await prisma.bundleSelection.deleteMany();
  await prisma.bundleProduct.deleteMany();
  await prisma.bundle.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.digitalDownload.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.savedItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productCertification.deleteMany();
  await prisma.productValueAssignment.deleteMany();
  await prisma.productValue.deleteMany();
  await prisma.sustainabilityCertification.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.digitalAsset.deleteMany();
  await prisma.product.deleteMany();
  // Link Flame sells only its own products: no partner brands.
  await prisma.brand.deleteMany();

  // Create product values for "Shop by Values" filtering
  const createdValues: Record<string, string> = {};
  for (const value of productValues) {
    const created = await prisma.productValue.create({
      data: value,
    });
    createdValues[value.slug] = created.id;
  }
  console.log('Created product values for Shop by Values');

  // The launch catalogue. Guide PDFs are not in this repo; without them a
  // test purchase gets no download links (load them with
  // `npm run catalogue:upload-assets`).
  const createdProducts: Record<string, string> = {};
  for (const product of launchProducts) {
    const created = await prisma.product.create({
      data: {
        ...productData(product),
        ...(product.variants?.length
          ? {
              variants: {
                create: product.variants.map((variant, index) => variantData(variant, index)),
              },
            }
          : {}),
      },
    });
    createdProducts[product.title] = created.id;
  }
  console.log(`Created ${launchProducts.length} launch products`);

  // Assign product values for "Shop by Values" filtering
  for (const [productTitle, valueSlugs] of Object.entries(productValueAssignments)) {
    const productId = createdProducts[productTitle];
    if (!productId) continue;

    for (const slug of valueSlugs) {
      const valueId = createdValues[slug];
      if (!valueId) continue;

      await prisma.productValueAssignment.create({
        data: {
          productId,
          valueId,
        },
      });
    }
  }
  console.log('Assigned product values for Shop by Values');

  // Clear existing blog data
  await prisma.blogPost.deleteMany();
  await prisma.author.deleteMany();
  await prisma.category.deleteMany();

  // Create blog authors
  const author1 = await prisma.author.create({
    data: {
      name: 'Team Link Flame',
      image: '/images/team/default-avatar.jpg',
      role: 'Editorial Team',
    },
  });

  // One real byline; the blog has no outside contributors.
  const author2 = author1;

  // Create blog categories
  const catUpdates = await prisma.category.create({
    data: { name: 'Updates' },
  });

  const catGuides = await prisma.category.create({
    data: { name: 'Guides' },
  });

  const catGreenHome = await prisma.category.create({
    data: { name: 'Green Home' },
  });

  const catZeroWaste = await prisma.category.create({
    data: { name: 'Zero Waste' },
  });

  // Create blog posts
  await prisma.blogPost.create({
    data: {
      slug: 'welcome',
      title: 'Welcome to Our Blog',
      description: 'Learn about our latest updates and features',
      coverImage: '/images/blogs/default-hero.jpg',
      publishedAt: new Date(),
      authorId: author1.id,
      categoryId: catUpdates.id,
      tags: 'welcome,news',
      featured: true,
      readingTime: '3 min read',
      content: `Link Flame publishes practical guides for wasting less at home, and sells a few things of its own to keep the lights on.

# What We Offer

- Practical guides to changing one habit at a time
- Honest notes on what each swap costs and when to skip it
- Printable worksheets for measuring your own household

Stay tuned for more content coming soon!`,
    },
  });

  await prisma.blogPost.create({
    data: {
      slug: 'getting-started',
      title: 'Getting Started with Sustainable Living',
      description: 'A beginner\'s guide to reducing your environmental impact',
      coverImage: 'https://images.unsplash.com/photo-1582138079863-ec3e671f59d7?w=1200&q=80',
      publishedAt: new Date(Date.now() - 86400000), // Yesterday
      authorId: author2.id,
      categoryId: catGuides.id,
      tags: 'guide,tutorial,beginners',
      featured: false,
      readingTime: '5 min read',
      content: `Making the switch to sustainable living doesn't have to be overwhelming. Here are simple steps you can take today:

# 1. Start Small
Begin with one area of your life. Maybe it's reducing plastic in your kitchen or switching to reusable shopping bags.

# 2. Educate Yourself
Learn about the environmental impact of your daily choices.

# 3. Find Alternatives
Research eco-friendly alternatives to products you use daily.

# 4. Join the Community
Connect with others on the same journey for support and ideas.

Remember: Every small change makes a difference!`,
    },
  });

  await prisma.blogPost.create({
    data: {
      slug: 'ultimate-guide-to-composting',
      title: 'Ultimate Guide to Composting',
      description: 'Learn everything you need to know about starting and maintaining a successful compost system',
      coverImage: 'https://images.unsplash.com/photo-1716903282677-3a1b5c936b41?w=1200&q=80',
      publishedAt: new Date(Date.now() - 172800000), // 2 days ago
      authorId: author2.id,
      categoryId: catGreenHome.id,
      tags: 'composting,gardening,zero-waste',
      featured: true,
      readingTime: '8 min read',
      content: `Composting is one of the most impactful ways to reduce waste and nourish your garden.

# Why Compost?

- Keeps food scraps and yard waste out of the landfill
- Creates nutrient-rich soil for your garden
- Reduces methane emissions
- Saves money on fertilizer

# Getting Started

## What You Need
- A compost bin or designated area
- Brown materials (carbon-rich)
- Green materials (nitrogen-rich)
- Water and air

## The Perfect Mix
Aim for a 3:1 ratio of brown to green materials.

**Brown materials:** Dry leaves, newspaper, cardboard, wood chips

**Green materials:** Food scraps, grass clippings, coffee grounds

# Maintenance Tips

1. Turn your compost weekly
2. Keep it moist but not soggy
3. Maintain proper airflow
4. Monitor temperature

Ready to start? Your garden will thank you!`,
    },
  });

  await prisma.blogPost.create({
    data: {
      slug: 'zero-waste-bathroom-swaps',
      title: '10 Easy Swaps for a Zero-Waste Bathroom',
      description: 'Simple switches to reduce waste in your daily bathroom routine',
      coverImage: 'https://images.unsplash.com/photo-1777446523856-e7acffa844a7?w=1200&q=80',
      publishedAt: new Date(Date.now() - 259200000), // 3 days ago
      authorId: author2.id,
      categoryId: catZeroWaste.id,
      tags: 'zero-waste,bathroom,sustainable-living',
      featured: false,
      readingTime: '6 min read',
      content: `Your bathroom is one of the easiest places to start reducing waste.

# The Swaps

## 1. Bamboo Toothbrush
Replace plastic toothbrushes with biodegradable bamboo alternatives.

## 2. Bar Soap & Shampoo
Ditch the plastic bottles for package-free bars.

## 3. Reusable Cotton Rounds
Switch from disposable cotton pads to washable rounds.

## 4. Safety Razor
Replace disposable razors with a durable safety razor.

## 5. Refillable Containers
Buy products in bulk and use refillable containers.

# The Impact

Make each switch when the old item runs out, not all at once: the greenest product is usually the one you already own.`,
    },
  });

  console.log('Seeded blog posts');

  // Seed Quiz Questions
  await prisma.quizQuestion.deleteMany();

  for (const question of quizQuestions) {
    await prisma.quizQuestion.create({
      data: question,
    });
  }

  console.log('Seeded quiz questions');

  // Seed Environmental Impact Metrics
  console.log('Seeding impact metrics...');

  // Clear existing impact data
  await prisma.orderImpact.deleteMany();
  await prisma.userImpact.deleteMany();
  await prisma.productImpact.deleteMany();
  await prisma.impactMetric.deleteMany();

  for (const metric of impactMetrics) {
    await prisma.impactMetric.create({
      data: metric,
    });
  }
  console.log('Created impact metrics');

  // No product carries a measured impact yet, so none is linked: the
  // homepage impact band and per-order impact stay hidden until real
  // measurements exist.


  console.log('Database has been seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
