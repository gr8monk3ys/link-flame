"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "linkflame_announcement_dismissed_v1";
const DISMISSED_CLASS = "announcement-dismissed";

/**
 * Runs inline, before the bar is parsed, so a visitor who dismissed the bar
 * never sees it flash. Pairs with the `.announcement-dismissed` rule in
 * globals.css. It is the same pre-hydration trick next-themes uses for the
 * colour scheme, and it needs the CSP nonce for the same reason.
 */
const PRE_PAINT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY
)})==="1")document.documentElement.classList.add(${JSON.stringify(
  DISMISSED_CLASS
)})}catch(e){}`;

export function AnnouncementBar({
  className,
  nonce,
}: {
  className?: string;
  nonce?: string;
}) {
  // The bar is in the server HTML. It used to start `dismissed` and appear
  // after hydration, which pushed the whole page down by its height (a 0.10
  // layout shift on mobile) and repainted the hero on every visit.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isDismissed = false;
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      isDismissed = value === "1";
    } catch {
      isDismissed = false;
    }
    if (isDismissed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(true);
    }
  }, []);

  const onDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (dismissed) return null;

  return (
    <>
      <script nonce={nonce} dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
      <div
        data-announcement-bar=""
        className={cn(
          "border-b border-emerald-900/10 bg-gradient-to-r from-emerald-700 to-green-700 text-white",
          className
        )}
        role="region"
        aria-label="Store announcement"
      >
        <div className="container flex items-center justify-between gap-3 py-2 text-sm">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="text-white/90">
                ●
              </span>
              Carbon-neutral shipping
            </span>
            <span className="text-white/70" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="text-white/90">
                ●
              </span>
              Plastic-free packaging
            </span>
            <span className="text-white/70" aria-hidden>
              ·
            </span>
            <Link
              href="/account/loyalty"
              className="font-medium underline decoration-white/50 underline-offset-4 hover:decoration-white"
            >
              Earn rewards on every order
            </Link>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="rounded-md px-2 py-1 text-white/90 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Dismiss announcement"
          >
            <span aria-hidden>×</span>
          </button>
        </div>
      </div>
    </>
  );
}
