import Link from "next/link"

import { siteConfig } from "@/config/site"
import { buttonVariants } from "@/components/ui/button"

export default function IndexPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Welcome to LinkFlame, <br className="hidden sm:inline" />
          Your Trustworthy site for all reviews product related.
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          At LinkFlame, we believe in making online shopping a breeze. We're
          dedicated to providing you with trusted, in-depth product reviews, and
          personalized product recommendations. Our platform is powered by
          Amazon Associates, assuring you of a vast array of products to choose
          from.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href={siteConfig.links.docs}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants()}
        >
          Learn More
        </Link>
        <Link
          target="_blank"
          rel="noreferrer"
          href={siteConfig.links.github}
          className={buttonVariants({ variant: "outline" })}
        >
          GitHub
        </Link>
      </div>
      <div className="flex-col items-start gap-2">
        <p className="max-w-[900px] text-lg text-muted-foreground">
          We work tirelessly to ensure that you are presented with the most
          recent, highest-rated, and popular products in a wide variety of
          categories. Our smartly designed site and user-friendly navigation
          system ensure you spend less time searching and more time shopping.
        </p>
        <p className="max-w-[900px] text-lg text-muted-foreground">
          Free, user-friendly, and always updated - experience the new era of
          online shopping with [Your Company Name]. Your satisfaction is our
          reward.
        </p>
      </div>
    </section>
  )
}
