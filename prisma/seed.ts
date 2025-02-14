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

  console.log('Database has been seeded with eco-friendly products. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
