"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Gift, X, ChevronRight, Users } from "lucide-react";

interface ReferralBannerProps {
  variant?: "full" | "compact";
  dismissible?: boolean;
  className?: string;
}

export function ReferralBanner({
  variant = "full",
  dismissible = true,
  className = "",
}: ReferralBannerProps) {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  // Compact variant - suitable for sidebars or smaller sections
  if (variant === "compact") {
    return (
      <div
        className={`relative rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-4 ${className}`}
      >
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss banner"
          >
            <X className="size-4" />
          </button>
        )}
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Gift className="size-5 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Refer a Friend</h3>
            <p className="text-xs text-muted-foreground">
              Give 10% off, get 200 points
            </p>
            <Link href={session ? "/account/referrals" : "/auth/signin"}>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                {session ? "Get Your Code" : "Sign In"}
                <ChevronRight className="ml-1 size-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Full variant - suitable for main content areas
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent ${className}`}
    >
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-4 z-10 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss banner"
        >
          <X className="size-5" />
        </button>
      )}

      <div className="flex flex-col items-center gap-6 p-6 md:flex-row md:p-8">
        {/* Icon and illustration */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/20">
              <Gift className="size-8 text-primary" />
            </div>
            <div className="absolute -bottom-2 -right-2 flex size-10 items-center justify-center rounded-full bg-green-500/20">
              <Users className="size-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl font-bold md:text-2xl">
            Give 10%, Get 200 Points
          </h2>
          <p className="mt-1 max-w-lg text-muted-foreground">
            Share your unique referral code with friends. They get 10% off their first
            order, and you earn 200 loyalty points when they make a purchase.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-2">
          <Link href={session ? "/account/referrals" : "/auth/signin"}>
            <Button size="lg" className="min-w-[160px]">
              {session ? "Get Your Code" : "Sign Up to Share"}
              <ChevronRight className="ml-2 size-4" />
            </Button>
          </Link>
          {!session && (
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="pointer-events-none absolute right-0 top-0 size-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-3xl" />
    </div>
  );
}

/**
 * Inline referral CTA - for use in product pages or cards
 */
export function ReferralInlineCTA({ className = "" }: { className?: string }) {
  const { data: session } = useSession();

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-primary/10 bg-primary/5 p-3 ${className}`}
    >
      <Gift className="size-5 shrink-0 text-primary" />
      <div className="flex-1 text-sm">
        <span className="font-medium">Refer a friend</span>
        <span className="text-muted-foreground">
          {" "}
          - Give 10% off, earn 200 points
        </span>
      </div>
      <Link href={session ? "/account/referrals" : "/auth/signin"}>
        <Button variant="ghost" size="sm" className="shrink-0">
          Share
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </Link>
    </div>
  );
}
