"use client";

import * as React from "react";
import Link from "next/link";

import { NavItem } from "@/types/nav";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/shared/icons";
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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={cn("flex gap-6 md:gap-10", className)}>
      <Link href="/" className="flex items-center space-x-2">
        <Icons.logo className="size-6" />
        <span className="inline-block font-bold">{siteConfig.name}</span>
      </Link>
      {mounted && items ? (
        <NavigationMenu>
          <NavigationMenuList>
            {items.map((item) =>
              item.href ? (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "data-[state=open]:bg-accent-foreground/5 data-[active]:text-foreground"
                      )}
                    >
                      {item.title}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : item.items ? (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuTrigger className={navigationMenuTriggerStyle()}>
                    {item.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-6 md:w-[500px] lg:w-[600px] lg:grid-cols-2">
                      {item.items.map((subitem) =>
                        subitem.href ? (
                          <li key={subitem.title}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={subitem.href}
                                className="block select-none space-y-1 rounded-md p-3 leading-none outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
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
  );
}
