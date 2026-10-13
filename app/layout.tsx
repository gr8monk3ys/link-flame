import "@/styles/globals.css"
import "@/lib/env"
import { Suspense } from "react"
import { Metadata, Viewport } from "next"
import { siteConfig } from "@/config/site"
import { fontSans, fontSerif } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { SITE_THEME_PROPS } from "@/config/theme"
import { Analytics } from "@/components/layout/analytics"
import { SessionProvider } from "next-auth/react";
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CartProvider } from "@/lib/providers/CartProvider"
import ErrorBoundary from "@/components/layout/error-boundary"
import { ServiceWorkerRegistration } from "@/components/shared/service-worker-registration"
import { WelcomeBonusNotification } from "@/components/shared/welcome-bonus-notification"
import { Toaster } from "sonner"

export function getMetadata(): Metadata {
  const metadata: Metadata = {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name,
      template: `%s - ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: [
      "eco-friendly",
      "sustainable living",
      "green products",
      "environmental",
      "sustainability",
    ],
    authors: [
      {
        name: "Link Flame",
        url: siteConfig.url,
      },
    ],
    creator: "Link Flame",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      title: siteConfig.name,
      description: siteConfig.description,
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.name,
      description: siteConfig.description,
      images: [`${siteConfig.url}/og.png`],
      creator: "@linkflame",
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon-16x16.png",
      apple: "/apple-touch-icon.png",
    },
    // Relative on purpose: an absolute URL built from siteConfig.url is
    // cross-origin on every preview deploy (and any www/apex mismatch), and
    // the CSP then blocks the manifest.
    manifest: "/site.webmanifest",
  };
  return metadata;
}

export function getViewport(): Viewport {
  return {
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#fcfaf8' },
      { media: '(prefers-color-scheme: dark)', color: '#15110f' },
    ],
  }
}

export const metadata: Metadata = getMetadata()
export const viewport: Viewport = getViewport()

interface RootLayoutProps {
  children: React.ReactNode
}

// No request headers are read here on purpose: `headers()` in the root
// layout made every route dynamic (the CSP nonce it fetched cannot exist in
// prerendered HTML). The two inline scripts below are allowed by hash instead;
// see lib/csp.ts.
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontSerif.variable
        )}
      >
        <SessionProvider>
          <ThemeProvider {...SITE_THEME_PROPS}>
            <CartProvider>
              <ErrorBoundary>
                <a
                  href="#main-content"
                  className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[100] focus-visible:rounded-md focus-visible:bg-background focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Skip to Main Content
                </a>
                <div className="relative flex min-h-screen flex-col">
                  {/* SiteHeader is already `sticky top-0 w-full`. Forcing it
                      to `fixed` took it out of flow and required main to
                      compensate with a hardcoded pt-28 (112px) — but the real
                      header height varies (the announcement bar wraps to three
                      lines on mobile, making it ~162px), so content rendered
                      underneath the header on small screens. Leaving it in
                      flow is correct at any header height. */}
                  <SiteHeader />
                  <main id="main-content" className="container mx-auto flex-1 px-4 pt-8 sm:px-6 lg:px-8">
                    {children}
                  </main>
                  <SiteFooter className="mt-auto" />
                </div>
                {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && <Analytics />}
                <ServiceWorkerRegistration />
                <Suspense fallback={null}>
                  <WelcomeBonusNotification />
                </Suspense>
                <Toaster position="top-right" />
              </ErrorBoundary>
            </CartProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
