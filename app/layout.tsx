import "@/styles/globals.css"
import "@/lib/env"
import { Suspense } from "react"
import { Metadata, Viewport } from "next"
import { siteConfig } from "@/config/site"
import { fontSans, fontSerif } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Analytics } from "@/components/layout/analytics"
import { SessionProvider } from "next-auth/react";
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CartProvider } from "@/lib/providers/CartProvider"
import ErrorBoundary from "@/components/layout/error-boundary"
import { ServiceWorkerRegistration } from "@/components/shared/service-worker-registration"
import { WelcomeBonusNotification } from "@/components/shared/welcome-bonus-notification"

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
      images: [`${siteConfig.url}/og.jpg`],
      creator: "@linkflame",
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon-16x16.png",
      apple: "/apple-touch-icon.png",
    },
    manifest: `${siteConfig.url}/site.webmanifest`,
  };
  return metadata;
}

export function getViewport(): Viewport {
  return {
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#000000' },
    ],
  }
}

export const metadata: Metadata = getMetadata()
export const viewport: Viewport = getViewport()

interface RootLayoutProps {
  children: React.ReactNode
}

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
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={true}
            disableTransitionOnChange
          >
            <CartProvider>
              <ErrorBoundary>
                <div className="relative flex min-h-screen flex-col">
                  <SiteHeader className="fixed top-0 z-50 w-full" />
                  <main className="container mx-auto flex-1 px-4 pt-24 sm:px-6 lg:px-8">
                    {children}
                  </main>
                  <SiteFooter className="mt-auto" />
                </div>
                {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && <Analytics />}
                <ServiceWorkerRegistration />
                <Suspense fallback={null}>
                  <WelcomeBonusNotification />
                </Suspense>
              </ErrorBoundary>
            </CartProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
