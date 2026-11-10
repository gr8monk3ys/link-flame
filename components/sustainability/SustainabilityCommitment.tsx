import { cn } from "@/lib/utils";
import Link from "next/link";

interface SustainabilityCommitmentProps {
  variant?: "default" | "compact" | "footer";
  className?: string;
}

// Leaf icon
const LeafIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

// Document icon
const DocumentIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8M8 17h8" />
  </svg>
);

// Package icon
const PackageIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
  </svg>
);

// Heart icon
const HeartIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

// What is true today. Goals (1% for the Planet, shipping offsets) live on /sustainability.
const commitments = [
  {
    icon: DocumentIcon,
    title: "Digital first",
    description: "Our guides are PDFs. Nothing is packed or shipped for them.",
  },
  {
    icon: PackageIcon,
    title: "Printed to order",
    description: "The tote and tee are made after you order, so no unsold stock.",
  },
  {
    icon: LeafIcon,
    title: "Organic cotton",
    description: "The tote and tee are organic cotton.",
  },
  {
    icon: HeartIcon,
    title: "Our own products",
    description: "We write and design everything we sell. No resold brands.",
  },
];

export function SustainabilityCommitment({
  variant = "default",
  className,
}: SustainabilityCommitmentProps) {
  if (variant === "footer") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <LeafIcon className="size-5 text-primary" />
          <h3 className="label-mono">What we do</h3>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Digital guides, nothing shipped</li>
          <li>Tote and tee printed to order</li>
          <li>Organic cotton</li>
        </ul>
        <Link
          href="/sustainability"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Read the full commitment
          <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-center gap-6 rounded-lg bg-muted p-4",
          className
        )}
      >
        {commitments.slice(0, 3).map((commitment) => (
          <div key={commitment.title} className="flex items-center gap-2">
            <commitment.icon className="size-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {commitment.title}
            </span>
          </div>
        ))}
        <Link
          href="/sustainability"
          className="text-sm font-medium text-primary hover:underline"
        >
          Read our sustainability commitment
        </Link>
      </div>
    );
  }

  // Default variant
  return (
    <section className={cn("py-12", className)}>
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            What we do today
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Measured, not promised. This is what is true now. Our goals are on
            the sustainability page.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {commitments.map((commitment) => (
            <div key={commitment.title} className="rounded-xl border bg-card p-6">
              <div className="mb-4 inline-flex size-12 items-center justify-center rounded-lg bg-muted">
                <commitment.icon className="size-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {commitment.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {commitment.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/sustainability" className="cta-primary">
            Learn more
          </Link>
        </div>
      </div>
    </section>
  );
}
