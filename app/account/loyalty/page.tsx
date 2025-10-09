"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoyaltyDashboard } from "@/components/loyalty";
import { ChevronLeft, Loader2 } from "lucide-react";

export default function LoyaltyPage() {
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const isSignedIn = !!session;

  if (!isLoaded) {
    return (
      <div className="container flex items-center justify-center py-10">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to access your loyalty rewards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      {/* Back navigation */}
      <Link
        href="/account"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to Account
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Loyalty Rewards</h1>
        <p className="mt-2 text-muted-foreground">
          Earn points on every purchase and redeem them for discounts.
          The more you shop sustainably, the more you save!
        </p>
      </div>

      {/* Loyalty Dashboard */}
      <LoyaltyDashboard />
    </div>
  );
}
