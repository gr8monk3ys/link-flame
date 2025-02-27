import Link from "next/link"
import { siteConfig } from "@/config/site"
import { Icons } from "@/components/shared/icons"
import { MainNav } from "@/components/main-nav"
import { CartLink } from "@/components/cart-link"
import { cn } from "@/lib/utils"

interface SiteHeaderProps {
  className?: string
}

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-40 w-full border-b bg-background", className)}>
      <div className="container flex h-16 items-center justify-between">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex items-center space-x-4">
          <nav className="flex items-center space-x-6">
            {/* Search */}
            <Link
              href="/search"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <div className="flex items-center space-x-2">
                <Icons.search className="size-5" />
                <span className="sr-only">Search</span>
              </div>
            </Link>

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
