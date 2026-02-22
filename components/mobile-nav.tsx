"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { NavItem } from "@/types/nav";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  className?: string;
  items?: NavItem[];
  onClose: () => void;
}

export function MobileNav({ className, items, onClose }: MobileNavProps) {
  // Lock body scroll while open
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <nav
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 bg-background shadow-xl md:hidden",
          "animate-in slide-in-from-right duration-200",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between border-b p-4">
          <span className="text-sm font-semibold">Menu</span>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {items ? (
            <div className="flex flex-col space-y-1">
              {items.map((item) =>
                item.href ? (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={onClose}
                    className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    {item.title}
                  </Link>
                ) : item.items ? (
                  <div key={item.title} className="space-y-1">
                    <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.title}
                    </h3>
                    {item.items.map((subitem) =>
                      subitem.href ? (
                        <Link
                          key={subitem.title}
                          href={subitem.href}
                          onClick={onClose}
                          className="block rounded-md px-3 py-2 pl-6 text-sm transition-colors hover:bg-muted"
                        >
                          <span className="font-medium">{subitem.title}</span>
                          {subitem.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {subitem.description}
                            </p>
                          )}
                        </Link>
                      ) : null
                    )}
                  </div>
                ) : null
              )}
            </div>
          ) : null}
        </div>
      </nav>
    </>
  );
}
