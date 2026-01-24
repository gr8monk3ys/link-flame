import HeroSection from "@/components/home/HeroSection";
import ProductComparisonSection from "@/components/home/ProductComparisonSection";
import MapSection from "@/components/home/MapSection";
import CTASection from "@/components/home/CTASection";
import { QuizCTA } from "@/components/quiz";

export default function IndexPage() {
  return (
    <div className="space-y-20">
      <HeroSection />

      {/* Product Quiz CTA Banner */}
      <QuizCTA variant="banner" />

      <ProductComparisonSection />

      <MapSection />

      <CTASection />
    </div>
  );
}
