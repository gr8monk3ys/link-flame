import { siteConfig } from "@/config/site"
import ProductCard, { TopPickProduct } from "@/components/ui/product-card"

// Sample products with actual images from our public directory
const products: TopPickProduct[] = [
  {
    id: '1',
    title: 'Eco-Friendly Food Storage',
    description: 'Sustainable food storage solutions that help reduce plastic waste and keep your food fresh longer.',
    image: '/images/food-bag.jpg',
    url: '/reviews/eco-friendly-food-storage',
  },
  {
    id: '2',
    title: 'Natural Soap Bars',
    description: 'Handcrafted soap bars made with natural ingredients, perfect for sustainable personal care.',
    image: '/images/soap-bars.jpg',
    url: '/reviews/natural-soap-bars',
  },
  {
    id: '3',
    title: 'Solar Panel Systems',
    description: 'High-efficiency solar panels for sustainable home energy solutions.',
    image: '/images/solar-panels.jpg',
    url: '/reviews/solar-panel-systems',
  },
  {
    id: '4',
    title: 'Indoor Plants',
    description: 'Air-purifying indoor plants that bring nature into your home.',
    image: '/images/wall-hanger-plant.jpg',
    url: '/reviews/indoor-plants',
  },
  {
    id: '5',
    title: 'Reusable Shopping Bags',
    description: 'Durable, eco-friendly alternatives to single-use plastic bags.',
    image: '/images/plastic-bags.jpg',
    url: '/reviews/reusable-shopping-bags',
  },
  {
    id: '6',
    title: 'Organic Produce',
    description: 'Fresh, locally sourced organic fruits and vegetables.',
    image: '/images/organges.jpg',
    url: '/reviews/organic-produce',
  },
];

export default function TopPicksPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Our Reviews for Health, Wellness, and Sustainability
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Explore our curated list of the best products in health, wellness, and sustainability. Handpicked for quality and value, these products represent the pinnacle of what our site has to offer.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard product={product} variant="topPick" key={product.id} />
        ))}
      </div>
    </section>
  )
}
