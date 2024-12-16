import { siteConfig } from "@/config/site"
import ProductCard from "@/components/ui/product-card"

// This is dummy data for demonstration purposes
const products = [
  {
    id: '1',
    title: 'Product 1',
    description: 'This is product 1',
    image: 'https://via.placeholder.com/150',
    url: 'https://example.com/product-1',
  },
  // Add more products as needed
];

export default function TopPicksPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Our Top Picks for Health, Wellness, and Sustainability
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Explore our curated list of the best products in health, wellness, and sustainability. Handpicked for quality and value, these products represent the pinnacle of what our site has to offer.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard product={product} key={product.id} />
        ))}
      </div>
    </section>
  )
}
