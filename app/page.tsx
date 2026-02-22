import HeroSection from "@/components/home/HeroSection";
import CTASection from "@/components/home/CTASection";
import { FeaturedBrands } from "@/components/home/FeaturedBrands";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { QuizCTA } from "@/components/quiz";
import { SustainabilityCommitment } from "@/components/sustainability";
import { Suspense } from "react";
import type { Metadata } from "next";

// Render at request time — DB not available during Vercel build
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Link Flame | Sustainable Shopping',
  description:
    'Discover eco-friendly products, sustainable brands, and practical guides for greener living.',
};

export default function IndexPage() {
  return (
    <div className="space-y-24 lg:space-y-32">
      <HeroSection />

      {/* Trust / value props (inspired by leading eco-stores) */}
      <SustainabilityCommitment variant="compact" />

      {/* Featured Products from the store */}
      <Suspense fallback={<FeaturedProductsLoading />}>
        <FeaturedProducts />
      </Suspense>

      {/* Product Quiz CTA Banner */}
      <QuizCTA variant="banner" />

      {/* Featured Partner Brands */}
      <Suspense fallback={<FeaturedBrandsLoading />}>
        <FeaturedBrands />
      </Suspense>

      <CTASection />
    </div>
  );
}

function FeaturedProductsLoading() {
  return (
    <section className="py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mx-auto h-10 w-64 animate-pulse rounded bg-muted" />
          <div className="mx-auto mt-4 h-6 w-96 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border bg-card">
              <div className="aspect-square bg-muted" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedBrandsLoading() {
  return (
    <section className="bg-gradient-to-b from-background to-secondary/30 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 size-12 animate-pulse rounded-full bg-muted" />
          <div className="mx-auto h-10 w-80 animate-pulse rounded bg-muted" />
          <div className="mx-auto mt-4 h-6 w-96 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border bg-card">
              <div className="aspect-[16/9] bg-muted" />
              <div className="space-y-3 p-6">
                <div className="h-6 w-3/4 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
