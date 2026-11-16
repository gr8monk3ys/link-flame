"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { apiErrorMessage, csrfHeaders, fetchCsrfToken } from "@/lib/csrf-client"

const GENERIC_ERROR = "We could not unsubscribe you. Please try again."

type Status = "idle" | "loading" | "done" | "error"

/**
 * The one button on /unsubscribe.
 *
 * The link in an email only opens this page. Nothing is removed until the
 * reader presses the button, because mail scanners and link previews open
 * every link in a message and must not be able to unsubscribe anyone.
 *
 * Reads `id` and `t` from the query string, so the page renders it inside a
 * Suspense boundary (a prerendered page needs one around `useSearchParams`).
 */
export function UnsubscribeConfirm() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id") ?? ""
  const token = searchParams.get("t") ?? ""

  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")

  if (!id || !token) {
    return (
      <div>
        <p className="label-mono mb-4">Link not complete</p>
        <p className="mb-8 text-lg text-muted-foreground">
          This page needs the full unsubscribe link from one of our emails. Open
          the most recent email from us and use the link at the bottom.
        </p>
        <Button asChild variant="outline">
          <Link href="/contact">Contact us instead</Link>
        </Button>
      </div>
    )
  }

  if (status === "done") {
    return (
      <div>
        <p className="label-mono mb-4">Done</p>
        <p className="mb-8 text-lg text-foreground" role="status">
          You are unsubscribed. We will not email this address again.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Back to the shop</Link>
        </Button>
      </div>
    )
  }

  const handleClick = async () => {
    setStatus("loading")
    setMessage("")

    try {
      const csrfToken = await fetchCsrfToken()
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: csrfHeaders(csrfToken, { "Content-Type": "application/json" }),
        body: JSON.stringify({ id, token }),
      })
      const data = await response.json().catch(() => null)

      if (response.ok) {
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

  return (
    <div>
      <p className="mb-8 text-lg text-muted-foreground">
        Press the button to leave the Link Flame email list. It takes effect at
        once.
      </p>
      <Button type="button" size="lg" onClick={handleClick} disabled={status === "loading"}>
        {status === "loading" ? "Unsubscribing…" : "Unsubscribe"}
      </Button>
      {status === "error" && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {message}
        </p>
      )}
    </div>
  )
}
