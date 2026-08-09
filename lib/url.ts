const FALLBACK_DEV_URL = "http://localhost:3000";
const FALLBACK_PROD_URL = "https://linkflame.com";

/**
 * Absolute base URL for canonical links, Open Graph images and JSON-LD.
 *
 * This is what `metadataBase` resolves from, so getting it wrong is not
 * cosmetic: every canonical URL and social preview points wherever this says.
 * A production build with none of the URL variables set was emitting
 * `http://localhost:3000/og.png` into its own metadata.
 *
 * Two things guard against that now. Vercel's own variables are consulted, so
 * a deploy is correct without anyone configuring anything; and localhost is
 * only ever returned when we are *positively* in development. Anything else -
 * an unset or unexpected NODE_ENV, a build script that clears the environment -
 * lands on the production domain rather than leaking a local address.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Vercel injects all three. Only the NEXT_PUBLIC_ one survives into the
  // client bundle, so it is tried first; the others cover server rendering.
  const vercelHost =
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;
  if (vercelHost) {
    return `https://${vercelHost}`;
  }

  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  return process.env.NODE_ENV === "development"
    ? FALLBACK_DEV_URL
    : FALLBACK_PROD_URL;
}
