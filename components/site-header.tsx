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
      <div className="container flex h-16 items-center justify-between">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex items-center space-x-4">
          <nav className="flex items-center space-x-6">
            {/* Search */}
            <Link
              href="/search"
              className="flex items-center font-medium text-sm text-muted-foreground hover:text-primary transition-colors"
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
              className="relative flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <Icons.cart className="size-5" />
              <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-green-600 text-[10px] font-medium text-white">0</span>
            </Link>
          </nav>
          <Link
            href="/search"
            className="font-medium text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Icons.search className="size-5" />
          </Link>
          <Link
            href="/cart"
            className="relative font-medium text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Icons.cart className="size-5" />
            {0 > 0 && (
              <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-green-600 text-[10px] font-medium text-white">
                {0}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
