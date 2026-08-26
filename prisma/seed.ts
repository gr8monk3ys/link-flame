import { PrismaClient } from '@prisma/client';
import { brands } from './seed-data/brands';
import { productValues, productValueAssignments } from './seed-data/product-values';
import { certifications } from './seed-data/certifications';
import { productSustainabilityData } from './seed-data/product-sustainability';
import { products } from './seed-data/products';
import { quizQuestions } from './seed-data/quiz-questions';
import { impactMetrics, productImpactData } from './seed-data/impact-metrics';

const prisma = new PrismaClient();

async function main() {
  // Clear existing brands
  await prisma.brand.deleteMany();
  console.log('Cleared existing brands');

  // Seed brands. Ids are kept so products can be attached below — without a
  // brandId every partner card renders "0 products" and links to an empty
  // brand page.
  const createdBrandIds: string[] = [];
  for (const brand of brands) {
    const created = await prisma.brand.create({
      data: brand,
    });
    createdBrandIds.push(created.id);
  }
  console.log('Created partner brands');

  // Clear existing data (respect foreign key constraints)
  await prisma.quizResponse.deleteMany();
  await prisma.bundleSelection.deleteMany();
  await prisma.bundleProduct.deleteMany();
  await prisma.bundle.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.savedItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productCertification.deleteMany();
  await prisma.productValueAssignment.deleteMany();
  await prisma.productValue.deleteMany();
  await prisma.sustainabilityCertification.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  // Create sustainability certifications
  const createdCertifications: Record<string, string> = {};
  for (const cert of certifications) {
    const created = await prisma.sustainabilityCertification.create({
      data: cert,
    });
    createdCertifications[cert.name] = created.id;
  }
  console.log('Created sustainability certifications');

  // Create product values for "Shop by Values" filtering
  const createdValues: Record<string, string> = {};
  for (const value of productValues) {
    const created = await prisma.productValue.create({
      data: value,
    });
    createdValues[value.slug] = created.id;
  }
  console.log('Created product values for Shop by Values');

  // Create products with sustainability fields
  const createdProducts: Record<string, string> = {};
  for (const [productIndex, product] of products.entries()) {
    const sustainabilityData = productSustainabilityData[product.title] || {
      isPlasticFree: false,
      isVegan: false,
      isCrueltyFree: false,
      isOrganicCertified: false,
      carbonFootprintGrams: null,
      certificationNames: [],
    };

    const created = await prisma.product.create({
      data: {
        ...product,
        // Round-robin rather than random so reseeding is reproducible.
        brandId: createdBrandIds.length
          ? createdBrandIds[productIndex % createdBrandIds.length]
          : undefined,
        inventory: Math.floor(Math.random() * 50) + 10, // Random inventory between 10-59
        isPlasticFree: sustainabilityData.isPlasticFree,
        isVegan: sustainabilityData.isVegan,
        isCrueltyFree: sustainabilityData.isCrueltyFree,
        isOrganicCertified: sustainabilityData.isOrganicCertified,
        carbonFootprintGrams: sustainabilityData.carbonFootprintGrams,
      },
    });
    createdProducts[product.title] = created.id;
  }
  console.log('Created products with sustainability data');

  // Link products to certifications
  for (const [productTitle, sustainabilityData] of Object.entries(productSustainabilityData)) {
    const productId = createdProducts[productTitle];
    if (!productId) continue;

    for (const certName of sustainabilityData.certificationNames) {
      const certId = createdCertifications[certName];
      if (!certId) continue;

      await prisma.productCertification.create({
        data: {
          productId,
          certificationId: certId,
        },
      });
    }
  }
  console.log('Linked products to certifications');

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

  const author2 = await prisma.author.create({
    data: {
      name: 'Emma Green',
      image: '/images/authors/emma.jpg',
      role: 'Sustainability Expert',
    },
  });

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
      content: `We're excited to launch our eco-friendly living platform! Here you'll find practical guides, product reviews, and tips for sustainable living.

# What We Offer

- In-depth sustainability guides
- Honest product reviews
- Community-driven insights
- Expert advice from environmental professionals

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

- Reduces landfill waste by up to 30%
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

By making these switches, the average person can eliminate hundreds of pieces of plastic waste per year!`,
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

  const createdMetricIds: Record<string, string> = {};
  for (const metric of impactMetrics) {
    const created = await prisma.impactMetric.create({
      data: metric,
    });
    createdMetricIds[metric.slug] = created.id;
  }
  console.log('Created impact metrics');

  // Link products to their environmental impacts
  for (const [productTitle, impacts] of Object.entries(productImpactData)) {
    const productId = createdProducts[productTitle];
    if (!productId) continue;

    for (const [metricSlug, value] of Object.entries(impacts)) {
      const metricId = createdMetricIds[metricSlug];
      if (!metricId || value <= 0) continue;

      await prisma.productImpact.create({
        data: {
          productId,
          metricId,
          valuePerUnit: value,
        },
      });
    }
  }
  console.log('Linked products to environmental impacts');

  // Bundles: the /bundles page is linked from the main nav, so it must not
  // ship empty. Titles reference createdProducts keys - update both together.
  const bundles = [
    {
      slug: 'zero-waste-kitchen-starter',
      title: 'Zero-Waste Kitchen Starter',
      description:
        'The four swaps that clear the most plastic out of a kitchen: wraps instead of cling film, mesh bags instead of produce bags, bamboo cutlery for lunches out, and glass storage that outlives any takeaway tub.',
      image: 'https://images.unsplash.com/photo-1686820740642-5a1fcd0300a9?w=1200&q=80',
      category: 'Kitchen',
      discountPercent: 15,
      isCustomizable: false,
      productTitles: [
        'Beeswax Food Wraps',
        'Reusable Produce Bags - Set of 5',
        'Bamboo Cutlery Set',
        'Glass Food Storage Set',
      ],
    },
    {
      slug: 'plastic-free-bathroom',
      title: 'Plastic-Free Bathroom',
      description:
        'Everything on the sink, minus the plastic: bamboo toothbrushes for the family, a matching bathroom set, and loofah sponges that compost when they wear out.',
      image: 'https://images.unsplash.com/photo-1589365252845-092198ba5334?w=1200&q=80',
      category: 'Bathroom',
      discountPercent: 12,
      isCustomizable: false,
      productTitles: [
        'Bamboo Toothbrush Set',
        'Bamboo Bathroom Set',
        'Natural Loofah Sponge - 3 Pack',
      ],
    },
    {
      slug: 'build-your-own-starter-kit',
      title: 'Build Your Own Starter Kit',
      description:
        'Pick any three to six swaps and save on the lot. Start with the disposables you throw away most often.',
      image: 'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?w=1200&q=80',
      category: 'Starter',
      discountPercent: 10,
      isCustomizable: true,
      minItems: 3,
      maxItems: 6,
      productTitles: Object.keys(createdProducts),
    },
  ];

  for (const bundle of bundles) {
    const { productTitles, ...bundleData } = bundle;
    const created = await prisma.bundle.create({ data: bundleData });
    for (const [sortOrder, title] of productTitles.entries()) {
      const productId = createdProducts[title];
      if (!productId) continue;
      await prisma.bundleProduct.create({
        data: {
          bundleId: created.id,
          productId,
          isRequired: !bundle.isCustomizable,
          isDefault: !bundle.isCustomizable,
          sortOrder,
        },
      });
    }
  }
  console.log('Created product bundles');

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
