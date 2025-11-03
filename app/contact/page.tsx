"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { CONTACT } from "@/config/constants"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to submit form")
      }

      setStatus("success")
      setFormData({ name: "", email: "", subject: "", message: "" })
    } catch (error) {
      console.error("Contact form error:", error)
      setStatus("error")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Contact Us
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Have questions, suggestions, or want to collaborate? We&apos;d love to hear from you!
          Fill out the form below and we&apos;ll get back to you as soon as possible.
        </p>
      </div>

      <Card className="max-w-[600px]">
        <CardHeader>
          <CardTitle>Send us a Message</CardTitle>
          <CardDescription>
            We typically respond within 1-2 business days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
            <div>
              <label htmlFor="subject" className="mb-1 block text-sm font-medium">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="mb-1 block text-sm font-medium">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
            <button
              type="submit"
              className={buttonVariants()}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending..." : "Send Message"}
            </button>

            {status === "success" && (
              <p className="mt-2 text-sm text-green-600">
                Thank you for your message! We&apos;ll get back to you soon.
              </p>
            )}
            {status === "error" && (
              <p className="mt-2 text-sm text-red-600">
                Something went wrong. Please try again later.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Additional Contact Information */}
      <div className="grid max-w-[980px] gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              For business partnerships, sponsorships, or collaboration opportunities,
              please email us at: <br />
              <a
                href={`mailto:${CONTACT.businessEmail}`}
                className="text-primary hover:underline"
              >
                {CONTACT.businessEmail}
              </a>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Press & Media</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              For press inquiries or media requests, please contact: <br />
              <a
                href={`mailto:${CONTACT.pressEmail}`}
                className="text-primary hover:underline"
              >
                {CONTACT.pressEmail}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
