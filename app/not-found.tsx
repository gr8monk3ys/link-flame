import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search, ShoppingBag, BookOpen, Mail } from "lucide-react"

export default function NotFound() {
  const quickLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/products", label: "Shop Products", icon: ShoppingBag },
    { href: "/blogs", label: "Read Blog", icon: BookOpen },
    { href: "/contact", label: "Contact Us", icon: Mail },
  ]

  return (
    <div className="container flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 py-16">
      {/* 404 Illustration */}
      <div className="mb-8 text-center">
        <div className="mb-6 inline-flex size-32 items-center justify-center rounded-full bg-muted">
          <Search className="size-16 text-muted-foreground" />
        </div>
        <h1 className="mb-4 text-6xl font-bold tracking-tight sm:text-7xl">404</h1>
        <h2 className="mb-3 text-2xl font-semibold sm:text-3xl">Page Not Found</h2>
        <p className="mx-auto max-w-md text-lg text-muted-foreground">
          We couldn&apos;t find the page you&apos;re looking for. It may have been moved or doesn&apos;t exist.
        </p>
      </div>

      {/* Quick Links */}
      <div className="mb-8 w-full max-w-2xl">
        <h3 className="mb-4 text-center text-sm font-medium text-muted-foreground">
          Try one of these instead:
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
              >
                <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </div>
                <span className="font-medium">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Primary CTA */}
      <Button asChild size="lg" className="mt-4">
        <Link href="/">
          <Home className="mr-2 size-4" />
          Back to Homepage
        </Link>
      </Button>
    </div>
  )
}
