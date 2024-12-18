import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NewsletterSignup } from "@/components/newsletter-signup"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

const values = [
  {
    title: "Environmental Impact",
    description: "Every product recommendation and piece of content is evaluated for its environmental impact. We believe in promoting truly sustainable solutions.",
    icon: "🌱",
  },
  {
    title: "Transparency",
    description: "We're upfront about our affiliate partnerships and review process. You'll always know how we make our recommendations.",
    icon: "🤝",
  },
  {
    title: "Education First",
    description: "Our primary goal is to educate and empower our community to make sustainable choices. Revenue is secondary to providing valuable information.",
    icon: "📚",
  },
  {
    title: "Community Driven",
    description: "We actively engage with our community and incorporate feedback to improve our content and recommendations.",
    icon: "👥",
  },
]

const teamMembers = [
  {
    name: "Sarah Green",
    role: "Sustainability Expert",
    bio: "With 10+ years in environmental science, Sarah ensures our recommendations truly make a difference.",
    image: "/images/team/sarah.jpg",
  },
  {
    name: "Mike Rivers",
    role: "Product Research Lead",
    bio: "Mike thoroughly tests and evaluates eco-friendly products to ensure they meet our strict standards.",
    image: "/images/team/mike.jpg",
  },
  {
    name: "Lisa Chen",
    role: "Content Director",
    bio: "Lisa crafts engaging content that makes sustainable living accessible and appealing to everyone.",
    image: "/images/team/lisa.jpg",
  },
]

export default function AboutUsPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      {/* Hero Section */}
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          About LinkFlame
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          We&apos;re on a mission to make sustainable living accessible and appealing to everyone.
          Through carefully curated product recommendations and expert advice, we help you
          make eco-conscious choices without compromising on quality or convenience.
        </p>
      </div>

      {/* Our Values */}
      <div className="my-12">
        <h2 className="mb-6 text-2xl font-bold">Our Values</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {values.map((value) => (
            <Card key={value.title}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{value.icon}</span>
                  <CardTitle>{value.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p>{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Our Process */}
      <div className="my-12">
        <h2 className="mb-6 text-2xl font-bold">Our Review Process</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted">1</div>
                <div>
                  <h3 className="font-semibold">Research</h3>
                  <p className="text-muted-foreground">
                    We extensively research products, focusing on materials, manufacturing processes,
                    and company sustainability practices.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted">2</div>
                <div>
                  <h3 className="font-semibold">Testing</h3>
                  <p className="text-muted-foreground">
                    Products are thoroughly tested by our team to evaluate performance, durability,
                    and environmental impact.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted">3</div>
                <div>
                  <h3 className="font-semibold">Community Feedback</h3>
                  <p className="text-muted-foreground">
                    We gather and incorporate feedback from our community of eco-conscious consumers.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted">4</div>
                <div>
                  <h3 className="font-semibold">Regular Updates</h3>
                  <p className="text-muted-foreground">
                    Our recommendations are regularly reviewed and updated to ensure they remain
                    the best eco-friendly options available.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meet the Team */}
      <div className="my-12">
        <h2 className="mb-6 text-2xl font-bold">Meet the Team</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {teamMembers.map((member) => (
            <Card key={member.name}>
              <div className="relative h-48 w-full">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="rounded-t-lg object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle>{member.name}</CardTitle>
                <CardDescription>{member.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{member.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Affiliate Disclosure */}
      <Card className="my-12">
        <CardHeader>
          <CardTitle>Affiliate Disclosure</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            LinkFlame is reader-supported. When you buy through links on our site, we may earn
            an affiliate commission. This helps us maintain our rigorous research and testing
            process, but it never influences our recommendations. We only promote products we
            truly believe in and have thoroughly vetted for their environmental impact.
          </p>
        </CardContent>
      </Card>

      {/* Contact Section */}
      <div className="my-12">
        <h2 className="mb-6 text-2xl font-bold">Get in Touch</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>
                Have questions or suggestions? We&apos;d love to hear from you!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/contact" className={buttonVariants()}>
                Contact Us
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Write for Us</CardTitle>
              <CardDescription>
                Are you passionate about sustainable living? Join our team of contributors!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/write-for-us" className={buttonVariants()}>
                Learn More
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