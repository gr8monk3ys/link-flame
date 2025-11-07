import HeroSection from "@/components/home/HeroSection";
import ProductComparisonSection from "@/components/home/ProductComparisonSection";
import MapSection from "@/components/home/MapSection";
import CTASection from "@/components/home/CTASection";

export default function IndexPage() {
  return (
    <div className="space-y-20">
      <HeroSection />

      <ProductComparisonSection />

      <MapSection />

      <CTASection />
    </div>
  );
}
