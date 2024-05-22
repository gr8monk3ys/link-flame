const FALLBACK_DEV_URL = "http://localhost:3000";
const FALLBACK_PROD_URL = "https://linkflame.com";

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  if (process.env.NODE_ENV === "production") {
    return FALLBACK_PROD_URL;
  }

  return FALLBACK_DEV_URL;
}
