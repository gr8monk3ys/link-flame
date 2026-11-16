// "Shop by Values" filters. Only values that are true of the launch
// catalogue are seeded: a filter that matches nothing, or matches a product
// it does not describe, is worse than no filter.
export const productValues = [
  { name: 'Organic Cotton', label: 'Organic Cotton', slug: 'organic', description: 'Printed on organic cotton blanks', iconName: 'seedling', sortOrder: 1 },
  { name: 'Small Business', label: 'Small Business', slug: 'small-business', description: 'Made and sold by a small, independent business', iconName: 'store', sortOrder: 2 },
  { name: 'No Shipping', label: 'Instant Download', slug: 'digital', description: 'Digital guides: nothing is shipped', iconName: 'leaf', sortOrder: 3 },
];

// Product titles (see launch-catalogue.ts) to value slugs.
export const productValueAssignments: Record<string, string[]> = {
  'The Waste Audit Workbook': ['small-business', 'digital'],
  'The One-Swap Kitchen': ['small-business', 'digital'],
  'The Plastic-Free Bathroom Field Guide': ['small-business', 'digital'],
  'The Swap Starter Set': ['small-business', 'digital'],
  'Measured, Not Promised Tote': ['small-business', 'organic'],
  'One Swap at a Time Tee': ['small-business', 'organic'],
};
