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
          src="/../public/images/cover.png" // Replace with the actual cover image URL
          alt="Cover Image"
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Welcome to LinkFlame, <br className="hidden sm:inline" />
        </h1>
        <h2 className="text-2xl font-bold leading-tight tracking-tighter md:text-3xl">
          Your Trustworthy site for all reviews product related.
        </h2>
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
      <div className="">
        <p className="max-w-[80%] text-lg text-muted-foreground">
          We work tirelessly to ensure that you are presented with the most
          recent, highest-rated, and popular products in a wide variety of
          categories. Our smartly designed site and user-friendly navigation
          system ensure you spend less time searching and more time shopping.
        </p>
        <p className="max-w-[80%] text-lg text-muted-foreground">
          Free, user-friendly, and always updated - experience the new era of
          online shopping with [Your Company Name]. Your satisfaction is our
          reward.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-8">
        {/* Additional Images */}
        <div>
          <Image
            src="/path/to/image1.jpg" // Replace with the actual image URL
            alt="Image 1"
            width={500}
            height={300}
          />
        </div>
        <div>
          <Image
            src="/path/to/image2.jpg" // Replace with the actual image URL
            alt="Image 2"
            width={500}
            height={300}
          />
        </div>
      </div>
    </section>
  )
}
