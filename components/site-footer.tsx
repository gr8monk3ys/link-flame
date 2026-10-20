import Link from "next/link"
import { Icons } from "@/components/shared/icons"
import { Logo } from "@/components/brand/Logo"
import { siteConfig } from "@/config/site"
import { NewsletterSignup } from "@/components/shared/newsletter-signup"
import { cn } from "@/lib/utils"
import { SustainabilityCommitment } from "@/components/sustainability/SustainabilityCommitment"

interface SiteFooterProps {
  className?: string
}

const QUICK_LINKS = [
  { href: "/about-us", label: "About Us" },
  { href: "/blogs", label: "Blog" },
  { href: "/guides-and-tips", label: "Guides & Tips" },
  { href: "/community/join", label: "Join Community" },
  { href: "/write-for-us", label: "Write for Us" },
  { href: "/contact", label: "Contact Us" },
]

const CATEGORY_LINKS = [
  { href: "/guides-and-tips/green-home", label: "Green Home & Garden" },
  { href: "/guides-and-tips/fashion-beauty", label: "Eco Fashion & Beauty" },
  { href: "/guides-and-tips/zero-waste", label: "Zero Waste Living" },
  { href: "/guides-and-tips/sustainable-travel", label: "Sustainable Travel" },
]

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/return-policy", label: "Returns" },
]

const footerLink =
  "ink-underline label-link text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"

/**
 * The footer: a 60% hairline above, an asymmetric `1.1fr / 2fr` split (the
 * shop's own line at the left, four columns at the right), column heads as
 * wall labels, links in body sans with the ink underline, and a hairline
 * before the legal line. No fill change — it is the same paper as the page.
 */
export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={cn("border-t border-border/60", className)}>
      <div className="container py-12 md:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr] lg:gap-16">
          {/* Company Info */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex">
              <Logo size={22} />
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your trusted guide to sustainable living and eco-friendly products.
              Making environmentally conscious choices easier for everyone.
            </p>
            <div className="flex gap-4">
              <a
                href={siteConfig.links.twitter}
                target="_blank"
                rel="noreferrer"
                className="label-link text-muted-foreground transition-colors duration-150 hover:text-primary"
              >
                <Icons.twitter className="size-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
                className="label-link text-muted-foreground transition-colors duration-150 hover:text-primary"
              >
                <Icons.gitHub className="size-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href={siteConfig.links.instagram}
                target="_blank"
                rel="noreferrer"
                className="label-link text-muted-foreground transition-colors duration-150 hover:text-primary"
              >
                <Icons.instagram className="size-5" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {/* Quick Links */}
            <div>
              <h3 className="label-mono mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={footerLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h3 className="label-mono mb-4">Categories</h3>
              <ul className="space-y-2">
                {CATEGORY_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={footerLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sustainability */}
            <div>
              <SustainabilityCommitment variant="footer" />
            </div>

            {/* Newsletter */}
            <div>
              <NewsletterSignup
                title="Stay Connected"
                description="Join our community for eco-friendly tips and exclusive deals."
              />
            </div>
          </div>
        </div>

        {/* Legal line */}
        <div className="mt-12 border-t border-border/60 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="label-mono normal-case tracking-normal">
              &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </div>
            <div className="flex flex-wrap gap-4">
              {LEGAL_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={footerLink}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
