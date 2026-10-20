import { siteConfig } from "@/config/site"
import { MainNav } from "@/components/main-nav"
import { CartLink } from "@/components/cart-link"
import { LoyaltyBadge } from "@/components/loyalty/LoyaltyBadge"
import { cn } from "@/lib/utils"
import { HeaderSearch } from "@/components/search/HeaderSearch"
import { AnnouncementBar } from "@/components/announcement-bar"
import { AccountLink } from "@/components/account-link"
import { Suspense } from "react"

interface SiteHeaderProps {
  className?: string
}

/**
 * The header sheet: sticky, 72px, 90% paper with a 12px blur and a 40%
 * hairline beneath. It is the one glass surface and carries one of the two
 * sanctioned shadows (DESIGN.md → Elevation → The Two Sheets Rule), so it
 * reads as a separate sheet when the page scrolls under it. Both exceptions
 * are allowlisted by file in scripts/check-design-system.mjs.
 */
export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border/40 bg-background/90 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md",
        className
      )}
    >
      <AnnouncementBar />
      <div className="container flex h-18 items-center justify-between">
        <MainNav items={siteConfig.mainNav} />
        <nav className="flex items-center gap-1.5 sm:gap-3" aria-label="Account and cart">
          {/* Predictive Search */}
          <Suspense
            fallback={
              <span aria-hidden="true" className="inline-flex size-8 rounded-full border border-border bg-card sm:size-9" />
            }
          >
            <HeaderSearch />
          </Suspense>

          {/* Loyalty Badge - Shows points and tier for authenticated users */}
          <LoyaltyBadge compact className="hidden sm:flex" />

          {/* Account */}
          <AccountLink />

          {/* Cart */}
          <CartLink />
        </nav>
      </div>
    </header>
  )
}
