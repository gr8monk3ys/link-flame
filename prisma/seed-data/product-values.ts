// Product Values for "Shop by Values" filtering
export const productValues = [
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
export const productValueAssignments: Record<string, string[]> = {
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
