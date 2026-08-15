import type { Metadata } from "next"
import Link from "next/link"
import { Leaf, Scale, ShieldCheck, Recycle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NewsletterSignup } from "@/components/shared/newsletter-signup"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Link Flame is a small eco-commerce shop. Every product is screened for what it's made of, who made it, and what it replaces.",
}

const values = [
  {
    title: "Measured impact",
    description:
      "Every product carries a measured yearly impact versus the single-use item it replaces. We publish those numbers instead of slogans.",
    icon: Scale,
  },
  {
    title: "Screened, not scraped",
    description:
      "Products earn a place on the shelf by passing screening on materials, certifications, and the practices of the company behind them.",
    icon: ShieldCheck,
  },
  {
    title: "Waste is a design flaw",
    description:
      "Plastic-free packaging, carbon-neutral shipping, a seconds shelf for imperfect stock, and a take-back program for hard-to-recycle empties.",
    icon: Recycle,
  },
  {
    title: "One percent, always",
    description:
      "One percent of every sale goes to environmental nonprofits through 1% for the Planet — in good months and slow ones.",
    icon: Leaf,
  },
]

const screeningSteps = [
  {
    title: "Materials",
    description:
      "What is it made of, and what happens to it at end of life? Compostable, recyclable, or durable-for-a-decade beats disposable every time.",
  },
  {
    title: "Maker",
    description:
      "Who makes it, under what conditions, with which certifications? B Corp, Leaping Bunny, USDA Organic, and Fair Trade all carry weight here.",
  },
  {
    title: "Impact math",
    description:
      "We assign the product its per-unit yearly impact — bottles displaced, items replaced, CO₂e avoided — and stand behind those numbers on the impact page.",
  },
  {
    title: "Re-screening",
    description:
      "Formulas change and companies get acquired. Everything on the shelf gets re-screened, and products that stop qualifying come off it.",
  },
]

export default function AboutUsPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      {/* Hero Section */}
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="font-serif text-3xl leading-tight tracking-tight md:text-4xl">
          About Link Flame
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Link Flame is a small shop for everyday swaps — the bottle, brush, and
          wrap you use daily, minus the plastic. We stock few things on purpose:
          every product here passed screening on what it&apos;s made of, who
          made it, and what it measurably replaces.
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
          How a product earns its place
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
                Questions about an order, a product, or our screening? We answer
                within a couple of business days.
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
                that&apos;s you, pitch us.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/write-for-us" className={buttonVariants()}>
                Learn more
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Newsletter */}
      <NewsletterSignup
        title="Join Our Community"
        description="Get sustainable living tips, exclusive eco-friendly product deals, and updates from our team."
        className="my-12"
      />
    </section>
  )
}
