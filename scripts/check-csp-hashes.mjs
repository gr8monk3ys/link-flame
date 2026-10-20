#!/usr/bin/env node

// Checks INLINE_SCRIPT_HASHES (lib/csp.ts) against the inline scripts the
// production build actually serves. Run after `next build`.
//
// The unit test can only hash scripts as rendered from package source. That
// is not what production serves for next-themes (0.4+): it builds its script
// from `fn.toString()`, so the text is whatever the bundler's minifier printed.
// The prerendered pages in .next/server/app carry the real text, and every one
// renders the root layout, so each must contain every allowlisted script.
// The exception is _global-error.html: app/global-error.tsx replaces the root
// layout with its own <html>, so it renders neither script.

import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

const root = process.cwd()
const cspSource = fs.readFileSync(path.join(root, 'lib/csp.ts'), 'utf8')
const block = cspSource.match(/export const INLINE_SCRIPT_HASHES = \{([\s\S]*?)\} as const/)
if (!block) {
  console.error('Could not find INLINE_SCRIPT_HASHES in lib/csp.ts')
  process.exit(1)
}
const expected = Object.fromEntries(
  Array.from(block[1].matchAll(/(\w+):\s*'(sha256-[A-Za-z0-9+/=]+)'/g)).map((m) => [m[1], m[2]])
)
if (Object.keys(expected).length === 0) {
  console.error('INLINE_SCRIPT_HASHES in lib/csp.ts has no sha256 entries')
  process.exit(1)
}

const appDir = path.join(root, '.next/server/app')
if (!fs.existsSync(appDir)) {
  console.error('No .next/server/app: run `next build` first')
  process.exit(1)
}
const pages = fs
  .readdirSync(appDir, { recursive: true })
  .filter((file) => file.endsWith('.html') && path.basename(file) !== '_global-error.html')
  .map((file) => path.join(appDir, file))
if (pages.length === 0) {
  console.error('No prerendered pages in .next/server/app')
  process.exit(1)
}

function inlineScripts(html) {
  return Array.from(html.matchAll(/<script((?:\s[^>]*)?)>([\s\S]*?)<\/script>/g))
    .filter((m) => !/\ssrc=/.test(m[1]) && m[2].length > 0)
    .map((m) => ({
      hash: `sha256-${createHash('sha256').update(m[2], 'utf8').digest('base64')}`,
      preview: m[2].slice(0, 70),
    }))
}

let failures = 0
for (const page of pages) {
  const scripts = inlineScripts(fs.readFileSync(page, 'utf8'))
  const served = new Set(scripts.map((s) => s.hash))
  const missing = Object.entries(expected).filter(([, hash]) => !served.has(hash))
  if (missing.length === 0) continue
  failures++
  console.error(`${path.relative(root, page)}: not served: ${missing.map(([name]) => name).join(', ')}`)
  for (const script of scripts) {
    if (script.preview.startsWith('self.__next_f') || script.preview.startsWith('(self.__next_f')) continue
    console.error(`  ${script.hash}  ${script.preview}`)
  }
}

if (failures > 0) {
  console.error(
    `\n${failures} of ${pages.length} prerendered pages do not serve every INLINE_SCRIPT_HASHES script.` +
      '\nUpdate lib/csp.ts with the matching hash listed above.'
  )
  process.exit(1)
}
console.log(
  `INLINE_SCRIPT_HASHES (${Object.keys(expected).join(', ')}) match all ${pages.length} prerendered pages.`
)
