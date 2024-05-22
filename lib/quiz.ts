/**
 * Product Quiz recommendation algorithm and utilities
 *
 * This module contains the logic for recommending products based on
 * user quiz responses about their sustainability preferences.
 */

import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

// Quiz question types
export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';

// Quiz option structure
export interface QuizOption {
  value: string;
  label: string;
  tags?: string[]; // Product tags this option maps to
}

// Quiz question structure
export interface QuizQuestionData {
  id: string;
  visibleId: string;
  question: string;
  questionType: QuestionType;
  options: QuizOption[];
  orderIndex: number;
  categoryFilter: string | null;
}

// User responses structure
export interface QuizResponses {
  [questionId: string]: string | string[]; // Single choice = string, multiple choice = string[]
}

// Product with scoring metadata
interface ScoredProduct {
  id: string;
  title: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  image: string;
  category: string;
  inventory: number;
  score: number;
}

// Category mapping from quiz answers
const CATEGORY_MAP: Record<string, string[]> = {
  'kitchen': ['Kitchen'],
  'bathroom': ['Bathroom'],
  'personal-care': ['Personal Care', 'Bathroom'],
  'cleaning': ['Cleaning', 'Home'],
  'all': [], // Empty means no category filter
};

// Product keyword/tag mapping for values
const VALUE_KEYWORDS: Record<string, string[]> = {
  'plastic-free': ['bamboo', 'glass', 'stainless steel', 'metal', 'reusable', 'zero waste'],
  'vegan': ['vegan', 'plant-based', 'cruelty-free', 'organic cotton'],
  'organic': ['organic', 'natural', 'sustainable', 'eco-friendly', 'biodegradable'],
  'budget-friendly': [], // Will use price filtering
};

// Experience level adjustments
const EXPERIENCE_PRIORITIES: Record<string, { priceRange?: { max: number }, keywords: string[] }> = {
  'beginner': {
    priceRange: { max: 30 },
    keywords: ['starter', 'set', 'kit', 'pack', 'basic', 'easy'],
  },
  'some-experience': {
    keywords: ['sustainable', 'eco-friendly', 'reusable'],
  },
  'eco-expert': {
    keywords: ['premium', 'professional', 'advanced', 'complete', 'zero waste'],
  },
};

// Household size adjustments (for quantity recommendations)
const HOUSEHOLD_MULTIPLIERS: Record<string, number> = {
  '1': 1,
  '2-3': 1.5,
  '4+': 2,
};

/**
 * Generate a unique visible ID for quiz responses
 */
export function generateQuizResultId(): string {
  return `quiz_${nanoid(10)}`;
}

/**
 * Parse quiz responses and generate product recommendations
 */
export async function getProductRecommendations(
  responses: QuizResponses,
  limit: number = 12
): Promise<{ products: ScoredProduct[]; recommendedProductIds: string[] }> {
  // Extract user preferences from responses
  const area = responses['q1'] as string | undefined;
  const experience = responses['q2'] as string | undefined;
  const values = responses['q3'] as string[] | string | undefined;
  const sensitivities = responses['q4'] as string[] | string | undefined;
  const householdSize = responses['q5'] as string | undefined;

  // Normalize values to arrays
  const valuesList = Array.isArray(values) ? values : values ? [values] : [];
  const sensitivityList = Array.isArray(sensitivities) ? sensitivities : sensitivities ? [sensitivities] : [];

  // Build category filter
  const categories = area && area !== 'all' ? CATEGORY_MAP[area] || [] : [];

  // Get all products (filtered by category if specified)
  const whereClause = categories.length > 0
    ? { category: { in: categories }, inventory: { gt: 0 } }
    : { inventory: { gt: 0 } };

  const products = await prisma.product.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      salePrice: true,
      image: true,
      category: true,
      inventory: true,
    },
  });

  // Score each product based on user preferences
  const scoredProducts: ScoredProduct[] = products.map((product) => {
    let score = 0;
    const titleLower = product.title.toLowerCase();
    const descLower = (product.description || '').toLowerCase();
    const fullText = `${titleLower} ${descLower}`;

    // Score based on values (plastic-free, vegan, organic, budget-friendly)
    for (const value of valuesList) {
      const keywords = VALUE_KEYWORDS[value] || [];
      for (const keyword of keywords) {
        if (fullText.includes(keyword)) {
          score += 10;
        }
      }

      // Budget-friendly bonus for lower-priced items
      if (value === 'budget-friendly' && Number(product.price) < 20) {
        score += 15;
      }

      // Extra bonus for sale items when budget-conscious
      if (value === 'budget-friendly' && product.salePrice) {
        score += 10;
      }
    }

    // Score based on experience level
    if (experience) {
      const expConfig = EXPERIENCE_PRIORITIES[experience];
      if (expConfig) {
        // Price range filter for beginners
        if (expConfig.priceRange && Number(product.price) <= expConfig.priceRange.max) {
          score += 8;
        }

        // Keyword matching for experience level
        for (const keyword of expConfig.keywords) {
          if (fullText.includes(keyword)) {
            score += 5;
          }
        }
      }
    }

    // Penalty for products that might conflict with sensitivities
    for (const sensitivity of sensitivityList) {
      if (sensitivity === 'fragrance-free') {
        if (fullText.includes('scented') || fullText.includes('fragrance') || fullText.includes('essential oil')) {
          score -= 20;
        }
        if (fullText.includes('unscented') || fullText.includes('fragrance-free')) {
          score += 10;
        }
      }
      if (sensitivity === 'nut-free') {
        if (fullText.includes('nut') || fullText.includes('almond') || fullText.includes('coconut')) {
          score -= 15;
        }
      }
    }

    // Bonus for multi-packs if larger household
    const multiplier = householdSize ? HOUSEHOLD_MULTIPLIERS[householdSize] || 1 : 1;
    if (multiplier > 1) {
      if (fullText.includes('pack') || fullText.includes('set') || /\d+[- ]?(pack|pcs|pieces)/.test(fullText)) {
        score += 5 * multiplier;
      }
    }

    // Small bonus for featured products
    if (fullText.includes('bestseller') || fullText.includes('popular')) {
      score += 3;
    }

    return {
      ...product,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      score,
    };
  });

  // Sort by score (descending) and limit results
  scoredProducts.sort((a, b) => b.score - a.score);
  const topProducts = scoredProducts.slice(0, limit);
  const recommendedProductIds = topProducts.map(p => p.id);

  return {
    products: topProducts,
    recommendedProductIds,
  };
}

/**
 * Save quiz response and get recommendations
 */
export async function saveQuizResponse(
  responses: QuizResponses,
  sessionId: string | null,
  userId: string | null
): Promise<{ visibleId: string; products: ScoredProduct[] }> {
  const visibleId = generateQuizResultId();
  const { products, recommendedProductIds } = await getProductRecommendations(responses);

  await prisma.quizResponse.create({
    data: {
      visibleId,
      sessionId,
      userId,
      responses: JSON.stringify(responses),
      recommendedProductIds: JSON.stringify(recommendedProductIds),
    },
  });

  return {
    visibleId,
    products,
  };
}

/**
 * Get quiz response by visible ID
 */
export async function getQuizResponseByVisibleId(visibleId: string) {
  const response = await prisma.quizResponse.findUnique({
    where: { visibleId },
  });

  if (!response) {
    return null;
  }

  // Parse JSON fields
  const recommendedProductIds = JSON.parse(response.recommendedProductIds) as string[];

  // Fetch the recommended products
  const products = await prisma.product.findMany({
    where: {
      id: { in: recommendedProductIds },
    },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      salePrice: true,
      image: true,
      category: true,
      inventory: true,
    },
  });

  // Sort products to match the original recommendation order
  const orderedProducts = recommendedProductIds
    .map(id => products.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    .map(p => ({
      ...p,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
    }));

  return {
    ...response,
    responses: JSON.parse(response.responses),
    recommendedProductIds,
    products: orderedProducts,
  };
}

/**
 * Get all active quiz questions
 */
export async function getActiveQuizQuestions(): Promise<QuizQuestionData[]> {
  const questions = await prisma.quizQuestion.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  return questions.map((q) => ({
    id: q.id,
    visibleId: q.visibleId,
    question: q.question,
    questionType: q.questionType as QuestionType,
    options: JSON.parse(q.options) as QuizOption[],
    orderIndex: q.orderIndex,
    categoryFilter: q.categoryFilter,
  }));
}
