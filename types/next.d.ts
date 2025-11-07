// Global type definitions for Next.js page props
// Next.js 15+ uses Promise-based params for dynamic routes
export type PageProps<T extends Record<string, string> = Record<string, string>> = {
  params: Promise<T>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

// Extend the global namespace to include this type
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_APP_URL: string;
      // Add other environment variables as needed
    }
  }
}

export {}  // Ensure this is treated as a module
