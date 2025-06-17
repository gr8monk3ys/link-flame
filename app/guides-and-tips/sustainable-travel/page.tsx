import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NewsletterSignup } from "@/components/shared/newsletter-signup";

export const metadata: Metadata = {
  title: "Sustainable Travel | LinkFlame",
  description:
    "Simple, practical tips to travel lighter: reduce emissions, pack smarter, and support local communities.",
};

export default function SustainableTravelPage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-10 text-center">
        <h1 className="mb-4 font-serif text-3xl font-semibold md:text-4xl">Sustainable Travel</h1>
        <p className="text-lg text-muted-foreground">
          Travel can be incredible and lower-impact. Start with a few high-leverage habits.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">1. Choose lower-impact transport</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            When possible, take trains or buses, carpool, and bundle errands. If flying is necessary,
            pick direct routes and pack light.
          </p>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href="/guides-and-tips/clean-transport">Explore clean transport</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold">2. Pack reusables</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A few items reduce a lot of waste: bottle, tote, utensils, and a small container.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/bundles">Build a travel kit</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/collections?values=zero-waste">Shop zero-waste</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold">3. Support local, ethical businesses</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Look for locally owned, women-owned, and small business options. Spend where your dollars
            keep value in the community.
          </p>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href="/collections?values=small-business,women-owned">Shop by values</Link>
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-12">
        <NewsletterSignup
          title="Get Travel Tips"
          description="Monthly checklists, packing guides, and sustainable travel updates."
        />
      </div>
    </div>
  );
}

