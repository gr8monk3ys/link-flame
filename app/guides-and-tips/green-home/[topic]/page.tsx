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
    title: `${topic} | Green Home & Garden | LinkFlame`,
    description: `Eco-friendly guidance on ${topic.toLowerCase()} for a greener home.`,
  };
}

export default function GreenHomeTopicPage({
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
          <Link href="/guides-and-tips/green-home" className="hover:underline">
            Green Home & Garden
          </Link>
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold md:text-4xl">{topic}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          We are building this guide. In the meantime, here are the best next steps to keep moving
          toward a greener home.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Recommended next steps</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Start with the highest impact: insulation, efficient appliances, and smart usage.</li>
            <li>Prefer durable, repairable products over single-use replacements.</li>
            <li>Track wins: energy usage, waste reduction, and water savings.</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/guides-and-tips/green-home">Back to Green Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/collections">Shop products</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/blogs">Read the blog</Link>
            </Button>
          </div>
        </Card>

        <NewsletterSignup
          title="Get Green Home Tips"
          description="Monthly guides and practical checklists, straight to your inbox."
        />
      </div>
    </div>
  );
}

