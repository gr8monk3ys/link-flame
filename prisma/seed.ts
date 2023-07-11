import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Eco-friendly partner brands data
const brands = [
  {
    slug: 'grove-collaborative',
    name: 'Grove Collaborative',
    description: 'Leading the way in sustainable home essentials with plastic-free, effective products for a cleaner home and planet.',
    logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80',
    website: 'https://www.grove.co',
    story: 'Founded in 2012, Grove Collaborative started with a simple mission: make natural, sustainable products accessible to everyone. Today, we are a certified B Corporation committed to being plastic-free by 2025.\n\nOur products are designed to be effective, sustainable, and affordable. We believe that making eco-friendly choices should be easy, not a sacrifice. Every product we create is thoughtfully designed with both people and planet in mind.',
    foundedYear: 2012,
    headquarters: 'San Francisco, CA',
    certifications: JSON.stringify(['b-corp', 'climate-neutral', '1-percent-planet']),
    values: JSON.stringify(['plastic-free', 'carbon-negative', 'women-owned']),
    featured: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    slug: 'package-free-shop',
    name: 'Package Free Shop',
    description: 'Zero waste living made simple. We offer sustainable alternatives for everyday products, all without unnecessary packaging.',
    logo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&q=80',
    website: 'https://packagefreeshop.com',
    story: 'Package Free Shop was born from a simple idea: what if you could buy the products you need without all the wasteful packaging? Founded by Lauren Singer, one of the pioneers of the zero waste movement, we curate products that help you reduce your environmental footprint.\n\nFrom personal care to home goods, every item we sell is selected for its sustainability credentials. We believe small changes make a big difference.',
    foundedYear: 2017,
    headquarters: 'Brooklyn, NY',
    certifications: JSON.stringify(['b-corp', '1-percent-planet']),
    values: JSON.stringify(['zero-waste', 'plastic-free', 'women-owned', 'small-batch']),
    featured: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    slug: 'ethique-beauty',
    name: 'Ethique Beauty',
    description: 'Solid beauty bars that are good for you and the planet. Our concentrated bars save plastic and reduce carbon emissions.',
    logo: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80',
    website: 'https://ethique.com',
    story: 'Ethique was founded in New Zealand in 2012 with a radical idea: beauty products do not need to come in plastic bottles. Our solid bars are concentrated formulas that last longer and eliminate the need for plastic packaging.\n\nWe have prevented over 20 million plastic bottles from being manufactured. Every bar is handmade, cruelty-free, vegan, and palm oil-free. Join us in making beauty sustainable.',
    foundedYear: 2012,
    headquarters: 'Christchurch, New Zealand',
    certifications: JSON.stringify(['b-corp', 'leaping-bunny', 'climate-neutral']),
    values: JSON.stringify(['plastic-free', 'vegan', 'women-owned', 'carbon-negative']),
    featured: true,
    isActive: true,
    sortOrder: 3,
  },
  {
    slug: 'blueland',
    name: 'Blueland',
    description: 'Revolutionary cleaning products that eliminate single-use plastic. Just add water to our tablets for powerful, eco-friendly cleaning.',
    logo: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80',
    website: 'https://www.blueland.com',
    story: 'Blueland was founded when our CEO Sarah Paiji Yoo had her first child and discovered the shocking amount of plastic waste produced by household cleaners. She set out to create a better way.\n\nOur innovative cleaning tablets dissolve in water to create powerful cleaning solutions. By shipping dry tablets instead of pre-diluted liquids in plastic bottles, we save millions of single-use plastic containers from ending up in landfills.',
    foundedYear: 2019,
    headquarters: 'New York, NY',
    certifications: JSON.stringify(['b-corp', 'ewg-verified', 'leaping-bunny']),
    values: JSON.stringify(['plastic-free', 'women-owned', 'made-in-usa']),
    featured: true,
    isActive: true,
    sortOrder: 4,
  },
  {
    slug: 'tentree',
    name: 'Tentree',
    description: 'Sustainable apparel with a mission: 10 trees planted for every item sold. Fashion that makes a real difference.',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80',
    website: 'https://www.tentree.com',
    story: 'Tentree was born from a single question: what if every purchase could plant trees? Since 2012, we have planted over 75 million trees across the globe.\n\nOur clothing is made from sustainable materials like organic cotton, recycled polyester, and TENCEL. We believe fashion should be a force for environmental good, not destruction.',
    foundedYear: 2012,
    headquarters: 'Vancouver, Canada',
    certifications: JSON.stringify(['b-corp', 'climate-neutral', 'fair-trade']),
    values: JSON.stringify(['regenerative', 'carbon-negative', 'family-owned']),
    featured: true,
    isActive: true,
    sortOrder: 5,
  },
  {
    slug: 'earthhero',
    name: 'EarthHero',
    description: 'Your one-stop shop for sustainable living. We curate the best eco-friendly products from hundreds of conscious brands.',
    logo: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&q=80',
    website: 'https://earthhero.com',
    story: 'EarthHero was founded to make sustainable shopping easier. We vet every brand and product against strict sustainability criteria before adding them to our marketplace.\n\nFrom zero waste essentials to sustainable fashion, we have everything you need to live more sustainably. Plus, we plant a tree with every order as part of our commitment to reforestation.',
    foundedYear: 2017,
    headquarters: 'Boulder, CO',
    certifications: JSON.stringify(['b-corp', '1-percent-planet']),
    values: JSON.stringify(['small-batch', 'made-in-usa', 'plastic-free']),
    featured: true,
    isActive: true,
    sortOrder: 6,
  },
  {
    slug: 'pela-case',
    name: 'Pela Case',
    description: 'The world is first 100% compostable phone case company. Protecting your phone and the planet.',
    logo: 'https://images.unsplash.com/photo-1580910051074-3eb694886f2e?w=400&q=80',
    website: 'https://pelacase.com',
    story: 'Pela was inspired by a simple observation: why do we protect our phones with cases that will outlast us for hundreds of years? We created the first phone case that breaks down in backyard compost.\n\nOur proprietary Flaxstic material is made from plant-based materials and can fully decompose in just a few years. Since launching, we have saved millions of pounds of plastic from being produced.',
    foundedYear: 2016,
    headquarters: 'Kelowna, Canada',
    certifications: JSON.stringify(['b-corp', 'climate-neutral']),
    values: JSON.stringify(['plastic-free', 'zero-waste', 'family-owned']),
    featured: false,
    isActive: true,
    sortOrder: 7,
  },
  {
    slug: 'all-birds',
    name: 'Allbirds',
    description: 'Comfortable, sustainable footwear made from natural materials like merino wool and eucalyptus fiber.',
    logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    website: 'https://www.allbirds.com',
    story: 'Allbirds was born from a curiosity: why is wool not used in footwear? Our founders, a former professional soccer player and a renewable materials expert, set out to create the most comfortable, sustainable shoes possible.\n\nWe source merino wool from New Zealand, use eucalyptus fiber from South African tree farms, and have pioneered the use of SweetFoam made from sugarcane. Every decision we make considers our impact on the planet.',
    foundedYear: 2016,
    headquarters: 'San Francisco, CA',
    certifications: JSON.stringify(['b-corp', 'climate-neutral', 'fair-trade']),
    values: JSON.stringify(['carbon-negative', 'regenerative']),
    featured: false,
    isActive: true,
    sortOrder: 8,
  },
  {
    slug: 'by-humankind',
    name: 'By Humankind',
    description: 'Personal care products designed to eliminate single-use plastic without compromising on quality or experience.',
    logo: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80',
    website: 'https://byhumankind.com',
    story: 'By Humankind started with a simple goal: create personal care products that work just as well as conventional options but without the plastic waste.\n\nFrom refillable deodorant to plastic-free shampoo bars, we have reimagined everyday essentials. Our products are designed to be refilled and reused, dramatically reducing your bathroom plastic footprint.',
    foundedYear: 2018,
    headquarters: 'New York, NY',
    certifications: JSON.stringify(['b-corp', 'leaping-bunny']),
    values: JSON.stringify(['plastic-free', 'vegan', 'bipoc-owned']),
    featured: false,
    isActive: true,
    sortOrder: 9,
  },
  {
    slug: 'plaine-products',
    name: 'Plaine Products',
    description: 'Sustainable body care in infinitely reusable aluminum bottles. We pick up your empties and refill them.',
    logo: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
    website: 'https://www.plaineproducts.com',
    story: 'Founded by twin sisters Lindsey and Alison Delaplaine, Plaine Products operates on a simple circular model: we send you products in aluminum bottles, you use them, send back the empties, and we refill them.\n\nOur body care products are salon-quality, vegan, and cruelty-free. The closed-loop system means zero packaging waste and a truly sustainable solution for personal care.',
    foundedYear: 2017,
    headquarters: 'Sarasota, FL',
    certifications: JSON.stringify(['leaping-bunny', 'made-safe']),
    values: JSON.stringify(['women-owned', 'vegan', 'zero-waste', 'family-owned']),
    featured: false,
    isActive: true,
    sortOrder: 10,
  },
];

// Product Values for "Shop by Values" filtering
const productValues = [
  { name: 'Zero Waste', label: 'Zero Waste', slug: 'zero-waste', description: 'Products designed to eliminate waste entirely', iconName: 'trash-zero', sortOrder: 1 },
  { name: 'Plastic-Free', label: 'Plastic-Free', slug: 'plastic-free', description: 'Products made without any plastic materials', iconName: 'plastic-off', sortOrder: 2 },
  { name: 'Vegan', label: 'Vegan', slug: 'vegan', description: 'Products containing no animal-derived ingredients', iconName: 'leaf', sortOrder: 3 },
  { name: 'Cruelty-Free', label: 'Cruelty-Free', slug: 'cruelty-free', description: 'Products not tested on animals', iconName: 'heart', sortOrder: 4 },
  { name: 'Women-Owned', label: 'Women-Owned', slug: 'women-owned', description: 'Products from women-owned businesses', iconName: 'woman', sortOrder: 5 },
  { name: 'Black-Owned', label: 'Black-Owned', slug: 'black-owned', description: 'Products from Black-owned businesses', iconName: 'hand-fist', sortOrder: 6 },
  { name: 'Small Business', label: 'Small Business', slug: 'small-business', description: 'Products from small, independent businesses', iconName: 'store', sortOrder: 7 },
  { name: 'Made in USA', label: 'Made in USA', slug: 'made-in-usa', description: 'Products manufactured in the United States', iconName: 'flag-usa', sortOrder: 8 },
  { name: 'Organic', label: 'Organic', slug: 'organic', description: 'Products made with certified organic materials', iconName: 'seedling', sortOrder: 9 },
  { name: 'Fair Trade', label: 'Fair Trade', slug: 'fair-trade', description: 'Products certified as fair trade', iconName: 'handshake', sortOrder: 10 },
  { name: 'Biodegradable', label: 'Biodegradable', slug: 'biodegradable', description: 'Products that naturally decompose', iconName: 'recycle', sortOrder: 11 },
  { name: 'Recyclable', label: 'Recyclable', slug: 'recyclable', description: 'Products that can be recycled after use', iconName: 'arrows-rotate', sortOrder: 12 },
];

// Map of product titles to their sustainability value slugs
const productValueAssignments: Record<string, string[]> = {
  'Bamboo Water Bottle': ['plastic-free', 'zero-waste', 'biodegradable'],
  'Reusable Produce Bags - Set of 5': ['plastic-free', 'zero-waste', 'recyclable'],
  'Bamboo Cutlery Set': ['plastic-free', 'zero-waste', 'biodegradable', 'vegan'],
  'Natural Loofah Sponge - 3 Pack': ['plastic-free', 'zero-waste', 'biodegradable', 'vegan', 'organic'],
  'Beeswax Food Wraps': ['plastic-free', 'zero-waste', 'organic', 'biodegradable'],
  'Bamboo Toothbrush Set': ['plastic-free', 'biodegradable', 'vegan', 'cruelty-free'],
  'Stainless Steel Lunch Container': ['plastic-free', 'zero-waste', 'recyclable'],
  'Wool Dryer Balls - Set of 6': ['plastic-free', 'zero-waste', 'cruelty-free', 'biodegradable'],
  'Bamboo Bathroom Set': ['plastic-free', 'biodegradable', 'zero-waste'],
  'Reusable Coffee Filter': ['plastic-free', 'zero-waste', 'organic', 'biodegradable'],
  'Natural Cleaning Kit': ['plastic-free', 'vegan', 'cruelty-free', 'biodegradable'],
  'Bamboo Dish Brush': ['plastic-free', 'zero-waste', 'biodegradable', 'vegan'],
  'Organic Cotton Napkins - Set of 8': ['plastic-free', 'organic', 'biodegradable', 'fair-trade'],
  'Compost Bin with Charcoal Filter': ['zero-waste', 'recyclable'],
  'Glass Food Storage Set': ['plastic-free', 'zero-waste', 'recyclable'],
};

// Sustainability certifications to seed
const certifications = [
  {
    name: '1% for the Planet',
    description: 'Member commits 1% of annual sales to environmental nonprofits',
    iconUrl: '/images/certifications/one-percent-planet.svg',
    verificationUrl: 'https://www.onepercentfortheplanet.org/business-members',
    sortOrder: 1,
  },
  {
    name: 'B Corp Certified',
    description: 'Certified B Corporations meet verified standards of social and environmental performance, accountability, and transparency',
    iconUrl: '/images/certifications/b-corp.svg',
    verificationUrl: 'https://www.bcorporation.net/en-us/find-a-b-corp',
    sortOrder: 2,
  },
  {
    name: 'Climate Neutral',
    description: 'Company has measured, reduced, and offset all carbon emissions from their operations',
    iconUrl: '/images/certifications/climate-neutral.svg',
    verificationUrl: 'https://www.climateneutral.org/brand-directory',
    sortOrder: 3,
  },
  {
    name: 'Plastic Free',
    description: 'Product and packaging contain no plastic materials',
    iconUrl: '/images/certifications/plastic-free.svg',
    verificationUrl: null,
    sortOrder: 4,
  },
  {
    name: 'Vegan',
    description: 'Product contains no animal-derived ingredients',
    iconUrl: '/images/certifications/vegan.svg',
    verificationUrl: null,
    sortOrder: 5,
  },
  {
    name: 'Cruelty Free',
    description: 'Product has not been tested on animals at any stage of development',
    iconUrl: '/images/certifications/cruelty-free.svg',
    verificationUrl: 'https://www.leapingbunny.org/guide/brands',
    sortOrder: 6,
  },
  {
    name: 'USDA Organic',
    description: 'Product meets USDA organic standards for organic production and handling',
    iconUrl: '/images/certifications/usda-organic.svg',
    verificationUrl: 'https://www.usda.gov/topics/organic',
    sortOrder: 7,
  },
];

// Product sustainability attributes (used when creating products)
const productSustainabilityData: Record<string, {
  isPlasticFree: boolean;
  isVegan: boolean;
  isCrueltyFree: boolean;
  isOrganicCertified: boolean;
  carbonFootprintGrams: number | null;
  certificationNames: string[];
}> = {
  'Bamboo Water Bottle': {
    isPlasticFree: true,
    isVegan: true,
    isCrueltyFree: true,
    isOrganicCertified: false,
    carbonFootprintGrams: 450,
    certificationNames: ['Plastic Free', 'Vegan', 'B Corp Certified'],
  },
  'Reusable Produce Bags - Set of 5': {
    isPlasticFree: true,
    isVegan: true,
    isCrueltyFree: true,
    isOrganicCertified: false,
    carbonFootprintGrams: 120,
    certificationNames: ['Plastic Free', 'Vegan'],
  },
  'Bamboo Cutlery Set': {
    isPlasticFree: true,
    isVegan: true,
    isCrueltyFree: true,
    isOrganicCertified: false,
    carbonFootprintGrams: 180,
    certificationNames: ['Plastic Free', 'Vegan', 'Climate Neutral'],
  },
  'Natural Loofah Sponge - 3 Pack': {
    isPlasticFree: true,
    isVegan: true,
    isCrueltyFree: true,
    isOrganicCertified: true,
    carbonFootprintGrams: 50,
    certificationNames: ['Plastic Free', 'Vegan', 'USDA Organic'],
  },
  'Beeswax Food Wraps': {
    isPlasticFree: true,
    isVegan: false, // Contains beeswax
    isCrueltyFree: true,
    isOrganicCertified: true,
    carbonFootprintGrams: 150,
    certificationNames: ['Plastic Free', 'USDA Organic', '1% for the Planet'],
  },
  'Bamboo Toothbrush Set': {
    isPlasticFree: true,
    isVegan: true,
    isCrueltyFree: true,
    isOrganicCertified: false,
    carbonFootprintGrams: 80,
    certificationNames: ['Plastic Free', 'Vegan', 'Cruelty Free'],
  },
  'Stainless Steel Lunch Container': {
    isPlasticFree: true,
    isVegan: true,
    isCrueltyFree: true,
    isOrganicCertified: false,
    carbonFootprintGrams: 600,
    certificationNames: ['Plastic Free', 'Vegan', 'Climate Neutral'],
  },
  'Wool Dryer Balls - Set of 6': {
    isPlasticFree: true,
    isVegan: false, // Contains wool
    isCrueltyFree: true,
    isOrganicCertified: false,
    carbonFootprintGrams: 200,
    certificationNames: ['Plastic Free', 'Cruelty Free'],
  },
  'Bamboo Bathroom Set': {
    isPlasticFree: true,
    isVegan: true,
    isCrueltyFree: true,
    isOrganicCertified: false,
    carbonFootprintGrams: 350,
    certificationNames: ['Plastic Free', 'Vegan'],
  },
  'Reusable Coffee Filter': {
    isPlasticFree: true,
    isVegan: true,
    isCrueltyFree: true,
    isOrganicCertified: true,
    carbonFootprintGrams: 40,
    certificationNames: ['Plastic Free', 'Vegan', 'USDA Organic'],
  },
  'Natural Cleaning Kit': {
    isPlasticFree: false, // Glass bottles
    isVegan: true,
    isCrueltyFree: true,
    isOrganicCertified: false,
    carbonFootprintGrams: 280,
    certificationNames: ['Vegan', 'Cruelty Free', 'B Corp Certified'],
  },
  'Bamboo Dish Brush': {
    isPlasticFree: true,
    isVegan: true,
    isCrueltyFree: true,
    isOrganicCertified: false,
    carbonFootprintGrams: 60,
    certificationNames: ['Plastic Free', 'Vegan'],
  },
  'Organic Cotton Napkins - Set of 8': {
    isPlasticFree: true,
    isVegan: true,
    isCrueltyFree: true,
    isOrganicCertified: true,
    carbonFootprintGrams: 180,
    certificationNames: ['Plastic Free', 'Vegan', 'USDA Organic', '1% for the Planet'],
  },
  'Compost Bin with Charcoal Filter': {
    isPlasticFree: false, // May have some components
    isVegan: true,
    isCrueltyFree: true,
    isOrganicCertified: false,
    carbonFootprintGrams: 800,
    certificationNames: ['Vegan', 'Climate Neutral'],
  },
  'Glass Food Storage Set': {
    isPlasticFree: true,
    isVegan: true,
    isCrueltyFree: true,
    isOrganicCertified: false,
    carbonFootprintGrams: 1200,
    certificationNames: ['Plastic Free', 'Vegan'],
  },
};

async function main() {
  // Clear existing brands
  await prisma.brand.deleteMany();
  console.log('Cleared existing brands');

  // Seed brands
  for (const brand of brands) {
    await prisma.brand.create({
      data: brand,
    });
  }
  console.log('Created partner brands');

  // Create sample products with sustainability data
  const products = [
    {
      title: 'Bamboo Water Bottle',
      description: 'Sustainable bamboo and stainless steel water bottle, keeps drinks cold for 24 hours and hot for 12 hours',
      price: 24.99,
      image: '/images/leaves.jpg',
      category: 'Kitchen',
      isSubscribable: true,
    },
    {
      title: 'Reusable Produce Bags - Set of 5',
      description: 'Mesh produce bags made from recycled materials, perfect for grocery shopping',
      price: 16.99,
      image: '/images/plastic-bags.jpg',
      category: 'Kitchen',
      isSubscribable: true,
    },
    {
      title: 'Bamboo Cutlery Set',
      description: 'Portable bamboo utensil set including fork, knife, spoon, and chopsticks with carrying case',
      price: 19.99,
      image: '/images/food-bag.jpg',
      category: 'Kitchen',
    },
    {
      title: 'Natural Loofah Sponge - 3 Pack',
      description: 'Biodegradable natural loofah sponges for kitchen and bathroom cleaning',
      price: 12.99,
      image: '/images/soap-bars.jpg',
      category: 'Home',
    },
    {
      title: 'Beeswax Food Wraps',
      description: 'Reusable food wraps made with organic cotton and beeswax, alternative to plastic wrap',
      price: 22.99,
      image: '/images/tree-root.jpg',
      category: 'Kitchen',
    },
    {
      title: 'Bamboo Toothbrush Set',
      description: 'Pack of 4 biodegradable bamboo toothbrushes with charcoal-infused bristles',
      price: 15.99,
      image: '/images/wall-hanger-plant.jpg',
      category: 'Bathroom',
      isSubscribable: true,
    },
    {
      title: 'Stainless Steel Lunch Container',
      description: '3-compartment stainless steel lunch box with bamboo lid',
      price: 29.99,
      image: '/images/organges.jpg',
      category: 'Kitchen',
    },
    {
      title: 'Wool Dryer Balls - Set of 6',
      description: 'Natural wool dryer balls to reduce drying time and static, replace dryer sheets',
      price: 18.99,
      image: '/images/windmill.jpg',
      category: 'Laundry',
    },
    {
      title: 'Bamboo Bathroom Set',
      description: 'Complete bathroom set including soap dish, toothbrush holder, and dispenser',
      price: 34.99,
      image: '/images/soap-bars.jpg',
      category: 'Bathroom',
    },
    {
      title: 'Reusable Coffee Filter',
      description: 'Organic cotton reusable coffee filter, fits most pour-over coffee makers',
      price: 13.99,
      image: '/images/solar-panels.jpg',
      category: 'Kitchen',
    },
    {
      title: 'Natural Cleaning Kit',
      description: 'Complete eco-friendly cleaning kit with glass spray bottles and natural cleaners',
      price: 45.99,
      image: '/images/food-bag.jpg',
      category: 'Home',
      isSubscribable: true,
    },
    {
      title: 'Bamboo Dish Brush',
      description: 'Biodegradable dish brush with replaceable head and bamboo handle',
      price: 9.99,
      image: '/images/tree-root.jpg',
      category: 'Kitchen',
    },
    {
      title: 'Organic Cotton Napkins - Set of 8',
      description: 'Reusable organic cotton napkins in natural colors',
      price: 26.99,
      image: '/images/leaves.jpg',
      category: 'Kitchen',
    },
    {
      title: 'Compost Bin with Charcoal Filter',
      description: 'Stylish countertop compost bin with odor-blocking filter',
      price: 39.99,
      image: '/images/cover.png',
      category: 'Kitchen',
    },
    {
      title: 'Glass Food Storage Set',
      description: '10-piece glass food storage set with bamboo lids',
      price: 49.99,
      image: '/images/solar-panels.jpg',
      category: 'Kitchen',
    }
  ];

  // Clear existing data (respect foreign key constraints)
  await prisma.quizResponse.deleteMany();
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
  for (const product of products) {
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

Composting is one of the most impactful ways to reduce waste and nourish your garden.

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

Your bathroom is one of the easiest places to start reducing waste.

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

## The Impact

By making these switches, the average person can eliminate hundreds of pieces of plastic waste per year!`,
    },
  });

  console.log('Seeded blog posts');

  // Seed Quiz Questions
  await prisma.quizQuestion.deleteMany();

  const quizQuestions = [
    {
      visibleId: 'q1',
      question: 'What area of your life do you want to make more sustainable?',
      questionType: 'SINGLE_CHOICE',
      options: JSON.stringify([
        { value: 'kitchen', label: 'Kitchen' },
        { value: 'bathroom', label: 'Bathroom' },
        { value: 'personal-care', label: 'Personal Care' },
        { value: 'cleaning', label: 'Cleaning' },
        { value: 'all', label: 'All of the above' },
      ]),
      orderIndex: 1,
      categoryFilter: null,
      isActive: true,
    },
    {
      visibleId: 'q2',
      question: "What's your experience with eco-friendly products?",
      questionType: 'SINGLE_CHOICE',
      options: JSON.stringify([
        { value: 'beginner', label: "Beginner - I'm just getting started" },
        { value: 'some-experience', label: "Some experience - I've tried a few products" },
        { value: 'eco-expert', label: 'Eco-expert - Sustainability is my lifestyle' },
      ]),
      orderIndex: 2,
      categoryFilter: null,
      isActive: true,
    },
    {
      visibleId: 'q3',
      question: 'What matters most to you? (Select all that apply)',
      questionType: 'MULTIPLE_CHOICE',
      options: JSON.stringify([
        { value: 'plastic-free', label: 'Plastic-free packaging' },
        { value: 'vegan', label: 'Vegan & cruelty-free' },
        { value: 'organic', label: 'Organic & natural ingredients' },
        { value: 'budget-friendly', label: 'Budget-friendly options' },
      ]),
      orderIndex: 3,
      categoryFilter: null,
      isActive: true,
    },
    {
      visibleId: 'q4',
      question: 'Any allergies or sensitivities?',
      questionType: 'MULTIPLE_CHOICE',
      options: JSON.stringify([
        { value: 'fragrance-free', label: 'Fragrance-free preferred' },
        { value: 'nut-free', label: 'Nut-free required' },
        { value: 'none', label: 'No allergies or sensitivities' },
      ]),
      orderIndex: 4,
      categoryFilter: null,
      isActive: true,
    },
    {
      visibleId: 'q5',
      question: 'How many people are in your household?',
      questionType: 'SINGLE_CHOICE',
      options: JSON.stringify([
        { value: '1', label: 'Just me' },
        { value: '2-3', label: '2-3 people' },
        { value: '4+', label: '4 or more people' },
      ]),
      orderIndex: 5,
      categoryFilter: null,
      isActive: true,
    },
  ];

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

  const impactMetrics = [
    {
      name: 'Plastic Bottles Saved',
      slug: 'plastic-bottles-saved',
      unit: 'bottles',
      iconName: 'bottle',
      description: 'Number of single-use plastic bottles avoided by choosing reusable alternatives',
      comparison: "That's {value} weeks of single-use plastic avoided!",
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Single-Use Items Replaced',
      slug: 'single-use-items-replaced',
      unit: 'items',
      iconName: 'recycle',
      description: 'Disposable items replaced by reusable eco-friendly alternatives',
      comparison: 'Equivalent to {value} months of disposable items!',
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Carbon Offset',
      slug: 'carbon-offset',
      unit: 'kg CO2',
      iconName: 'leaf',
      description: 'Kilograms of CO2 offset through sustainable product choices',
      comparison: 'Like planting {value} trees for a year!',
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Trees Planted',
      slug: 'trees-planted',
      unit: 'trees',
      iconName: 'tree',
      description: 'Trees planted through our partnership with reforestation organizations',
      comparison: '{value} kg of CO2 absorbed per year!',
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Water Saved',
      slug: 'water-saved',
      unit: 'liters',
      iconName: 'droplet',
      description: 'Liters of water saved by choosing products with lower water footprints',
      comparison: "That's {value} showers worth of water!",
      sortOrder: 5,
      isActive: true,
    },
    {
      name: 'Waste Diverted',
      slug: 'waste-diverted',
      unit: 'kg',
      iconName: 'trash',
      description: 'Kilograms of waste diverted from landfills through reusable products',
      comparison: '{value} pounds kept out of landfills!',
      sortOrder: 6,
      isActive: true,
    },
  ];

  const createdMetricIds: Record<string, string> = {};
  for (const metric of impactMetrics) {
    const created = await prisma.impactMetric.create({
      data: metric,
    });
    createdMetricIds[metric.slug] = created.id;
  }
  console.log('Created impact metrics');

  // Product impact data (mapping product titles to their impact values)
  const productImpactData: Record<string, Record<string, number>> = {
    'Bamboo Water Bottle': {
      'plastic-bottles-saved': 365,
      'single-use-items-replaced': 365,
      'carbon-offset': 2.5,
      'waste-diverted': 0.5,
    },
    'Reusable Produce Bags - Set of 5': {
      'single-use-items-replaced': 500,
      'carbon-offset': 1.0,
      'waste-diverted': 0.3,
    },
    'Bamboo Cutlery Set': {
      'single-use-items-replaced': 200,
      'carbon-offset': 1.5,
      'waste-diverted': 0.2,
    },
    'Natural Loofah Sponge - 3 Pack': {
      'single-use-items-replaced': 36,
      'carbon-offset': 0.5,
      'waste-diverted': 0.1,
    },
    'Beeswax Food Wraps': {
      'single-use-items-replaced': 300,
      'carbon-offset': 1.0,
      'waste-diverted': 0.2,
    },
    'Bamboo Toothbrush Set': {
      'single-use-items-replaced': 4,
      'carbon-offset': 0.3,
      'waste-diverted': 0.05,
    },
    'Stainless Steel Lunch Container': {
      'single-use-items-replaced': 250,
      'carbon-offset': 2.0,
      'waste-diverted': 0.4,
    },
    'Wool Dryer Balls - Set of 6': {
      'single-use-items-replaced': 1000,
      'carbon-offset': 1.0,
      'waste-diverted': 0.3,
    },
    'Bamboo Bathroom Set': {
      'plastic-bottles-saved': 3,
      'single-use-items-replaced': 10,
      'carbon-offset': 0.8,
      'waste-diverted': 0.2,
    },
    'Reusable Coffee Filter': {
      'single-use-items-replaced': 500,
      'carbon-offset': 0.5,
      'water-saved': 100,
      'waste-diverted': 0.2,
    },
    'Natural Cleaning Kit': {
      'plastic-bottles-saved': 10,
      'single-use-items-replaced': 20,
      'carbon-offset': 1.5,
      'water-saved': 50,
      'waste-diverted': 0.3,
    },
    'Bamboo Dish Brush': {
      'single-use-items-replaced': 12,
      'carbon-offset': 0.2,
      'waste-diverted': 0.05,
    },
    'Organic Cotton Napkins - Set of 8': {
      'single-use-items-replaced': 1000,
      'carbon-offset': 0.8,
      'water-saved': 200,
      'waste-diverted': 0.4,
    },
    'Compost Bin with Charcoal Filter': {
      'carbon-offset': 50,
      'waste-diverted': 100,
    },
    'Glass Food Storage Set': {
      'single-use-items-replaced': 500,
      'carbon-offset': 2.0,
      'waste-diverted': 0.5,
    },
  };

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
