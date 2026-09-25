import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateQuizResultId,
  getProductRecommendations,
  type QuizResponses,
} from '@/lib/quiz';

// Mock the Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

type MockProduct = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  image: string;
  category: string;
  inventory: number;
};

function product(overrides: Partial<MockProduct> & { id: string }): MockProduct {
  return {
    title: 'Product',
    description: '',
    price: 25,
    salePrice: null,
    image: '/image.jpg',
    category: 'Kitchen',
    inventory: 10,
    ...overrides,
  };
}

describe('Product Quiz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('generateQuizResultId', () => {
    it('returns an id prefixed with quiz_', () => {
      expect(generateQuizResultId()).toMatch(/^quiz_[A-Za-z0-9_-]{10}$/);
    });

    it('returns a different id on each call', () => {
      const a = generateQuizResultId();
      const b = generateQuizResultId();
      expect(a).not.toBe(b);
    });
  });

  describe('getProductRecommendations', () => {
    describe('category filtering', () => {
      it('filters to the mapped category when an area is selected', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([]);

        await getProductRecommendations({ q1: 'kitchen' } as QuizResponses);

        expect(prisma.product.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { category: { in: ['Kitchen'] }, inventory: { gt: 0 } },
          })
        );
      });

      it('maps personal-care to two categories', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([]);

        await getProductRecommendations({ q1: 'personal-care' } as QuizResponses);

        expect(prisma.product.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { category: { in: ['Personal Care', 'Bathroom'] }, inventory: { gt: 0 } },
          })
        );
      });

      it('applies no category filter when the area is "all"', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([]);

        await getProductRecommendations({ q1: 'all' } as QuizResponses);

        expect(prisma.product.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { inventory: { gt: 0 } } })
        );
      });

      it('applies no category filter when no area is answered', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([]);

        await getProductRecommendations({} as QuizResponses);

        expect(prisma.product.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { inventory: { gt: 0 } } })
        );
      });
    });

    describe('value-based scoring', () => {
      it('scores a product matching a value keyword above one that does not', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          product({ id: 'match', title: 'Bamboo Toothbrush' }),
          product({ id: 'no-match', title: 'Plastic Fork' }),
        ] as any);

        const { products, recommendedProductIds } = await getProductRecommendations({
          q3: 'plastic-free',
        } as QuizResponses);

        expect(products[0].id).toBe('match');
        expect(products[0].score).toBeGreaterThan(products[1].score);
        expect(recommendedProductIds[0]).toBe('match');
      });

      it('accepts multiple values and sums matching keyword bonuses', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          product({ id: 'both', title: 'Organic Bamboo Brush', description: 'vegan and organic' }),
          product({ id: 'one', title: 'Bamboo Brush' }),
        ] as any);

        const { products } = await getProductRecommendations({
          q3: ['plastic-free', 'organic'],
        } as QuizResponses);

        const both = products.find((p) => p.id === 'both')!;
        const one = products.find((p) => p.id === 'one')!;
        expect(both.score).toBeGreaterThan(one.score);
      });

      it('gives budget-friendly bonuses to lower-priced and discounted items', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          product({ id: 'cheap-sale', price: 15, salePrice: 10 }),
          product({ id: 'cheap', price: 15, salePrice: null }),
          product({ id: 'expensive', price: 50, salePrice: null }),
        ] as any);

        const { products } = await getProductRecommendations({
          q3: 'budget-friendly',
        } as QuizResponses);

        const byId = Object.fromEntries(products.map((p) => [p.id, p.score]));
        expect(byId['cheap-sale']).toBeGreaterThan(byId['cheap']);
        expect(byId['cheap']).toBeGreaterThan(byId['expensive']);
        expect(byId['expensive']).toBe(0);
      });
    });

    describe('experience-level scoring', () => {
      it('rewards products at or under the beginner price ceiling', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          product({ id: 'cheap', title: 'Refill', price: 25 }),
          product({ id: 'expensive', title: 'Refill', price: 45 }),
        ] as any);

        const { products } = await getProductRecommendations({
          q2: 'beginner',
        } as QuizResponses);

        const byId = Object.fromEntries(products.map((p) => [p.id, p.score]));
        expect(byId['cheap']).toBeGreaterThan(byId['expensive']);
      });

      it('rewards beginner keywords independently of price', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          product({ id: 'kit', title: 'Starter Kit', price: 45 }),
          product({ id: 'plain', title: 'Refill', price: 45 }),
        ] as any);

        const { products } = await getProductRecommendations({
          q2: 'beginner',
        } as QuizResponses);

        const byId = Object.fromEntries(products.map((p) => [p.id, p.score]));
        expect(byId['kit']).toBeGreaterThan(byId['plain']);
        expect(byId['plain']).toBe(0);
      });

      it('applies no experience bonus when no experience is answered', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          product({ id: 'kit', title: 'Starter Kit', price: 25 }),
        ] as any);

        const { products } = await getProductRecommendations({} as QuizResponses);

        expect(products[0].score).toBe(0);
      });
    });

    describe('sensitivity penalties and bonuses', () => {
      it('penalizes scented items for fragrance-sensitive users', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          product({ id: 'scented', description: 'a lightly scented soap' }),
          product({ id: 'neutral', description: 'a soap' }),
        ] as any);

        const { products } = await getProductRecommendations({
          q4: 'fragrance-free',
        } as QuizResponses);

        const byId = Object.fromEntries(products.map((p) => [p.id, p.score]));
        expect(byId['neutral']).toBeGreaterThan(byId['scented']);
        expect(byId['scented']).toBe(-20);
        expect(byId['neutral']).toBe(0);
      });

      it('accepts multiple sensitivities', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          product({ id: 'nutty', description: 'made with almond oil' }),
          product({ id: 'clean', description: 'plain soap' }),
        ] as any);

        const { products } = await getProductRecommendations({
          q4: ['nut-free', 'fragrance-free'],
        } as QuizResponses);

        const byId = Object.fromEntries(products.map((p) => [p.id, p.score]));
        expect(byId['clean']).toBeGreaterThan(byId['nutty']);
      });
    });

    describe('household size bonus', () => {
      it('rewards multi-pack items for larger households', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          product({ id: 'pack', title: '4-Pack Refills' }),
          product({ id: 'single', title: 'Single Refill' }),
        ] as any);

        const { products } = await getProductRecommendations({
          q5: '4+',
        } as QuizResponses);

        const byId = Object.fromEntries(products.map((p) => [p.id, p.score]));
        expect(byId['pack']).toBeGreaterThan(byId['single']);
      });

      it('gives no bonus for a household of one', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          product({ id: 'pack', title: '4-Pack Refills' }),
        ] as any);

        const { products } = await getProductRecommendations({
          q5: '1',
        } as QuizResponses);

        expect(products[0].score).toBe(0);
      });
    });

    describe('sorting, limiting, and ids', () => {
      it('sorts results by score descending', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          product({ id: 'low', title: 'Fork' }),
          product({ id: 'high', title: 'Bamboo Brush' }),
          product({ id: 'mid', title: 'Bamboo Spoon Set', description: 'reusable' }),
        ] as any);

        const { products } = await getProductRecommendations({
          q3: 'plastic-free',
        } as QuizResponses);

        const scores = products.map((p) => p.score);
        expect(scores).toEqual([...scores].sort((a, b) => b - a));
      });

      it('respects the limit parameter', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          product({ id: 'a' }),
          product({ id: 'b' }),
          product({ id: 'c' }),
        ] as any);

        const { products, recommendedProductIds } = await getProductRecommendations(
          {} as QuizResponses,
          2
        );

        expect(products).toHaveLength(2);
        expect(recommendedProductIds).toHaveLength(2);
      });

      it('defaults to a limit of 12', async () => {
        const many = Array.from({ length: 20 }, (_, i) => product({ id: `p${i}` }));
        vi.mocked(prisma.product.findMany).mockResolvedValue(many as any);

        const { products } = await getProductRecommendations({} as QuizResponses);

        expect(products).toHaveLength(12);
      });

      it('returns recommendedProductIds in the same order as products', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          product({ id: 'a', title: 'Bamboo Brush' }),
          product({ id: 'b', title: 'Fork' }),
        ] as any);

        const { products, recommendedProductIds } = await getProductRecommendations({
          q3: 'plastic-free',
        } as QuizResponses);

        expect(recommendedProductIds).toEqual(products.map((p) => p.id));
      });

      it('converts Decimal-like price and salePrice to numbers', async () => {
        vi.mocked(prisma.product.findMany).mockResolvedValue([
          product({ id: 'a', price: 19.99, salePrice: 14.99 }),
        ] as any);

        const { products } = await getProductRecommendations({} as QuizResponses);

        expect(products[0].price).toBe(19.99);
        expect(products[0].salePrice).toBe(14.99);
      });
    });
  });
});
