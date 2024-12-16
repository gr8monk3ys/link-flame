import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function JoinCommunityPage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Join Our Eco-Conscious Community
        </h1>
        <p className="text-xl text-muted-foreground">
          Connect with like-minded individuals passionate about sustainable living
        </p>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg bg-muted p-6">
            <h2 className="mb-4 text-2xl font-bold">Why Join Us?</h2>
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
                <span>Connect with eco-conscious individuals</span>
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
                <span>Share sustainable living tips and experiences</span>
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
                <span>Access exclusive eco-friendly product recommendations</span>
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
                <span>Participate in community challenges and events</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-muted p-6">
            <h2 className="mb-4 text-2xl font-bold">Community Guidelines</h2>
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>Be respectful and supportive of all members</li>
              <li>Share authentic experiences and honest feedback</li>
              <li>Focus on sustainable and eco-friendly practices</li>
              <li>No spam or self-promotion without permission</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-2xl font-bold">Join Now</h2>
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
                <label htmlFor="interests" className="text-sm font-medium">
                  What interests you most about sustainable living?
                </label>
                <Textarea
                  id="interests"
                  placeholder="Tell us about your interests..."
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

              <Button className="w-full">Join Community</Button>
            </form>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Already a member?{" "}
              <a href="/login" className="text-primary hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
