"use client"

import { useId, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

interface NewsletterSignupProps {
  title?: string
  description?: string
  className?: string
}

export function NewsletterSignup({
  title = "Get Eco friendly Tips",
  description = "Subscribe to our newsletter for weekly sustainable living tips, exclusive deals, and eco-friendly product recommendations.",
  className = "",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const inputId = useId()
  const messageId = `${inputId}-message`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage(data.message)
        setEmail("")
      } else {
        setStatus("error")
        setMessage(data.error ?? "Failed to subscribe. Please try again later.")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Failed to subscribe. Please try again later.")
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <label htmlFor={inputId} className="sr-only">
              Email address
            </label>
            <input
              id={inputId}
              type="email"
              name="email"
              autoComplete="email"
              spellCheck={false}
              aria-invalid={status === "error" || undefined}
              aria-describedby={message ? messageId : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={status === "loading"}
              required
            />
            <button
              type="submit"
              className={buttonVariants()}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
          </div>
          <p
            id={messageId}
            role="status"
            aria-live="polite"
            className={
              status === "error"
                ? "text-sm text-destructive"
                : "text-sm text-primary"
            }
          >
            {status === "success" || status === "error" ? message : null}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
