export type SiteConfig = typeof siteConfig

// Determine the base URL based on the environment
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
  || (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : 'https://linkflame.com')

export const siteConfig = {
  name: "LinkFlame",
  description: "Your trusted source for eco-friendly living and sustainable product recommendations.",
  url: baseUrl,
  mainNav: [
    {
      title: "Shop",
      href: "/collections",
    },
    {
      title: "About Us",
      href: "/about-us",
    },
    {
      title: "Eco Living",
      items: [
        {
          title: "Green Home & Garden",
          href: "/guides-and-tips/green-home",
          description: "Sustainable home solutions and eco-friendly gardening tips",
        },
        {
          title: "Fashion & Beauty",
          href: "/guides-and-tips/fashion-beauty",
          description: "Sustainable fashion and natural beauty products",
        },
        {
          title: "Zero Waste",
          href: "/guides-and-tips/zero-waste",
          description: "Tips and products for a zero-waste lifestyle",
        },
      ],
    },
    {
      title: "Guides & Tips",
      href: "/guides-and-tips",
    },
    {
      title: "Reviews",
      href: "/reviews",
    },
    {
      title: "Blog",
      href: "/blogs",
    },
    {
      title: "Community",
      items: [
        {
          title: "Join Membership",
          href: "/community/join",
          description: "Access exclusive content and community features",
        },
        {
          title: "Success Stories",
          href: "/community/stories",
          description: "Real stories from our eco-conscious community",
        },
        {
          title: "Events",
          href: "/community/events",
          description: "Workshops, webinars, and community meetups",
        },
      ],
    },
  ],
  links: {
    twitter: "https://twitter.com/linkflame",
    github: "https://github.com/gr8monk3ys/link-flame",
    docs: "/docs",
    instagram: "https://instagram.com/linkflame",
    pinterest: "https://pinterest.com/linkflame",
  },
}
