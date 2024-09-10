"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { X, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * WelcomeBonusNotification
 *
 * Displays a notification when a new user signs up and receives their welcome bonus.
 * Automatically appears when the URL contains ?welcome=true&bonus=200 query params.
 *
 * The notification can be dismissed and won't reappear for that session.
 */
export function WelcomeBonusNotification() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const isWelcome = searchParams.get("welcome") === "true";
  const bonusPoints = searchParams.get("bonus");

  useEffect(() => {
    if (isWelcome && bonusPoints) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isWelcome, bonusPoints]);

  const handleDismiss = () => {
    setIsClosing(true);
    // Wait for animation to complete
    setTimeout(() => {
      setIsVisible(false);
      // Clean up URL params
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      url.searchParams.delete("bonus");
      router.replace(url.pathname, { scroll: false });
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-md transition-all duration-300 ${
        isClosing ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="relative overflow-hidden rounded-lg border border-green-200 bg-white p-4 shadow-lg">
        {/* Confetti-like decoration */}
        <div className="absolute -right-2 -top-2 size-20 rotate-12 rounded-full bg-gradient-to-br from-green-100 to-green-50 opacity-50" />
        <div className="absolute -bottom-4 -left-4 size-16 -rotate-12 rounded-full bg-gradient-to-tr from-yellow-100 to-yellow-50 opacity-50" />

        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Dismiss notification"
        >
          <X className="size-4" />
        </button>

        <div className="relative flex gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100">
            <Gift className="size-6 text-green-600" />
          </div>

          <div className="flex-1 pr-6">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Welcome to Link Flame!</h3>
              <Sparkles className="size-4 text-yellow-500" />
            </div>
            <p className="mt-1 text-sm text-gray-600">
              You have earned <span className="font-bold text-green-600">{bonusPoints} bonus points</span> for joining our community!
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Use your points for discounts on eco-friendly products.
            </p>

            <div className="mt-3 flex gap-2">
              <Link href="/account/loyalty">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  View My Points
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
