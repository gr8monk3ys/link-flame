import { Suspense } from "react"
import type { Metadata } from "next"
import { UnsubscribeConfirm } from "@/components/newsletter/unsubscribe-confirm"

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Leave the Link Flame email list.",
  // Reached only from a link in an email; it has no place in search results.
  robots: { index: false, follow: false },
}

export default function UnsubscribePage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl">
        <p className="label-mono mb-4">Email list</p>
        <h1 className="mb-6 text-page-title">Unsubscribe</h1>
        {/* useSearchParams needs a Suspense boundary on a prerendered page. */}
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          <UnsubscribeConfirm />
        </Suspense>
      </div>
    </div>
  )
}
