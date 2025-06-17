import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Home, Search } from "lucide-react"

export default function ProductNotFound() {
  return (
    <div className="container flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <div className="mb-6 inline-flex size-32 items-center justify-center rounded-full bg-primary/10">
          <ShoppingBag className="size-16 text-primary" />
        </div>
        <h1 className="mb-4 text-5xl font-bold tracking-tight">Product Not Found</h1>
        <p className="mx-auto max-w-md text-lg text-muted-foreground">
          This product doesn&apos;t exist or is no longer available.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline">
          <Link href="/products">
            <Search className="mr-2 size-4" />
            Browse All Products
          </Link>
        </Button>
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 size-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
