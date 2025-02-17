import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Create a matcher for protected routes
const isProtectedRoute = createRouteMatcher([
  "/cart(.*)",
  "/checkout(.*)",
  "/admin(.*)",
]);

// Create a matcher for public routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/collections(.*)",
  "/products/(.*)",
  "/about-us",
  "/faq",
  "/api/webhook(.*)",
  "/api/products(.*)",
]);

export default clerkMiddleware((auth, req: NextRequest) => {
  if (!auth.userId && isProtectedRoute(req)) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
});

// Stop Middleware running on static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!static|.*\\..*|_next|favicon.ico).*)",
    "/(api|trpc)(.*)",
  ],
};
