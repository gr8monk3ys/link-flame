import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { nanoid } from "nanoid"

export async function middleware(request: NextRequest) {
  // Get session ID from cookie or create new one
  let sessionId = request.cookies.get("session_id")?.value
  const response = NextResponse.next()

  if (!sessionId) {
    sessionId = nanoid()
    response.cookies.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }

  // Add security headers
  const headers = response.headers
  headers.set("X-DNS-Prefetch-Control", "on")
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  headers.set("X-Frame-Options", "SAMEORIGIN")
  headers.set("X-Content-Type-Options", "nosniff")
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  )

  // Check admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Add your admin route protection logic here
    // This is just a basic example - you should implement proper role-based access control
    const session = request.cookies.get("next-auth.session-token")
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
