interface NavItem {
  title: string
  href?: string
  disabled?: boolean
  external?: boolean
  icon?: string
  label?: string
}

interface NavItemWithChildren extends NavItem {
  items: NavItem[]
}

interface DocsConfig {
  mainNav: NavItem[]
  sidebarNav: NavItemWithChildren[]
}

export const docsConfig: DocsConfig = {
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "About Us",
      href: "/about-us",
    },
    {
      title: "Guides & Tips",
      href: "/guides-and-tips",
    },
    {
      title: "Top Picks",
      href: "/top-picks",
    },
    {
      title: "Blog",
      href: "/blogs",
    },
  ],
  sidebarNav: [
    {
      title: "Categories",
      items: [
        {
          title: "Eco-Friendly Products",
          href: "/categories/eco-friendly",
        },
        {
          title: "Sustainable Living",
          href: "/categories/sustainable-living",
        },
        {
          title: "Zero Waste",
          href: "/categories/zero-waste",
        },
        {
          title: "Green Technology",
          href: "/categories/green-tech",
        },
      ],
    },
    {
      title: "Resources",
      items: [
        {
          title: "Getting Started",
          href: "/resources/getting-started",
        },
        {
          title: "Sustainability Guide",
          href: "/resources/sustainability-guide",
        },
        {
          title: "Product Reviews",
          href: "/resources/product-reviews",
        },
      ],
    },
  ],
}
