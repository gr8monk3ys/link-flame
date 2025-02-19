import Image from "next/image";
import { ProductComparison } from "@/components/home/product-comparison";

export default function ProductComparisonSection() {
  return (
    <section className="section-spacing">
      <div className="mb-12 grid grid-cols-1 items-center gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4">Compare Sustainable Products</h2>
          <p className="text-muted-foreground">Find the most eco-friendly products that match your needs and values.</p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src="/images/soap-bars.jpg"
            alt="Sustainable products"
            fill
            className="object-cover"
          />
        </div>
      </div>
      <ProductComparison />
    </section>
  );
}
