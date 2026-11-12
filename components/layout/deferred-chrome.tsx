"use client"

import { Suspense, useEffect, useState } from "react"
import dynamic from "next/dynamic"

// None of these is needed to paint or to hydrate the page: the toast host only
// shows messages that follow a click, the welcome banner needs `?welcome=true`,
// and the service worker is registered for later visits. Importing them
// statically put their code (sonner, the banner's icons and button) in the
// chunks every route evaluates before hydration. They are separate chunks
// instead, fetched once the browser is idle or on the first interaction,
// whichever comes first.
const Toaster = dynamic(() => import("sonner").then((m) => ({ default: m.Toaster })), {
  ssr: false,
})
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

  if (!ready) return null
  return (
    <>
      <ServiceWorkerRegistration />
      <Suspense fallback={null}>
        <WelcomeBonusNotification />
      </Suspense>
      <Toaster position="top-right" />
    </>
  )
}
