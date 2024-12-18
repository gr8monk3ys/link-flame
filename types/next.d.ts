// Global type definitions for Next.js page props
export type PageProps = {
  params: { 
    [key: string]: string 
  } & {
    then: <TResult1 = any, TResult2 = never>(
      onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null, 
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ) => Promise<TResult1 | TResult2>;
    catch: <TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
    ) => Promise<any>;
    finally: (onfinally?: (() => void) | null) => Promise<any>;
    [Symbol.toStringTag]: string;
  }
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
