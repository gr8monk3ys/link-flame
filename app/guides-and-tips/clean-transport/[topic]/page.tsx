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
    title: `${topic} | Clean Transportation | LinkFlame`,
    description: `Sustainable transportation guidance on ${topic.toLowerCase()}.`,
  };
}

export default function CleanTransportTopicPage({
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
          <Link href="/guides-and-tips/clean-transport" className="hover:underline">
            Clean Transportation
          </Link>
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold md:text-4xl">{topic}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          This guide is in progress. Here are a few options you can act on today to reduce travel
          impact.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Quick wins</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Prefer walking, transit, and cycling for short trips.</li>
            <li>When driving, combine errands and keep tires properly inflated.</li>
            <li>If you buy new gear, choose durable and repairable options.</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/guides-and-tips/clean-transport">Back to Clean Transport</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/collections">Shop products</Link>
            </Button>
          </div>
        </Card>

        <NewsletterSignup
          title="Get Transport Updates"
          description="EV basics, charging tips, and sustainable travel checklists."
        />
      </div>
    </div>
  );
}

