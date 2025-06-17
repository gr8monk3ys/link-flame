import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsletterSignup } from "@/components/shared/newsletter-signup";

export const metadata: Metadata = {
  title: "Join the Community | LinkFlame",
  description:
    "Join LinkFlame's community to get sustainable living tips, early drops, and exclusive rewards.",
};

export default function JoinCommunityPage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-10">
        <h1 className="font-serif text-3xl font-semibold md:text-4xl">Join the LinkFlame Community</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Get eco-friendly tips, curated product drops, and a little extra motivation to keep your
          sustainable habits going.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Eco Tips</CardTitle>
            <CardDescription>Practical, low-effort wins you can actually keep.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Early Drops</CardTitle>
            <CardDescription>Be first in line for limited bundles and imperfect deals.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
            <CardDescription>Earn points on purchases and redeem for discounts.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Save wishlists, track orders, and unlock rewards.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link href="/auth/signup">Sign up</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browse eco-living guides</CardTitle>
            <CardDescription>Zero waste, clean transport, and a greener home.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/guides-and-tips">Explore guides</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <NewsletterSignup
          title="Stay in Touch"
          description="Get updates on new arrivals, sales, and eco-living guides."
        />
      </div>
    </div>
  );
}

