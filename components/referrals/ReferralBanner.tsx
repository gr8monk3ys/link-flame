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
        className={`relative bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 ${className}`}
      >
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Refer a Friend</h3>
            <p className="text-xs text-muted-foreground">
              Give 10% off, get 200 points
            </p>
            <Link href={session ? "/account/referrals" : "/auth/signin"}>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                {session ? "Get Your Code" : "Sign In"}
                <ChevronRight className="ml-1 h-3 w-3" />
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
      className={`relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl overflow-hidden ${className}`}
    >
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
          aria-label="Dismiss banner"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
        {/* Icon and illustration */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <div className="absolute -right-2 -bottom-2 h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold">
            Give 10%, Get 200 Points
          </h2>
          <p className="text-muted-foreground mt-1 max-w-lg">
            Share your unique referral code with friends. They get 10% off their first
            order, and you earn 200 loyalty points when they make a purchase.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-2">
          <Link href={session ? "/account/referrals" : "/auth/signin"}>
            <Button size="lg" className="min-w-[160px]">
              {session ? "Get Your Code" : "Sign Up to Share"}
              <ChevronRight className="ml-2 h-4 w-4" />
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
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
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
      className={`flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10 ${className}`}
    >
      <Gift className="h-5 w-5 text-primary shrink-0" />
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
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
