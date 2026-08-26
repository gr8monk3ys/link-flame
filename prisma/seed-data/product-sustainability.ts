// Product sustainability attributes (used when creating products)
export const productSustainabilityData: Record<string, {
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
