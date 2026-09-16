// Browser-side Sentry. This file name is the one Next's Turbopack build
// actually bundles; `sentry.client.config.ts` is silently ignored there, which
// is why production served a server-side sentry-trace header but no browser
// SDK from the day Turbopack became the default build.
//
// The SDK is loaded off the critical path. A static `import * as Sentry` here
// pulls ~56 KB gzipped of SDK into the chunks every route evaluates before
// hydration, and `Sentry.init` does its fetch/XHR/history wrapping inside that
// same window. Instead this file installs two tiny listeners, hands the SDK
// off to `import()` once the page is idle (or immediately if an error happens
// first), then replays anything the listeners caught. This is the same shape
// as Sentry's own Loader Script: errors before the SDK is up are queued, not
// lost. Nothing else in the client bundle imports `@sentry/nextjs` statically
// (see app/global-error.tsx), so Turbopack can put the SDK in its own chunk;
// lib/sentry-browser.ts explains why that chunk is loaded through a wrapper.
//
// Note on replay: the SDK never registered `replayIntegration` here, so the
// `replaysOnErrorSampleRate` setting has always been a no-op and no replay
// code is in the bundle. It stays off; turning it on is a product decision,
// not a bundle one.
type Sdk = typeof import('./lib/sentry-browser')
type Queued =
  | { kind: 'error'; event: ErrorEvent }
  | { kind: 'unhandledrejection'; event: PromiseRejectionEvent }

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
const enabled = !!dsn && typeof window !== 'undefined'

let sdk: Sdk | undefined
let loading: Promise<Sdk | undefined> | undefined
const queue: Queued[] = []
// Bounded so a page that never manages to load the SDK cannot grow it forever.
const QUEUE_LIMIT = 20

function onError(event: ErrorEvent) {
  if (queue.length < QUEUE_LIMIT) queue.push({ kind: 'error', event })
  void load()
}

function onUnhandledRejection(event: PromiseRejectionEvent) {
  if (queue.length < QUEUE_LIMIT) queue.push({ kind: 'unhandledrejection', event })
  void load()
}

function flushQueue(loaded: Sdk) {
  for (const item of queue.splice(0)) {
    if (item.kind === 'error') {
      const { event } = item
      loaded.captureException(event.error ?? event.message, {
        mechanism: { handled: false, type: 'onerror' },
      })
    } else {
      loaded.captureException(item.event.reason, {
        mechanism: { handled: false, type: 'onunhandledrejection' },
      })
    }
  }
}

function load(): Promise<Sdk | undefined> {
  if (!enabled) return Promise.resolve(undefined)
  if (!loading) {
    loading = import('./lib/sentry-browser')
      .then((mod) => {
        // Hand global error capture over to the SDK before it installs its
        // own handlers so nothing is reported twice.
        window.removeEventListener('error', onError)
        window.removeEventListener('unhandledrejection', onUnhandledRejection)
        mod.init({
          dsn,
          tracesSampleRate: 0.1,
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 1.0,
          debug: false,
          enabled: true,
        })
        sdk = mod
        flushQueue(mod)
        return mod
      })
      .catch(() => undefined)
  }
  return loading
}

if (enabled) {
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onUnhandledRejection)
  const start = () => void load()
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(start, { timeout: 3000 })
  } else {
    setTimeout(start, 1500)
  }
}

// Lets the SDK instrument App Router navigations as transactions. Next calls
// this synchronously on every navigation; before the SDK has loaded there is
// no client to record the span on, so the navigation is simply not traced.
export const onRouterTransitionStart: Sdk['captureRouterTransitionStart'] = (
  href,
  navigationType,
) => {
  sdk?.captureRouterTransitionStart(href, navigationType)
}
