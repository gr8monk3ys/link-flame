"use client"

import { Suspense, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Toaster } from "sonner"

// Neither of these is needed to paint or to hydrate the page: the welcome
// banner needs `?welcome=true`, and the service worker is registered for later
// visits. Importing them statically put their code (the banner's icons and
// button) in the chunks every route evaluates before hydration. They are
// separate chunks instead, fetched once the browser is idle or on the first
// interaction, whichever comes first.
//
// The toast host stays eager: sonner's Toaster only shows toasts fired after it
// subscribes, so deferring it drops toasts raised on load (the Stripe gift-card
// return, the guest-cart merge).
const WelcomeBonusNotification = dynamic(
  () =>
    import("@/components/shared/welcome-bonus-notification").then((m) => ({
      default: m.WelcomeBonusNotification,
    })),
  { ssr: false }
)
const ServiceWorkerRegistration = dynamic(
  () =>
    import("@/components/shared/service-worker-registration").then((m) => ({
      default: m.ServiceWorkerRegistration,
    })),
  { ssr: false }
)

const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart"] as const
// Upper bound for browsers without requestIdleCallback (Safari).
const IDLE_FALLBACK_MS = 1500

export function DeferredChrome() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let done = false
    let idleId: number | undefined
    let timerId: ReturnType<typeof setTimeout> | undefined

    const cleanup = () => {
      for (const name of INTERACTION_EVENTS) window.removeEventListener(name, start)
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId)
      if (timerId !== undefined) clearTimeout(timerId)
    }
    function start() {
      if (done) return
      done = true
      cleanup()
      setReady(true)
    }

    for (const name of INTERACTION_EVENTS) {
      window.addEventListener(name, start, { passive: true, once: true })
    }
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(start, { timeout: 4000 })
    } else {
      timerId = setTimeout(start, IDLE_FALLBACK_MS)
    }
    return cleanup
  }, [])

  return (
    <>
      <Toaster position="top-right" />
      {ready && (
        <>
          <ServiceWorkerRegistration />
          <Suspense fallback={null}>
            <WelcomeBonusNotification />
          </Suspense>
        </>
      )}
    </>
  )
}
