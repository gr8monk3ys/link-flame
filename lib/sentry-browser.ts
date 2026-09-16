// The browser SDK entry points this app uses, and nothing else.
//
// Both callers load Sentry with a dynamic `import()` so it stays off the
// critical path. A dynamic `import('@sentry/nextjs')` has to materialise the
// whole namespace, which pulls Session Replay, Feedback and friends into the
// async chunk (580 KB raw, ~3x the SDK this app actually runs). Named
// re-exports from a static import are tree-shaken by Turbopack, so importing
// this module dynamically gets only these three plus their dependencies.
export { init, captureException, captureRouterTransitionStart } from '@sentry/nextjs'
