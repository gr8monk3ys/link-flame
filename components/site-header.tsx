import Link from "next/link"
import { siteConfig } from "@/config/site"
import { Icons } from "@/components/shared/icons"
import { MainNav } from "@/components/main-nav"
import { CartLink } from "@/components/cart-link"
import { LoyaltyBadge } from "@/components/loyalty"
import { cn } from "@/lib/utils"
import { HeaderSearch } from "@/components/search/HeaderSearch"

interface SiteHeaderProps {
  className?: string
}

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-md", className)}>
      <div className="container flex h-[4.5rem] items-center justify-between">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex items-center space-x-4">
          <nav className="flex items-center space-x-4 sm:space-x-6">
            {/* Predictive Search */}
            <HeaderSearch />

            {/* Loyalty Badge - Shows points and tier for authenticated users */}
            <LoyaltyBadge compact className="hidden sm:flex" />

            {/* Account */}
            <Link
              href="/authentication"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <div className="flex items-center space-x-2">
                <Icons.user className="size-5" />
                <span className="sr-only">Account</span>
              </div>
            </Link>

            {/* Cart */}
            <CartLink className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary" />
          </nav>
        </div>
      </div>
    </header>
  )
}
