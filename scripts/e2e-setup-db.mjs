import { spawnSync } from 'node:child_process'

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
  const env = { ...process.env }

  // Prefer isolated E2E DB variables when provided.
  if (typeof env.E2E_DATABASE_URL === 'string' && env.E2E_DATABASE_URL.trim().length > 0) {
    env.DATABASE_URL = env.E2E_DATABASE_URL
  }
  if (typeof env.E2E_DIRECT_URL === 'string' && env.E2E_DIRECT_URL.trim().length > 0) {
    env.DIRECT_URL = env.E2E_DIRECT_URL
  }

  // Ensure at least one subscribable product exists for E2E.
  // This is safe to run repeatedly.
  const sql = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE "isSubscribable" = true) THEN
    UPDATE "Product"
    SET "isSubscribable" = true
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
