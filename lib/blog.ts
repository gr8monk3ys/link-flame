export interface Author {
  name: string
  image: string
  bio: string
}

export interface BlogPost {
  slug: string
  title: string
  description: string
  coverImage: string
  publishedAt: Date
  author: Author
  category: string
  tags: string[]
  readingTime: string
  featured?: boolean
}

// This would typically come from a CMS or database
// For now, we'll hardcode some sample posts
export const blogPosts: BlogPost[] = [
  {
    slug: "ultimate-guide-to-composting",
    title: "The Ultimate Guide to Home Composting: Turn Kitchen Waste into Garden Gold",
    description: "Learn everything you need to know about starting and maintaining a successful home composting system. From choosing the right bin to troubleshooting common issues, this comprehensive guide has you covered.",
    coverImage: "/images/blogs/composting-guide-hero.jpg",
    publishedAt: new Date("2024-01-15"),
    author: {
      name: "Sarah Green",
      image: "/images/team/sarah.jpg",
      bio: "Sarah is our resident sustainability expert with over a decade of experience in environmental science and organic gardening.",
    },
    category: "Green Home & Garden",
    tags: ["Composting", "Zero Waste", "Gardening", "Sustainability", "DIY"],
    readingTime: "8 min read",
    featured: true,
  },
  {
    slug: "sustainable-fashion-guide",
    title: "A Complete Guide to Building a Sustainable Wardrobe",
    description: "Discover how to build a wardrobe that's both stylish and sustainable. Learn about eco-friendly materials, ethical brands, and tips for extending the life of your clothes.",
    coverImage: "/images/blogs/sustainable-fashion-hero.jpg",
    publishedAt: new Date("2024-01-10"),
    author: {
      name: "Lisa Chen",
      image: "/images/team/lisa.jpg",
      bio: "Lisa is our fashion and lifestyle expert, passionate about making sustainable living stylish and accessible.",
    },
    category: "Eco Fashion & Beauty",
    tags: ["Fashion", "Sustainability", "Ethical Shopping", "Minimalism"],
    readingTime: "6 min read",
  },
  {
    slug: "zero-waste-kitchen",
    title: "10 Easy Steps to a Zero-Waste Kitchen",
    description: "Transform your kitchen into a zero-waste zone with these practical tips and product recommendations. Reduce your environmental impact while saving money.",
    coverImage: "/images/blogs/zero-waste-kitchen-hero.jpg",
    publishedAt: new Date("2024-01-05"),
    author: {
      name: "Mike Rivers",
      image: "/images/team/mike.jpg",
      bio: "Mike specializes in finding and testing the best eco-friendly products for everyday use.",
    },
    category: "Zero Waste Living",
    tags: ["Zero Waste", "Kitchen", "Sustainability", "DIY"],
    readingTime: "5 min read",
  },
  // Add more sample posts as needed
]

export function getAllPosts(): BlogPost[] {
  return blogPosts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter(post => post.featured)
}

export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter(post => 
    post.category.toLowerCase() === category.toLowerCase()
  ).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
}

export function getPostsByTag(tag: string): BlogPost[] {
  return blogPosts.filter(post => 
    post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  ).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
}

export function searchPosts(query: string): BlogPost[] {
  const searchTerms = query.toLowerCase().split(" ")
  return blogPosts.filter(post => {
    const searchableText = `
      ${post.title} 
      ${post.description} 
      ${post.category} 
      ${post.tags.join(" ")}
    `.toLowerCase()
    
    return searchTerms.every(term => searchableText.includes(term))
  }).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
}
