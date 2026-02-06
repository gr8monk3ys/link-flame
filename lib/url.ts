const FALLBACK_DEV_URL = "http://localhost:3000";
const FALLBACK_PROD_URL = "https://linkflame.com";

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.NODE_ENV === "development") {
    return FALLBACK_DEV_URL;
  }

  return FALLBACK_PROD_URL;
}
