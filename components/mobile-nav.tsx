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

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileNav({ className, items, onClose }: MobileNavProps) {
  const panelRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  // The parent passes a fresh inline callback each render; read it through a
  // ref so the keydown listener is attached once, not on every render.
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Lock body scroll while open, move focus into the dialog, and hand focus
  // back to whatever opened it (the menu button) when it closes.
  React.useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, []);

  // Escape closes; Tab and Shift+Tab stay inside the dialog (aria-modal).
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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
        ref={panelRef}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-background shadow-xl md:hidden",
          "duration-200 animate-in slide-in-from-right",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between border-b p-4">
          <span className="text-sm font-semibold">Menu</span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-md p-2 hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
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
