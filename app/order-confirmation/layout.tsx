// This route keeps the per-request CSP nonce (lib/csp.ts), and a nonce can
// only be stamped on scripts at render time. Without this the pages under
// here prerender at build without nonces, and the strict policy blocks every
// script. tests/unit/csp.test.tsx checks each nonce route has this layout.
export const dynamic = 'force-dynamic'

export default function NonceRouteLayout({ children }: { children: React.ReactNode }) {
  return children
}
