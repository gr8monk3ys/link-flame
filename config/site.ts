export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Next.js",
  description:
    "Beautifully designed components built with Radix UI and Tailwind CSS.",
  mainNav: [
    {
      title: "Home",
      href: "/",
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
