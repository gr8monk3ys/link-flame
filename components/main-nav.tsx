import * as React from "react"
import Link from "next/link"

import { NavItem } from "@/types/nav"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"

interface MainNavProps {
  items?: NavItem[]
}

export function MainNav({ items }: MainNavProps) {
  return (
    <div className="flex min-w-0 gap-6 md:gap-10">
      <Link href="/" className="flex items-center space-x-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Icons.logo className="size-6" aria-hidden="true" />
        <span className="sr-only font-bold sm:not-sr-only">{siteConfig.name}</span>
      </Link>
      {items?.length ? (
        <nav aria-label="Main" className="flex min-w-0 gap-4 overflow-x-auto md:gap-6">
          {items?.map(
            (item) =>
              item.href && (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-disabled={item.disabled || undefined}
                  className={cn(
                    "flex shrink-0 items-center whitespace-nowrap rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    item.disabled && "cursor-not-allowed opacity-80"
                  )}
                >
                  {item.title}
                </Link>
              )
          )}
        </nav>
      ) : null}
    </div>
  )
}
