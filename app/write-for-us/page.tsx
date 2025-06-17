import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Write for Us | LinkFlame",
  description:
    "Pitch sustainable living guides, product explainers, and eco-friendly how-tos for the LinkFlame blog.",
};

export default function WriteForUsPage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-10">
        <h1 className="font-serif text-3xl font-semibold md:text-4xl">Write for LinkFlame</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          We publish practical, evidence-based content that helps people make greener choices without
          the guilt. If you can write clearly and cite your sources, we want to hear from you.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What we publish</CardTitle>
            <CardDescription>Topics that perform well with our readers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Zero-waste swaps that save money</p>
            <p>2. Clean beauty ingredient explainers</p>
            <p>3. Sustainable travel checklists</p>
            <p>4. Home energy efficiency guides</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission guidelines</CardTitle>
            <CardDescription>Keep it tight and useful.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Include a clear outline + 3 to 5 takeaways.</p>
            <p>2. Back claims with reputable sources.</p>
            <p>3. Avoid affiliate-first content.</p>
            <p>4. Original work only.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Pitch us</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Send your pitch to our team with a proposed title, outline, and links to 1 to 2 writing samples.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/contact">Contact</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/blogs">Read the blog</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

