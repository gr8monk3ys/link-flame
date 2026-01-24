"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImpactDashboard } from "@/components/impact";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function AccountImpactPage() {
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
              Please sign in to view your environmental impact.
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
    <div className="container max-w-6xl py-10">
      {/* Back link */}
      <div className="mb-6">
        <Link href="/account">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Back to Account
          </Button>
        </Link>
      </div>

      {/* Impact Dashboard */}
      <ImpactDashboard />

      {/* Additional Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How We Calculate Your Impact</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            Every eco-friendly product you purchase has a measurable positive
            impact on the environment. We track several key metrics:
          </p>
          <ul>
            <li>
              <strong>Plastic Bottles Saved:</strong> Each reusable item
              replaces disposable alternatives, reducing plastic waste.
            </li>
            <li>
              <strong>Single-Use Items Replaced:</strong> From shopping bags to
              coffee cups, your sustainable choices add up.
            </li>
            <li>
              <strong>Carbon Offset:</strong> Measured in kg of CO2, this
              reflects the environmental benefit of choosing sustainable
              products.
            </li>
            <li>
              <strong>Trees Planted:</strong> Through our partnerships, a
              portion of every sale contributes to reforestation efforts.
            </li>
            <li>
              <strong>Water Saved:</strong> Eco-friendly products often require
              less water to produce and use.
            </li>
            <li>
              <strong>Waste Diverted:</strong> Products designed for reuse keep
              waste out of landfills.
            </li>
          </ul>
          <p>
            Your cumulative impact is calculated based on your purchase history
            and the environmental benefits of each product. Keep shopping
            sustainably to see your impact grow!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
