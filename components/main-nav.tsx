"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as NavigationMenu from "@radix-ui/react-navigation-menu"
import { ChevronDown } from "lucide-react"

import type { NavItem } from "@/types/nav"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"

interface MainNavProps {
  items?: NavItem[]
}

export function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

const topLevelClass =
  "inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent data-[state=open]:text-accent-foreground aria-[current=page]:text-foreground"

export function MainNav({ items }: MainNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex min-w-0 items-center gap-6">
      <Link
        href="/"
        className="flex items-center space-x-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icons.logo className="size-6" aria-hidden="true" />
        <span className="font-bold">{siteConfig.name}</span>
      </Link>
      {items?.length ? (
        <NavigationMenu.Root aria-label="Main" className="relative hidden lg:block">
          <NavigationMenu.List className="flex items-center gap-1">
            {items.map((item) =>
              item.items?.length ? (
                <NavigationMenu.Item key={item.title}>
                  <NavigationMenu.Trigger
                    className={cn(
                      topLevelClass,
                      "group",
                      item.items.some((sub) => isActivePath(pathname, sub.href)) &&
                        "text-foreground"
                    )}
                  >
                    {item.title}
                    <ChevronDown
                      aria-hidden="true"
                      className="size-3 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                    />
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content className="absolute left-0 top-full mt-2 w-[22rem] rounded-md border bg-popover p-2 text-popover-foreground shadow-lg">
                    <ul className="grid gap-1">
                      {item.items.map((sub) => (
                        <li key={sub.href}>
                          <NavigationMenu.Link
                            asChild
                            active={isActivePath(pathname, sub.href)}
                          >
                            <Link
                              href={sub.href}
                              aria-current={
                                isActivePath(pathname, sub.href) ? "page" : undefined
                              }
                              className="block rounded-md p-3 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <span className="block text-sm font-medium">{sub.title}</span>
                              {sub.description ? (
                                <span className="mt-1 block text-sm leading-snug text-muted-foreground">
                                  {sub.description}
                                </span>
                              ) : null}
                            </Link>
                          </NavigationMenu.Link>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              ) : item.href ? (
                <NavigationMenu.Item key={item.href}>
                  <NavigationMenu.Link asChild active={isActivePath(pathname, item.href)}>
                    <Link
                      href={item.href}
                      aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                      aria-disabled={item.disabled || undefined}
                      className={cn(topLevelClass, item.disabled && "pointer-events-none opacity-60")}
                    >
                      {item.title}
                    </Link>
                  </NavigationMenu.Link>
                </NavigationMenu.Item>
              ) : null
            )}
          </NavigationMenu.List>
        </NavigationMenu.Root>
      ) : null}
    </div>
  )
}
