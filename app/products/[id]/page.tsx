import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import ProductDetails from '@/components/products/ProductDetails';

// Cache the product fetch to avoid duplicate queries
const getProduct = cache(async (id: string) => {
  return prisma.product.findUnique({
    where: { id },
    include: {
      reviews: {
        select: { rating: true },
      },
      variants: {
        orderBy: [
          { isDefault: 'desc' },
          { sortOrder: 'asc' },
        ],
      },
      values: {
        include: {
          value: {
            select: {
              id: true,
              name: true,
              slug: true,
              iconName: true,
            },
          },
        },
      },
      certifications: {
        include: {
          certification: true,
        },
      },
    },
  });
});

// Generate metadata for SEO
export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Product Not Found | Link Flame',
      description: 'The product you are looking for could not be found.',
    };
  }

  return {
    title: `${product.title} | Link Flame`,
    description: product.description || `Shop ${product.title} - eco-friendly products for sustainable living.`,
    openGraph: {
      title: product.title,
      description: product.description || `Shop ${product.title} - eco-friendly products for sustainable living.`,
      images: product.image ? [{ url: product.image }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.description || `Shop ${product.title} - eco-friendly products for sustainable living.`,
      images: product.image ? [product.image] : [],
    },
  };
}

// Revalidate product pages every 30 minutes
export const revalidate = 1800;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  // Calculate average rating server-side
  const averageRating = product.reviews.length
    ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
    : null;

  // Transform the data to match the expected format
  const transformedProduct = {
    ...product,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    variants: product.variants.map(v => ({ ...v, price: v.price ? Number(v.price) : null, salePrice: v.salePrice ? Number(v.salePrice) : null })),
    // Flatten values for easier consumption
    values: product.values?.map((pva) => pva.value) || [],
    // Transform certifications
    certifications: product.certifications?.map((pc) => ({
      certification: pc.certification,
    })) || [],
  };

  return <ProductDetails product={transformedProduct} averageRating={averageRating} />;
}
