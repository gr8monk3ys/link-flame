import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function WriteForUsPage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Write for LinkFlame
        </h1>
        <p className="text-xl text-muted-foreground">
          Share your expertise in sustainable living with our community
        </p>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg bg-muted p-6">
            <h2 className="mb-4 text-2xl font-bold">What We&apos;re Looking For</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <svg
                  className="mr-2 h-6 w-6 shrink-0 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Original content about sustainable living</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="mr-2 h-6 w-6 shrink-0 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Practical eco-friendly tips and guides</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="mr-2 h-6 w-6 shrink-0 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Product reviews and recommendations</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="mr-2 h-6 w-6 shrink-0 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Personal experiences with sustainable living</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-muted p-6">
            <h2 className="mb-4 text-2xl font-bold">Why Write for Us?</h2>
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>Reach a growing eco-conscious audience</li>
              <li>Competitive compensation for quality content</li>
              <li>Establish yourself as a sustainability expert</li>
              <li>Flexible writing schedule</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-2xl font-bold">Submit Your Application</h2>
            <form className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input id="name" placeholder="Your name" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>

              <div className="space-y-2">
                <label htmlFor="portfolio" className="text-sm font-medium">
                  Writing Portfolio URL (optional)
                </label>
                <Input id="portfolio" type="url" placeholder="https://" />
              </div>

              <div className="space-y-2">
                <label htmlFor="experience" className="text-sm font-medium">
                  Tell us about your experience with sustainable living
                </label>
                <Textarea
                  id="experience"
                  placeholder="Share your background..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="topics" className="text-sm font-medium">
                  What topics would you like to write about?
                </label>
                <Textarea
                  id="topics"
                  placeholder="List your preferred topics..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-muted-foreground">
                    I agree to the{" "}
                    <a href="/terms" className="text-primary hover:underline">
                      terms of service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-primary hover:underline">
                      privacy policy
                    </a>
                  </span>
                </label>
              </div>

              <Button className="w-full">Submit Application</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
