"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FREE_GUIDE } from "@/config/free-guide"
import { apiErrorMessage, csrfHeaders, fetchCsrfToken } from "@/lib/csrf-client"

const GENERIC_ERROR = "We could not add you to the list. Please try again."

type Status = "idle" | "loading" | "done" | "error"

/**
 * Email signup that hands over the free guide.
 *
 * Posts to the same `/api/newsletter` endpoint as the footer form. After a
 * successful signup (or when the address is already on the list) the form is
 * replaced by the download link itself: the welcome email also carries the
 * link, but that email is only sent when the email service is configured, so
 * the page never depends on it.
 */
export function FreeGuideForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus("loading")
    setMessage("")

    try {
      // Fetched on submit, not on mount, so the page load makes no extra request.
      const csrfToken = await fetchCsrfToken()
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: csrfHeaders(csrfToken, { "Content-Type": "application/json" }),
        body: JSON.stringify({ email }),
      })
      const data = await response.json().catch(() => null)

      if (response.ok) {
        // 201 for a new address, 200 when it was already on the list. Both
        // get the guide.
        setStatus("done")
      } else {
        setStatus("error")
        setMessage(apiErrorMessage(data) ?? GENERIC_ERROR)
      }
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error && error.message ? error.message : GENERIC_ERROR)
    }
  }

  if (status === "done") {
    return (
      <div className="border-y border-border py-8" role="status">
        <p className="label-mono mb-3">You are on the list</p>
        <p className="mb-6 text-lg text-foreground">
          Your copy of {FREE_GUIDE.title} is ready.
        </p>
        <Button asChild size="lg">
          <a href={FREE_GUIDE.href} download={FREE_GUIDE.fileName}>
            Download the PDF
          </a>
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          Lost the file later? Enter the same address on this page again.
        </p>
      </div>
    )
  }

  const hasError = status === "error"

  return (
    <form onSubmit={handleSubmit} className="border-y border-border py-8">
      <label htmlFor="free-guide-email" className="label-mono mb-3 block">
        Your email address
      </label>
      <div className="flex flex-wrap gap-3">
        <input
          id="free-guide-email"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={hasError ? "free-guide-error free-guide-consent" : "free-guide-consent"}
          disabled={status === "loading"}
          className="input-field h-10 w-full min-w-56 flex-1 rounded-sm px-3 text-sm"
        />
        <Button type="submit" className="shrink-0" disabled={status === "loading"}>
          {status === "loading" ? "Sending…" : "Send me the guide"}
        </Button>
      </div>
      {hasError && (
        <p id="free-guide-error" className="mt-3 text-sm text-destructive" role="alert">
          {message}
        </p>
      )}
      <p id="free-guide-consent" className="mt-4 text-sm text-muted-foreground">
        This also adds you to the Link Flame email list. We write when a new
        guide or a checked swap is ready; there is no fixed schedule. Every
        email has an unsubscribe link. See the{" "}
        <Link href="/privacy" className="ink-underline text-foreground">
          privacy policy
        </Link>
        .
      </p>
    </form>
  )
}
