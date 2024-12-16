import { Post } from "@/types/post"

// Mock data for blog posts
const posts: Post[] = [
  {
    title: "Ultimate Guide to Composting",
    slug: "ultimate-guide-to-composting",
    coverImage: "/images/blog/composting.jpg",
    description: "Learn everything you need to know about starting and maintaining a successful compost system.",
    date: "2024-01-15",
    author: {
      name: "Emma Green",
      image: "/images/authors/emma.jpg",
      bio: "Sustainability expert and urban gardening enthusiast"
    },
    category: "Green Home",
    tags: ["composting", "gardening", "zero-waste"],
    featured: true,
    content: "Full article content here..."
  },
  {
    title: "10 Easy Swaps for a Zero-Waste Bathroom",
    slug: "zero-waste-bathroom-swaps",
    coverImage: "/images/blog/bathroom.jpg",
    description: "Simple switches to reduce waste in your daily bathroom routine.",
    date: "2024-01-10",
    author: {
      name: "Sarah Chen",
      image: "/images/authors/sarah.jpg",
      bio: "Zero-waste lifestyle advocate"
    },
    category: "Zero Waste",
    tags: ["zero-waste", "bathroom", "sustainable-living"],
    featured: false,
    content: "Full article content here..."
  },
  {
    title: "Sustainable Fashion: Building a Capsule Wardrobe",
    slug: "sustainable-fashion-capsule-wardrobe",
    coverImage: "/images/blog/fashion.jpg",
    description: "How to create a versatile and eco-friendly wardrobe that lasts.",
    date: "2024-01-05",
    author: {
      name: "Maya Johnson",
      image: "/images/authors/maya.jpg",
      bio: "Sustainable fashion consultant"
    },
    category: "Fashion & Beauty",
    tags: ["fashion", "sustainable-living", "minimalism"],
    featured: true,
    content: "Full article content here..."
  }
]

export async function getAllPosts(): Promise<Post[]> {
  // In a real application, this would fetch posts from a database or CMS
  return posts
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  return posts.find(post => post.slug === slug)
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  return posts.filter(post => 
    post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  )
}

export async function getFeaturedPosts(): Promise<Post[]> {
  return posts.filter(post => post.featured)
}

export async function getPostsByCategory(category: string): Promise<Post[]> {
  return posts.filter(post => 
    post.category.toLowerCase() === category.toLowerCase()
  )
}

export function getAllTags(): string[] {
  const tags = new Set(posts.flatMap(post => post.tags))
  return Array.from(tags)
}

export function getAllCategories(): string[] {
  const categories = new Set(posts.map(post => post.category))
  return Array.from(categories)
}
