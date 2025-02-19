import { BlogPost } from "@/components/blogs/blog-post"
import { ProductDisplay } from "@/components/blogs/product-display"

const blogPost = {
  title: "The Ultimate Guide to Home Composting: Turn Kitchen Waste into Garden Gold",
  description: "Learn everything you need to know about starting and maintaining a successful home composting system. From choosing the right bin to troubleshooting common issues, this comprehensive guide has you covered.",
  content: `
    <h2>Why Start Composting?</h2>
    <p>
      Composting is one of the most impactful ways to reduce your household waste and create
      valuable nutrients for your garden. According to the EPA, food scraps and yard waste
      together make up more than 30 percent of what we throw away. By composting these
      materials, you can:
    </p>
    <ul>
      <li>Reduce methane emissions from landfills</li>
      <li>Create nutrient-rich soil for your garden</li>
      <li>Save money on fertilizers and soil amendments</li>
      <li>Conserve water through improved soil structure</li>
    </ul>

    <h2>Getting Started: Choose Your Composting Method</h2>
    <p>
      There are several composting methods to choose from, depending on your space,
      time commitment, and what you plan to compost. Here are the most popular options:
    </p>
    <h3>1. Traditional Backyard Bin</h3>
    <p>
      Perfect for those with outdoor space, a traditional compost bin allows you to
      compost both kitchen scraps and yard waste. Look for a bin with good ventilation
      and a secure lid to keep pests out.
    </p>
    <h3>2. Tumbler Composter</h3>
    <p>
      Ideal for small to medium yards, tumbler composters make turning your compost
      easy and can produce finished compost more quickly than traditional bins.
    </p>
    <h3>3. Indoor Vermicomposting</h3>
    <p>
      Great for apartment dwellers, vermicomposting uses worms to break down kitchen
      scraps in a compact indoor bin. It's odorless when maintained properly and can
      be done year-round.
    </p>

    <h2>What Can You Compost?</h2>
    <h3>Green Materials (Nitrogen-Rich)</h3>
    <ul>
      <li>Fruit and vegetable scraps</li>
      <li>Coffee grounds and filters</li>
      <li>Tea bags (remove staples)</li>
      <li>Fresh grass clippings</li>
      <li>Plant trimmings</li>
    </ul>
    <h3>Brown Materials (Carbon-Rich)</h3>
    <ul>
      <li>Dry leaves</li>
      <li>Straw or hay</li>
      <li>Paper and cardboard</li>
      <li>Wood chips</li>
      <li>Dryer lint</li>
    </ul>

    <h2>Maintaining Your Compost</h2>
    <p>
      Success in composting comes down to maintaining the right balance of ingredients
      and conditions. Follow these key principles:
    </p>
    <ol>
      <li>
        <strong>Balance Green and Brown Materials:</strong> Aim for a ratio of about
        3:1 brown to green materials.
      </li>
      <li>
        <strong>Keep it Moist:</strong> Your compost should feel like a wrung-out
        sponge. Add water if it's too dry, or more brown materials if it's too wet.
      </li>
      <li>
        <strong>Turn Regularly:</strong> Turn your compost every few weeks to add
        oxygen and speed up decomposition.
      </li>
      <li>
        <strong>Monitor Temperature:</strong> A working compost pile should be warm
        in the center, indicating active decomposition.
      </li>
    </ol>

    <h2>Troubleshooting Common Issues</h2>
    <h3>Bad Odors</h3>
    <p>
      If your compost smells bad, it's usually due to too much moisture or too many
      green materials. Add more brown materials and turn the pile to increase airflow.
    </p>
    <h3>Slow Decomposition</h3>
    <p>
      If materials aren't breaking down, check that your pile is large enough (at least
      3 cubic feet) and has enough moisture. Also ensure you're turning it regularly.
    </p>
    <h3>Pests</h3>
    <p>
      To discourage pests, bury food scraps in the center of the pile and maintain a
      thick layer of brown materials on top. Avoid adding meat, dairy, or oils.
    </p>

    <h2>Using Your Finished Compost</h2>
    <p>
      Your compost is ready when it's dark, crumbly, and smells earthy. Use it to:
    </p>
    <ul>
      <li>Amend garden soil before planting</li>
      <li>Top-dress lawns and garden beds</li>
      <li>Mix into potting soil for container plants</li>
      <li>Make compost tea for liquid fertilizer</li>
    </ul>
  `,
  coverImage: "/images/blogs/composting-guide-hero.jpg",
  publishedAt: new Date("2024-01-15"),
  author: {
    name: "Sarah Green",
    image: "/images/team/sarah.jpg",
    bio: "Sarah is our resident sustainability expert with over a decade of experience in environmental science and organic gardening. She's passionate about helping others reduce their environmental impact through practical, actionable steps.",
  },
  category: "Green Home & Garden",
  tags: ["Composting", "Zero Waste", "Gardening", "Sustainability", "DIY"],
  readingTime: "8 min read",
}

const recommendedProducts = [
  {
    id: 1,
    title: "Dual Chamber Tumbling Composter",
    description: "Easy-to-use tumbling design with two chambers for continuous composting.",
    image: "/images/products/tumbling-composter.jpg",
    url: "#",
    price: "$99.99",
    rating: 4.7,
    features: [
      "37-gallon capacity",
      "Dual rotating chambers",
      "Adjustable air vents",
      "BPA-free recycled materials",
    ],
    pros: [
      "Easy to turn and maintain",
      "Produces compost quickly",
      "Pest-resistant design",
    ],
    cons: [
      "Assembly required",
      "Higher price point",
    ],
  },
  {
    id: 2,
    title: "Kitchen Compost Collector",
    description: "Odor-free countertop bin for collecting kitchen scraps.",
    image: "/images/products/kitchen-bin.jpg",
    url: "#",
    price: "$34.99",
    rating: 4.8,
    features: [
      "1.3-gallon capacity",
      "Charcoal filter system",
      "Dishwasher-safe",
      "Stainless steel construction",
    ],
    pros: [
      "Completely odor-free",
      "Attractive design",
      "Easy to clean",
    ],
    cons: [
      "Filters need replacement",
      "Limited capacity",
    ],
  },
]

export default function CompostingGuidePage() {
  return (
    <div className="py-10">
      <BlogPost {...blogPost} />
      
      {/* Recommended Products */}
      <div className="mx-auto mt-12 max-w-3xl">
        <h2 className="mb-6 text-2xl font-bold">Recommended Composting Products</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {recommendedProducts.map((product) => (
            <ProductDisplay key={product.id} product={product} detailed />
          ))}
        </div>
      </div>
    </div>
  )
}
