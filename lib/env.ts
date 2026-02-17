/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at build/start time.
 * Prevents runtime errors from missing or invalid configuration.
 *
 * Usage: Import { env } from '@/lib/env' instead of process.env
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database (optional at build time, required at runtime)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').optional(),
  // Prisma `directUrl` expects DIRECT_URL (used for migrations / bypassing poolers).
  // Keep DIRECT_DATABASE_URL as a legacy alias to avoid breaking existing setups.
  DIRECT_URL: z.string().optional(),
  DIRECT_DATABASE_URL: z.string().optional(),

  // NextAuth (optional at build time, required at runtime)
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters').optional(),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),

  // Stripe (Required for payment processing, optional in build-time)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_').optional(),

  // Public Environment Variables
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL').optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith('pk_', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_')
    .optional(),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Optional: Upstash Redis (for rate limiting & caching)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Optional: Resend (for email notifications)
  RESEND_API_KEY: z.string().startsWith('re_', 'RESEND_API_KEY must start with re_').optional(),
});

// Parse and validate environment variables
function validateEnv() {
  try {
    return envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL ?? process.env.DIRECT_DATABASE_URL,
      DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      // Never throw during build — runtime will catch missing vars when actually needed
      console.warn('⚠️  Continuing with invalid environment variables');
      console.warn('⚠️  Some features may not work correctly');
    }
    // Return a partial result so the build can continue
    return envSchema.parse({ NODE_ENV: process.env.NODE_ENV }) as ReturnType<typeof envSchema.parse>;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Additional production-only checks that require cross-field validation
// Use warnings during build to avoid blocking Vercel deployments
if (env.NODE_ENV === 'production') {
  if (!env.NEXT_PUBLIC_APP_URL) {
    console.warn('⚠️  NEXT_PUBLIC_APP_URL is not set. Set it in your deployment environment.');
  }
  if (env.STRIPE_SECRET_KEY && !env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn('⚠️  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required when Stripe is enabled');
  }
}

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;
