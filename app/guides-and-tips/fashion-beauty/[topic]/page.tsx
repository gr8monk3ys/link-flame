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
    title: `${topic} | Fashion & Beauty | LinkFlame`,
    description: `Clean beauty and sustainable fashion guidance on ${topic.toLowerCase()}.`,
  };
}

export default function FashionBeautyTopicPage({
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
          <Link href="/guides-and-tips/fashion-beauty" className="hover:underline">
            Fashion & Beauty
          </Link>
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold md:text-4xl">{topic}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          This topic page is being expanded. For now, here are a few simple principles that keep
          you on track.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Principles that work</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Buy fewer, higher-quality items you will actually wear or finish.</li>
            <li>Look for refillable, recyclable, and plastic-free packaging.</li>
            <li>Prefer transparent brands with credible certifications.</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/guides-and-tips/fashion-beauty">Back to Fashion & Beauty</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/collections?values=cruelty-free,vegan">Shop by values</Link>
            </Button>
          </div>
        </Card>

        <NewsletterSignup
          title="Get Beauty & Fashion Tips"
          description="Ingredient explainers, capsule wardrobe checklists, and product roundups."
        />
      </div>
    </div>
  );
}

