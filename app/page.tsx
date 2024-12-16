import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/button"
import Image from "next/image";

export default function IndexPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="relative h-72 md:h-96">
        <Image
          src="/images/cover.png"
          alt="Eco-friendly lifestyle cover image"
          layout="fill"
          objectFit="cover"
          priority
        />
      </div>
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Welcome to LinkFlame <br className="hidden sm:inline" />
          Your Guide to Sustainable Living
        </h1>
        <h2 className="text-2xl font-bold leading-tight tracking-tighter md:text-3xl">
          Discover Eco-Friendly Products & Sustainable Lifestyle Tips
        </h2>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          At LinkFlame, we&apos;re passionate about helping you make environmentally conscious choices. 
          Explore our curated selection of sustainable products, expert guides, and practical tips for 
          eco-friendly living. Join our community and be part of the solution for a greener future.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Green Home & Garden</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Discover sustainable solutions for your home and garden. From energy-efficient appliances to organic gardening tips.</p>
            <Link href="/eco-living/green-home" className={buttonVariants({ variant: "link" })}>
              Explore Green Living →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zero Waste Living</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Learn practical ways to reduce waste and find eco-friendly alternatives to everyday products.</p>
            <Link href="/eco-living/zero-waste" className={buttonVariants({ variant: "link" })}>
              Start Your Journey →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sustainable Fashion</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Find ethical fashion brands and learn about sustainable materials and production methods.</p>
            <Link href="/eco-living/fashion-beauty" className={buttonVariants({ variant: "link" })}>
              Shop Consciously →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <Link
          href="/community/join"
          className={buttonVariants({ size: "lg" })}
        >
          Join Our Community
        </Link>
        <Link
          href="/guides-and-tips"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Explore Eco Guides
        </Link>
      </div>

      <div className="mt-8">
        <h3 className="mb-4 text-2xl font-bold">Latest from Our Blog</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Add blog post previews here */}
        </div>
      </div>
    </section>
  )
}
