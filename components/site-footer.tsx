"use client"

import Link from "next/link"
import { Icons } from "@/components/shared/icons"
import { siteConfig } from "@/config/site"
import { NewsletterSignup } from "@/components/shared/newsletter-signup"
import { cn } from "@/lib/utils"
import { SustainabilityCommitment } from "@/components/sustainability"

interface SiteFooterProps {
  className?: string
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={cn("border-t bg-background", className)}>
      <div className="container py-12 md:py-16 lg:py-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Icons.logo className="size-6" />
              <span className="font-bold">{siteConfig.name}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your trusted guide to sustainable living and eco-friendly products.
              Making environmentally conscious choices easier for everyone.
            </p>
            <div className="flex space-x-4">
              <a
                href={siteConfig.links.twitter}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <Icons.twitter className="size-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <Icons.gitHub className="size-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href={siteConfig.links.instagram}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <Icons.instagram className="size-5" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about-us"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/blogs"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/guides-and-tips"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Guides & Tips
                </Link>
              </li>
              <li>
                <Link
                  href="/community/join"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Join Community
                </Link>
              </li>
              <li>
                <Link
                  href="/write-for-us"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Write for Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 font-semibold">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/guides-and-tips/green-home"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Green Home & Garden
                </Link>
              </li>
              <li>
                <Link
                  href="/guides-and-tips/fashion-beauty"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Eco Fashion & Beauty
                </Link>
              </li>
              <li>
                <Link
                  href="/guides-and-tips/zero-waste"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Zero Waste Living
                </Link>
              </li>
              <li>
                <Link
                  href="/guides-and-tips/sustainable-travel"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Sustainable Travel
                </Link>
              </li>
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

        {/* Bottom Bar */}
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </div>
            <div className="flex gap-4">
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
