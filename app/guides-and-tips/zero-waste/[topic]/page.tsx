import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NewsletterSignup } from "@/components/shared/newsletter-signup";

function humanize(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export function generateMetadata({
  params,
}: {
  params: { topic: string };
}): Metadata {
  const topic = humanize(params.topic);
  return {
    title: `${topic} | Zero Waste Living | LinkFlame`,
    description: `Practical zero-waste guidance on ${topic.toLowerCase()}.`,
  };
}

export default function ZeroWasteTopicPage({
  params,
}: {
  params: { topic: string };
}) {
  const topic = humanize(params.topic);

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          <Link href="/guides-and-tips" className="hover:underline">
            Guides & Tips
          </Link>{" "}
          <span aria-hidden>·</span>{" "}
          <Link href="/guides-and-tips/zero-waste" className="hover:underline">
            Zero Waste Living
          </Link>
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold md:text-4xl">{topic}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          We are expanding this page. Until then, here is a simple framework that works for most
          households.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">A simple framework</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Start with the biggest recurring waste in your week.</li>
            <li>Swap one item at a time, and pick the version you will keep using.</li>
            <li>Focus on systems: refills, reusables, and routines.</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/guides-and-tips/zero-waste">Back to Zero Waste</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/collections?values=zero-waste">Shop zero-waste</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/community/join">Join the community</Link>
            </Button>
          </div>
        </Card>

        <NewsletterSignup
          title="Get Zero Waste Tips"
          description="Monthly checklists and simple swaps that stick."
        />
      </div>
    </div>
  );
}

