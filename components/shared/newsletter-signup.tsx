"use client"

import { useState } from "react"
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
        setMessage(data.error)
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
          {/* Wraps rather than squeezing. This same component sits in a wide
              page section and in a narrow footer column; on one fixed row the
              footer copy squeezed the field until its own placeholder read
              "Enter yc". A min width plus wrapping keeps one row where there is
              space and drops the button below where there is not. */}
          <div className="flex flex-wrap gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              aria-label="Email address"
              className="flex h-10 w-full min-w-44 flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={status === "loading"}
              required
            />
            <button
              type="submit"
              className={`${buttonVariants()} shrink-0`}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Subscribing..." : "Subscribe"}
            </button>
          </div>
          {status === "success" && (
            <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
