#!/usr/bin/env node

// Runs exactly what CI gates on. Every CI job calls this with its group, so a
// green local run is the same set of commands a green CI run is.
//
//   npm run verify                 # every group, in CI's order
//   npm run verify -- lint unit    # just those groups
//
// Groups (one per CI job):
//   lint        Lint & Type Check   eslint, design-system check, tsc
//   unit        Unit Tests          vitest
//   build       Build               next build, inline-script CSP hashes
//   e2e         E2E Tests           prisma db push + seed, Playwright
//   lighthouse  Lighthouse          prisma db push + seed, next build,
//                                   next start on :3000, score floors
//
// e2e and lighthouse need a Postgres in DATABASE_URL / DIRECT_URL that they
// may push the schema to and seed (CI uses a throwaway postgres:16 service).
// Dependencies are not installed here: run `npm ci` first, as CI does.

import { spawn, spawnSync } from 'node:child_process'
import { openSync, closeSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'

function run(title, cmd, args, env = {}) {
  console.log(`\n==> ${title}: ${[cmd, ...args].join(' ')}`)
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${title} failed (exit ${result.status ?? result.signal})`)
  }
}

function requireDatabase(group) {
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    throw new Error(
      `${group} needs DATABASE_URL and DIRECT_URL pointing at a disposable Postgres (schema is pushed and seeded)`,
    )
  }
}

function prepareDatabase(group) {
  requireDatabase(group)
  run('Setup test database', npx, ['prisma', 'db', 'push'])
  run('Seed test database', npx, ['prisma', 'db', 'seed'])
}

async function waitFor(url, attempts, delayMs) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, delayMs))
  }
  return false
}

const groups = {
  lint() {
    run('ESLint', npm, ['run', 'lint'])
    run('Design system check', npm, ['run', 'design:check'])
    run('TypeScript type check', npx, ['tsc', '--noEmit'])
  },

  unit() {
    run('Unit tests', npm, ['run', 'test:unit'], { CI: 'true' })
  },

  build() {
    run('Build application', npm, ['run', 'build'])
    run('Check inline-script CSP hashes', npm, ['run', 'check:csp-hashes'])
  },

  e2e() {
    prepareDatabase('e2e')
    run('E2E tests', npm, ['run', 'test:e2e'], { CI: 'true' })
  },

  async lighthouse() {
    prepareDatabase('lighthouse')
    run('Build application', npm, ['run', 'build'])

    const logPath = join(tmpdir(), 'link-flame-lighthouse-server.log')
    const logFd = openSync(logPath, 'w')
    console.log(`\n==> Start application on :3000 (log: ${logPath})`)
    const server = spawn(npm, ['run', 'start', '--', '-p', '3000'], {
      stdio: ['ignore', logFd, logFd],
      detached: process.platform !== 'win32',
    })
    const stop = () => {
      try {
        if (process.platform === 'win32') server.kill()
        else process.kill(-server.pid, 'SIGTERM')
      } catch {
        // already gone
      }
    }
    try {
      if (!(await waitFor('http://127.0.0.1:3000/', 30, 2000))) {
        throw new Error('application did not answer on http://127.0.0.1:3000/ within 60s')
      }
      run('Enforce Lighthouse scores', npm, ['run', 'lighthouse:ci'])
    } catch (error) {
      console.error(readFileSync(logPath, 'utf8'))
      throw error
    } finally {
      stop()
      closeSync(logFd)
    }
  },
}

const requested = process.argv.slice(2)
const selected = requested.length > 0 ? requested : Object.keys(groups)
const unknown = selected.filter((g) => !(g in groups))
if (unknown.length > 0) {
  console.error(`unknown group(s): ${unknown.join(', ')}; choose from ${Object.keys(groups).join(', ')}`)
  process.exit(2)
}

try {
  for (const group of selected) {
    console.log(`\n### verify: ${group}`)
    await groups[group]()
  }
  console.log(`\nverify: ${selected.join(' + ')} passed`)
} catch (error) {
  console.error(`\nverify: ${error.message}`)
  process.exit(1)
}
