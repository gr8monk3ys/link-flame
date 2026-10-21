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
 * colour scheme. The strict CSP allows it by SHA-256 hash (lib/csp.ts), so
 * change `INLINE_SCRIPT_HASHES.announcement` whenever this string changes.
 */
export const PRE_PAINT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY
)})==="1")document.documentElement.classList.add(${JSON.stringify(
  DISMISSED_CLASS
)})}catch(e){}`;

/**
 * A hairline-bottomed strip of paper with the three store facts set as wall
 * labels and the rewards link in Moss ink — not a filled band (DESIGN.md →
 * Colors → The One Pen Rule: ink marks action and emphasis, never area).
 */
export function AnnouncementBar({ className }: { className?: string }) {
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
      <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
      <div
        data-announcement-bar=""
        className={cn("border-b border-border bg-background text-foreground", className)}
        role="region"
        aria-label="Store announcement"
      >
        <div className="container flex items-center justify-between gap-3 py-2">
          <div className="label-mono flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Carbon-neutral shipping</span>
            <span aria-hidden>·</span>
            <span>Plastic-free packaging</span>
            <span aria-hidden>·</span>
            <Link
              href="/account/loyalty"
              className="ink-underline label-link text-primary"
            >
              Earn rewards on every order
            </Link>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:text-foreground"
            aria-label="Dismiss announcement"
          >
            <span aria-hidden>×</span>
          </button>
        </div>
      </div>
    </>
  );
}
