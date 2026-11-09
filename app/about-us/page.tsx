import type { Metadata } from "next"
import Link from "next/link"
import { Leaf, Scale, ShieldCheck, Recycle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NewsletterSignup } from "@/components/shared/newsletter-signup"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Link Flame is a small shop that sells its own guides and printed goods for low-waste living.",
}

const values = [
  {
    title: "Measured impact",
    description:
      "Where we state an impact number, we say how we got it. Where we do not have one yet, we say that instead of guessing.",
    icon: Scale,
  },
  {
    title: "Our own products only",
    description:
      "We write the guides ourselves and design the printed items. We do not resell other brands, so we know what is in everything we sell.",
    icon: ShieldCheck,
  },
  {
    title: "Made only when ordered",
    description:
      "Guides are digital. The tote and tee are printed to order, so we do not hold stock that may never sell.",
    icon: Recycle,
  },
  {
    title: "Giving back, when we can",
    description:
      "We want to join 1% for the Planet once the shop has revenue to give. We are not a member yet, and we will say so until we are.",
    icon: Leaf,
  },
]

const screeningSteps = [
  {
    title: "Materials",
    description:
      "What is it made of, and what happens to it at end of life? Durable for years beats disposable. The tote and tee are organic cotton.",
  },
  {
    title: "Maker",
    description:
      "We write the guides. The printed items are produced by Printful, a print-on-demand company, and we say so on the shipping page.",
  },
  {
    title: "Impact math",
    description:
      "If a product replaces a single-use item, we say which one and how we counted. The impact page shows what we have and what we do not.",
  },
  {
    title: "Review",
    description:
      "We reread our own guides and product pages, and fix what is wrong or out of date.",
  },
]

export default function AboutUsPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      {/* Hero Section */}
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="font-serif text-3xl leading-tight tracking-tight md:text-4xl md:leading-10">
          About Link Flame
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Link Flame is a small shop for everyday swaps — the bottle, brush, and
          wrap you use daily, minus the plastic. We sell few things on
          purpose, and all of them are our own: three PDF guides, a bundle of
          the three, an organic cotton tote and an organic cotton tee.
        </p>
      </div>

      {/* Our Values */}
      <div className="my-12">
        <h2 className="mb-6 font-serif text-2xl tracking-tight">What we stand on</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {values.map((value) => (
            <Card key={value.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <value.icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle>{value.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Screening Process */}
      <div className="my-12">
        <h2 className="mb-6 font-serif text-2xl tracking-tight">
          How we decide what to sell
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {screeningSteps.map((step, index) => (
                <div key={step.title} className="flex items-start gap-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Section */}
      <div className="my-12">
        <h2 className="mb-6 font-serif text-2xl tracking-tight">Get in touch</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact us</CardTitle>
              <CardDescription>
                Questions about an order or a product? Send us a note.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/contact" className={buttonVariants()}>
                Contact us
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Write for us</CardTitle>
              <CardDescription>
                Our guides are written by people who actually live this way. If
                that&rsquo;s you, pitch us.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/write-for-us" className={buttonVariants()}>
                See our writer guidelines
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Newsletter */}
      <NewsletterSignup
        title="Join Our Community"
        description="Get low-waste living tips and updates when we publish something new."
        className="my-12"
      />
    </section>
  )
}
