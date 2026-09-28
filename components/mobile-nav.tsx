"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import { Menu, X } from "lucide-react"

import type { NavItem } from "@/types/nav"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { isActivePath } from "@/components/main-nav"

interface MobileNavProps {
  items: NavItem[]
}

const linkClass =
  "flex min-h-11 items-center rounded-md px-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground"

/**
 * Below the `lg` breakpoint the desktop nav is hidden; this renders a menu
 * button that opens the full navigation (including dropdown items) in a
 * modal sheet. Radix Dialog provides the focus trap, Escape to close,
 * focus return to the trigger and aria-modal semantics.
 */
export function MobileNav({ items }: MobileNavProps) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const idPrefix = React.useId()

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="inline-flex size-10 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col overflow-y-auto overscroll-contain border-l bg-background p-4 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right motion-reduce:animate-none"
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="px-3 text-lg font-semibold">{siteConfig.name}</Dialog.Title>
            <Dialog.Close
              className="inline-flex size-10 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close menu"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <nav aria-label="Main">
            <ul className="space-y-1">
              {items.map((item, index) =>
                item.items?.length ? (
                  <li key={item.title} className="pt-2">
                    <h2
                      id={`${idPrefix}-${index}`}
                      className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {item.title}
                    </h2>
                    <ul aria-labelledby={`${idPrefix}-${index}`} className="space-y-1">
                      {item.items.map((sub) => (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            onClick={() => setOpen(false)}
                            aria-current={isActivePath(pathname, sub.href) ? "page" : undefined}
                            className={cn(linkClass, "pl-6")}
                          >
                            {sub.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : item.href ? (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                      className={linkClass}
                    >
                      {item.title}
                    </Link>
                  </li>
                ) : null
              )}
            </ul>
          </nav>
          <div className="mt-6 border-t pt-4">
            <Link
              href="/authentication"
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              Log in or sign up
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
