export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "LinkFlame",
  description:
    "A place to know where all good products come from",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Product Review",
      href: "/productReview",
    },
    {
      title: "Blog",
      href: "/blog",
    },
    {
      title: "About Us",
      href: "/aboutUs",
    },
    {
      title: "Authentication",
      href: "/authentication",
    },
  ],
  links: {
    twitter: "https://twitter.com/gr8monk3ys",
    github: "https://github.com/gr8monk3ys",
    docs: "https://ui.shadcn.com",
  },
}
