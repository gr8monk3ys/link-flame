import { spawnSync } from 'node:child_process'
import nextEnv from '@next/env'

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: false,
    ...opts,
  })

  if (result.error) {
    throw result.error
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`)
  }
}

/**
 * Prepare the database for deterministic E2E runs.
 *
 * This script is intentionally non-destructive:
 * - It does NOT reset the database or wipe user data.
 * - It ensures at least one product is eligible for "Subscribe & Save" so
 *   the UI + API filter tests have stable data to validate.
 *
 * Use E2E_DATABASE_URL / E2E_DIRECT_URL to point to an isolated test database.
 */
async function main() {
  const { loadEnvConfig } = nextEnv
  // Match Next.js runtime env resolution so DB setup targets the same database.
  loadEnvConfig(process.cwd())

  const env = { ...process.env }

  // Prefer isolated E2E DB variables when provided.
  if (typeof env.E2E_DATABASE_URL === 'string' && env.E2E_DATABASE_URL.trim().length > 0) {
    env.DATABASE_URL = env.E2E_DATABASE_URL
  }
  if (typeof env.E2E_DIRECT_URL === 'string' && env.E2E_DIRECT_URL.trim().length > 0) {
    env.DIRECT_URL = env.E2E_DIRECT_URL
  }

  // Ensure E2E has deterministic catalog data:
  // - at least one in-stock product exists
  // - at least one subscribable product exists
  // This is safe to run repeatedly.
  const sql = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Product") THEN
    INSERT INTO "Product" (
      "id",
      "title",
      "description",
      "price",
      "image",
      "category",
      "inventory",
      "isSubscribable",
      "createdAt",
      "updatedAt"
    ) VALUES (
      'e2e_product_seed_1',
      'Reusable Bamboo Toothbrush',
      'Seeded product for deterministic E2E runs',
      12.99,
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80',
      'Personal Care',
      50,
      true,
      NOW(),
      NOW()
    );
  END IF;

  UPDATE "Product"
  SET
    "inventory" = GREATEST("inventory", 10),
    "updatedAt" = NOW()
  WHERE "id" IN (
    SELECT "id"
    FROM "Product"
    ORDER BY "createdAt" ASC
    LIMIT 3
  );

  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE "isSubscribable" = true) THEN
    UPDATE "Product"
    SET
      "isSubscribable" = true,
      "updatedAt" = NOW()
    WHERE "id" IN (
      SELECT "id"
      FROM "Product"
      ORDER BY "createdAt" ASC
      LIMIT 3
    );
  END IF;
END $$;
`.trim()

  run('npx', ['prisma', 'db', 'execute', '--schema', 'prisma/schema.prisma', '--stdin'], {
    env,
    input: sql,
    stdio: ['pipe', 'inherit', 'inherit'],
  })
}

main().catch((error) => {
  // Keep the message concise; the underlying command already prints details.
  console.error('[e2e-setup-db] Failed')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
