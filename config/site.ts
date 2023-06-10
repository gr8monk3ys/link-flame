export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "LinkFlame",
  description:
    "A place to know where all good products come from",
  mainNav: [
    {
      title: "Top Picks",
      href: "/top-picks",
    },
    {
      title: "Guides and Tips",
      href: "/guides-and-tips",
    },
    {
      title: "About Us",
      href: "/about-us",
    },
  ],
  links: {
    github: "https://github.com/gr8monk3ys/LinkFlame",
    docs: "https://ui.shadcn.com",
  },
}
