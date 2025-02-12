import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample products
  const products = [
    {
      title: 'Toothpaste Tablets w/ Fluoride',
      description: 'Zero waste toothpaste tablets with fluoride for healthy teeth',
      price: 8.99,
      image: '/products/toothpaste-1.jpg',
      category: 'toothpaste',
    },
    {
      title: 'Dishwasher Detergent Pods',
      description: 'Eco-friendly dishwasher pods that are tough on grease',
      price: 14.99,
      image: '/products/dishwasher-1.jpg',
      category: 'dishwasher',
    },
    {
      title: 'Bamboo Cotton Buds',
      description: 'Sustainable bamboo cotton buds, plastic-free',
      price: 7.99,
      image: '/products/cotton-buds-1.jpg',
      category: 'personal-care',
    },
    {
      title: 'Laundry Detergent Sheets',
      description: 'Ultra-concentrated laundry detergent sheets',
      price: 12.99,
      image: '/products/laundry-1.jpg',
      category: 'laundry',
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

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
