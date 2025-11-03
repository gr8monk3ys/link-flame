import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample products
  const products = [
    {
      title: 'Bamboo Water Bottle',
      description: 'Sustainable bamboo and stainless steel water bottle, keeps drinks cold for 24 hours and hot for 12 hours',
      price: 24.99,
      image: 'https://images.unsplash.com/photo-1587500154541-1cafd74f0efc?w=800&q=80',
      category: 'Kitchen',
    },
    {
      title: 'Reusable Produce Bags - Set of 5',
      description: 'Mesh produce bags made from recycled materials, perfect for grocery shopping',
      price: 16.99,
      image: 'https://images.unsplash.com/photo-1592685354909-beef35e9e3f9?w=800&q=80',
      category: 'Kitchen',
    },
    {
      title: 'Bamboo Cutlery Set',
      description: 'Portable bamboo utensil set including fork, knife, spoon, and chopsticks with carrying case',
      price: 19.99,
      image: 'https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?w=800&q=80',
      category: 'Kitchen',
    },
    {
      title: 'Natural Loofah Sponge - 3 Pack',
      description: 'Biodegradable natural loofah sponges for kitchen and bathroom cleaning',
      price: 12.99,
      image: 'https://images.unsplash.com/photo-1601397922721-4326ae07bbc5?w=800&q=80',
      category: 'Home',
    },
    {
      title: 'Beeswax Food Wraps',
      description: 'Reusable food wraps made with organic cotton and beeswax, alternative to plastic wrap',
      price: 22.99,
      image: 'https://images.unsplash.com/photo-1611843467160-25afb8df1074?w=800&q=80',
      category: 'Kitchen',
    },
    {
      title: 'Bamboo Toothbrush Set',
      description: 'Pack of 4 biodegradable bamboo toothbrushes with charcoal-infused bristles',
      price: 15.99,
      image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800&q=80',
      category: 'Bathroom',
    },
    {
      title: 'Stainless Steel Lunch Container',
      description: '3-compartment stainless steel lunch box with bamboo lid',
      price: 29.99,
      image: 'https://images.unsplash.com/photo-1531261261980-51c9c4caf345?w=800&q=80',
      category: 'Kitchen',
    },
    {
      title: 'Wool Dryer Balls - Set of 6',
      description: 'Natural wool dryer balls to reduce drying time and static, replace dryer sheets',
      price: 18.99,
      image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80',
      category: 'Laundry',
    },
    {
      title: 'Bamboo Bathroom Set',
      description: 'Complete bathroom set including soap dish, toothbrush holder, and dispenser',
      price: 34.99,
      image: 'https://images.unsplash.com/photo-1620821725271-d5c2c2d41a8c?w=800&q=80',
      category: 'Bathroom',
    },
    {
      title: 'Reusable Coffee Filter',
      description: 'Organic cotton reusable coffee filter, fits most pour-over coffee makers',
      price: 13.99,
      image: 'https://images.unsplash.com/photo-1606913084603-3e7702b4c7ad?w=800&q=80',
      category: 'Kitchen',
    },
    {
      title: 'Natural Cleaning Kit',
      description: 'Complete eco-friendly cleaning kit with glass spray bottles and natural cleaners',
      price: 45.99,
      image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80',
      category: 'Home',
    },
    {
      title: 'Bamboo Dish Brush',
      description: 'Biodegradable dish brush with replaceable head and bamboo handle',
      price: 9.99,
      image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80',
      category: 'Kitchen',
    },
    {
      title: 'Organic Cotton Napkins - Set of 8',
      description: 'Reusable organic cotton napkins in natural colors',
      price: 26.99,
      image: 'https://images.unsplash.com/photo-1596187200267-d3b32c96dc37?w=800&q=80',
      category: 'Kitchen',
    },
    {
      title: 'Compost Bin with Charcoal Filter',
      description: 'Stylish countertop compost bin with odor-blocking filter',
      price: 39.99,
      image: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=800&q=80',
      category: 'Kitchen',
    },
    {
      title: 'Glass Food Storage Set',
      description: '10-piece glass food storage set with bamboo lids',
      price: 49.99,
      image: 'https://images.unsplash.com/photo-1584347292821-1a10b67e6d44?w=800&q=80',
      category: 'Kitchen',
    }
  ];

  // Clear existing products
  await prisma.product.deleteMany();

  // Create products
  for (const product of products) {
    await prisma.product.create({
      data: {
        ...product,
        price: product.price,
      },
    });
  }

  console.log('✓ Seeded products');

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
      content: `# Welcome to Link Flame

We're excited to launch our eco-friendly living platform! Here you'll find practical guides, product reviews, and tips for sustainable living.

## What We Offer

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
      coverImage: '/images/blogs/default-hero.jpg',
      publishedAt: new Date(Date.now() - 86400000), // Yesterday
      authorId: author2.id,
      categoryId: catGuides.id,
      tags: 'guide,tutorial,beginners',
      featured: false,
      readingTime: '5 min read',
      content: `# Getting Started with Sustainable Living

Making the switch to sustainable living doesn't have to be overwhelming. Here are simple steps you can take today:

## 1. Start Small
Begin with one area of your life. Maybe it's reducing plastic in your kitchen or switching to reusable shopping bags.

## 2. Educate Yourself
Learn about the environmental impact of your daily choices.

## 3. Find Alternatives
Research eco-friendly alternatives to products you use daily.

## 4. Join the Community
Connect with others on the same journey for support and ideas.

Remember: Every small change makes a difference!`,
    },
  });

  await prisma.blogPost.create({
    data: {
      slug: 'ultimate-guide-to-composting',
      title: 'Ultimate Guide to Composting',
      description: 'Learn everything you need to know about starting and maintaining a successful compost system',
      coverImage: '/images/blog/composting.jpg',
      publishedAt: new Date(Date.now() - 172800000), // 2 days ago
      authorId: author2.id,
      categoryId: catGreenHome.id,
      tags: 'composting,gardening,zero-waste',
      featured: true,
      readingTime: '8 min read',
      content: `# Ultimate Guide to Composting

Composting is one of the most impactful ways to reduce waste and nourish your garden. This comprehensive guide will teach you everything you need to know.

## Why Compost?

- Reduces landfill waste by up to 30%
- Creates nutrient-rich soil for your garden
- Reduces methane emissions
- Saves money on fertilizer

## Getting Started

### What You Need
- A compost bin or designated area
- Brown materials (carbon-rich)
- Green materials (nitrogen-rich)
- Water and air

### The Perfect Mix
Aim for a 3:1 ratio of brown to green materials.

**Brown materials:** Dry leaves, newspaper, cardboard, wood chips
**Green materials:** Food scraps, grass clippings, coffee grounds

## Maintenance Tips

1. Turn your compost weekly
2. Keep it moist but not soggy
3. Maintain proper airflow
4. Monitor temperature

## Troubleshooting

**Too smelly?** Add more brown materials
**Not breaking down?** Add more green materials and water
**Attracting pests?** Bury food scraps deeper

Ready to start? Your garden will thank you!`,
    },
  });

  await prisma.blogPost.create({
    data: {
      slug: 'zero-waste-bathroom-swaps',
      title: '10 Easy Swaps for a Zero-Waste Bathroom',
      description: 'Simple switches to reduce waste in your daily bathroom routine',
      coverImage: '/images/blog/bathroom.jpg',
      publishedAt: new Date(Date.now() - 259200000), // 3 days ago
      authorId: author2.id,
      categoryId: catZeroWaste.id,
      tags: 'zero-waste,bathroom,sustainable-living',
      featured: false,
      readingTime: '6 min read',
      content: `# 10 Easy Swaps for a Zero-Waste Bathroom

Your bathroom is one of the easiest places to start reducing waste. These simple swaps make a big difference!

## The Swaps

### 1. Bamboo Toothbrush
Replace plastic toothbrushes with biodegradable bamboo alternatives.

### 2. Bar Soap & Shampoo
Ditch the plastic bottles for package-free bars.

### 3. Reusable Cotton Rounds
Switch from disposable cotton pads to washable rounds.

### 4. Safety Razor
Replace disposable razors with a durable safety razor.

### 5. Refillable Containers
Buy products in bulk and use refillable containers.

### 6. Natural Loofah
Replace plastic bath poufs with natural loofahs.

### 7. Bamboo Cotton Swabs
Choose bamboo cotton swabs over plastic ones.

### 8. Solid Deodorant
Use package-free deodorant bars or make your own.

### 9. Menstrual Cup or Reusable Pads
Consider reusable menstrual products.

### 10. DIY Products
Make your own toothpaste, deodorant, and cleaners.

## The Impact

By making these switches, the average person can eliminate hundreds of pieces of plastic waste per year!

Start with one or two swaps and gradually transition your entire bathroom.`,
    },
  });

  console.log('✓ Seeded blog posts');
  console.log('Database has been seeded. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
