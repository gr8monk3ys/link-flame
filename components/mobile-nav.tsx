"use client";

import * as React from "react";
import Link from "next/link";

import { NavItem } from "@/types/nav";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/shared/icons";
import {
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface MobileNavProps {
  className?: string;
  items?: NavItem[];
}

export function MobileNav({ className, items }: MobileNavProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={cn("md:hidden", className)}>
      {mounted && items ? (
        <div className="flex flex-col space-y-2">
          {items.map((item) =>
            item.href ? (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "data-[state=open]:bg-accent-foreground/5 data-[active]:text-foreground"
                )}
              >
                {item.title}
              </Link>
            ) : item.items ? (
              <div key={item.title}>
                <h3 className="text-sm font-medium leading-none">
                  {item.title}
                </h3>
                <ul className="mt-2 flex flex-col space-y-1">
                  {item.items.map((subitem) =>
                    subitem.href ? (
                      <li key={subitem.title}>
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
                      </li>
                    ) : null
                  )}
                </ul>
              </div>
            ) : null
          )}
        </div>
      ) : null}
    </div>
  );
}
