import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { QuizResults } from '@/components/quiz/QuizResults';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface QuizResultsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: QuizResultsPageProps): Promise<Metadata> {
  const { id } = await params;

  const result = await prisma.quizResponse.findUnique({
    where: { visibleId: id },
    select: { visibleId: true, completedAt: true },
  });

  if (!result) {
    return {
      title: 'Quiz Results Not Found | Link Flame',
    };
  }

  return {
    title: 'My Eco-Friendly Product Recommendations | Link Flame',
    description:
      'Check out my personalized sustainable product recommendations from the Link Flame product quiz.',
    openGraph: {
      title: 'My Eco-Friendly Product Recommendations',
      description:
        'Personalized sustainable product recommendations from Link Flame.',
      type: 'website',
    },
  };
}

export default async function QuizResultsPage({ params }: QuizResultsPageProps) {
  const { id } = await params;

  // Fetch the quiz response
  const result = await prisma.quizResponse.findUnique({
    where: { visibleId: id },
  });

  if (!result) {
    notFound();
  }

  // Parse recommended product IDs
  const recommendedProductIds = JSON.parse(result.recommendedProductIds) as string[];

  // Fetch recommended products
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
    .map((pid) => products.find((p) => p.id === pid))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    .map((p) => ({
      ...p,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
    }));

  return (
    <div className="container py-8 md:py-12">
      {/* Back button */}
      <div className="mb-8">
        <Button variant="ghost" asChild>
          <Link href="/quiz">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Take the Quiz Again
          </Link>
        </Button>
      </div>

      {/* Results */}
      <QuizResults
        visibleId={id}
        products={orderedProducts}
        showShareButton={true}
      />
    </div>
  );
}
