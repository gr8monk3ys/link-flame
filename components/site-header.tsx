import Link from "next/link"

import { siteConfig } from "@/config/site"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SiteHeaderProps {
  className?: string
}

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-40 w-full border-b bg-background", className)}>
      <div className="container flex h-16 items-center gap-4 sm:justify-between">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex shrink-0 items-center justify-end sm:flex-1">
          <div className="flex items-center space-x-1">
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({
                size: "sm",
                variant: "ghost",
              })}
            >
              <Icons.gitHub className="size-5" aria-hidden="true" />
              <span className="sr-only">GitHub</span>
            </Link>
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/authentication">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/authentication">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
