"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { NavItem } from "@/types/nav";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { MobileNav } from "@/components/mobile-nav";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface MainNavProps {
  className?: string;
  items?: NavItem[];
}

export function MainNav({ className, items }: MainNavProps) {
  // The desktop menu used to be gated on a `mounted` flag, so the server sent
  // an empty <div> and the links appeared a frame after hydration - the header
  // grew from 116x24 to 518x40 in front of the reader. Radix's NavigationMenu
  // renders the same markup on both sides, so there is nothing to gate on.
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  return (
    <div className={cn("flex items-center gap-6 md:gap-10", className)}>
      {/* The horizontal lockup: the leaf-flame plate beside "Link Flame" in
          Fraunces, the mark as tall as the wordmark's capitals. */}
      <Link href="/" className="flex items-center">
        <Logo size={22} />
      </Link>
      <button
        type="button"
        className="cta-secondary size-9 rounded-full md:hidden"
        onClick={() => setShowMobileMenu((v) => !v)}
        aria-label={showMobileMenu ? "Close menu" : "Open menu"}
        aria-expanded={showMobileMenu}
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>
      <div className="hidden md:flex">
        {items ? (
          <NavigationMenu>
            <NavigationMenuList>
              {items.map((item) =>
                item.href ? (
                  <NavigationMenuItem key={item.title}>
                    <NavigationMenuLink asChild>
                      <Link href={item.href} className={navigationMenuTriggerStyle()}>
                        {item.title}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ) : item.items ? (
                  <NavigationMenuItem key={item.title}>
                    <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] lg:w-[600px] lg:grid-cols-2">
                        {item.items.map((subitem) =>
                          subitem.href ? (
                            <li key={subitem.title}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={subitem.href}
                                  className="block select-none space-y-1 rounded-lg border border-transparent p-3 leading-none transition-colors duration-150 hover:border-border hover:bg-accent focus:bg-accent"
                                >
                                  <div className="text-sm font-medium leading-none">
                                    {subitem.title}
                                  </div>
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {subitem.description}
                                  </p>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ) : null
                        )}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ) : null
              )}
            </NavigationMenuList>
          </NavigationMenu>
        ) : null}
      </div>
      {showMobileMenu && <MobileNav items={items} onClose={() => setShowMobileMenu(false)} />}
    </div>
  );
}
