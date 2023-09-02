import { getBaseUrl } from "@/lib/url"

export type SiteConfig = typeof siteConfig

// Determine the base URL based on the environment
const baseUrl = getBaseUrl()

export const siteConfig = {
  name: "LinkFlame",
  description: "Your trusted source for eco-friendly living and sustainable product recommendations.",
  url: baseUrl,
  mainNav: [
    {
      title: "Shop",
      items: [
        {
          title: "All Products",
          href: "/products",
          description: "Browse our full catalog of eco-friendly essentials",
        },
        {
          title: "Shop by Values",
          href: "/collections",
          description: "Filter by sustainability values like zero-waste and plastic-free",
        },
        {
          title: "Subscribe & Save",
          href: "/collections?subscribable=true",
          description: "Recurring deliveries with built-in savings on essentials",
        },
        {
          title: "Bundles (Build a Kit)",
          href: "/bundles",
          description: "Curated kits to make switching easier",
        },
        {
          title: "Perfectly Imperfect",
          href: "/imperfect",
          description: "Save on items with minor cosmetic imperfections",
        },
        {
          title: "Gift Cards",
          href: "/gift-cards",
          description: "Sustainable gifting made simple",
        },
      ],
    },
    {
      title: "Brands",
      href: "/brands",
    },
    {
      title: "Company",
      items: [
        {
          title: "About us",
          href: "/about-us",
          description: "Learn more about our story and values",
        },
        {
          title: "Blog",
          href: "/blogs",
          description: "Read our latest eco-friendly news and insights",
        },
        {
          title: "Guides & Tips",
          href: "/guides-and-tips",
          description: "Sustainable living tips and guides",
        },
        {
          title: "FAQ",
          href: "/faq",
          description: "Frequently asked questions about eco-friendly products and services",
        },
        {
          title: "Plans",
          href: "/billing/plans",
          description: "Subscription plans for teams and organizations",
        },
      ],
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
        {
          title: "Clean Transportation",
          href: "/guides-and-tips/clean-transport",
          description: "Lower-impact travel, EV basics, and charging guides",
        },
        {
          title: "Sustainable Travel",
          href: "/guides-and-tips/sustainable-travel",
          description: "Pack lighter, waste less, and support local communities",
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
