import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Perfectly Imperfect | Save Up to 47% on Sustainable Products',
  description:
    'Discover amazing deals on products with minor cosmetic imperfections. Same great quality at up to 47% off. Help reduce waste while saving money on eco-friendly products.',
  keywords: [
    'imperfect products',
    'sustainable shopping',
    'eco-friendly deals',
    'zero waste',
    'discounted products',
    'reduce waste',
    'cosmetic imperfections',
    'clearance',
    'sustainable living',
  ],
  openGraph: {
    title: 'Perfectly Imperfect - Save Up to 47%',
    description:
      'Same quality products, not picture-perfect packaging. Save big while reducing waste.',
    type: 'website',
    images: [
      {
        url: '/images/imperfect-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Perfectly Imperfect Collection - Save up to 47%',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Perfectly Imperfect - Save Up to 47%',
    description:
      'Same quality products, not picture-perfect packaging. Save big while reducing waste.',
  },
};
