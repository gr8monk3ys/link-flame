"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "linkflame_announcement_dismissed_v1";

export function AnnouncementBar({
  className,
}: {
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    let isDismissed = false;
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      isDismissed = value === "1";
    } catch {
      isDismissed = false;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(isDismissed);
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
    <div
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
  );
}
