import Link from "next/link"
import { siteConfig } from "@/config/site"
import { Icons } from "@/components/icons"
import { MainNav } from "@/components/main-nav"
import { cn } from "@/lib/utils"

interface SiteHeaderProps {
  className?: string
}

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-40 w-full border-b bg-background", className)}>
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-6">
            {/* Search */}
            <Link
              href="/search"
              className="text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
            >
              <div className="flex items-center space-x-2">
                <Icons.search className="size-5" />
                <span className="sr-only">Search</span>
              </div>
            </Link>

            {/* Account */}
            <Link
              href="/authentication"
              className="text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
            >
              <div className="flex items-center space-x-2">
                <Icons.user className="size-5" />
                <span className="sr-only">Account</span>
              </div>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
            >
              <div className="relative flex items-center space-x-2">
                <Icons.cart className="size-5" />
                <span className="sr-only">Cart</span>
                <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-medium text-white">0</span>
              </div>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
