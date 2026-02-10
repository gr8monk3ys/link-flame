import HeroSection from "@/components/home/HeroSection";
import ProductComparisonSection from "@/components/home/ProductComparisonSection";
import MapSection from "@/components/home/MapSection";
import CTASection from "@/components/home/CTASection";
import { FeaturedBrands } from "@/components/home/FeaturedBrands";
import { QuizCTA } from "@/components/quiz";
import { Suspense } from "react";

// Render at request time — DB not available during Vercel build
export const dynamic = 'force-dynamic';

export default function IndexPage() {
  return (
    <div className="space-y-20">
      <HeroSection />

      {/* Product Quiz CTA Banner */}
      <QuizCTA variant="banner" />

      <ProductComparisonSection />

      {/* Featured Partner Brands */}
      <Suspense fallback={<FeaturedBrandsLoading />}>
        <FeaturedBrands />
      </Suspense>

      <MapSection />

      <CTASection />
    </div>
  );
}

function FeaturedBrandsLoading() {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50/50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 size-12 animate-pulse rounded-full bg-gray-200" />
          <div className="mx-auto h-10 w-80 animate-pulse rounded bg-gray-200" />
          <div className="mx-auto mt-4 h-6 w-96 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border bg-card">
              <div className="aspect-[16/9] bg-gray-200" />
              <div className="space-y-3 p-6">
                <div className="h-6 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-2/3 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
