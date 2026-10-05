import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import path from 'path'

/**
 * Every API endpoint the admin UI fetches must exist. The admin blog pages
 * once called /api/blog and /api/blog/:id, which were never implemented, so
 * the whole section 404'd.
 */

const ROOT = path.resolve(__dirname, '../..')
const ADMIN_DIR = path.join(ROOT, 'app/admin')
const API_DIR = path.join(ROOT, 'app/api')

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? listFiles(full) : [full]
  })
}

/** Resolve "/api/a/b" against app/api, allowing [param] directories. */
function routeExists(segments: string[], dir: string = API_DIR): boolean {
  if (segments.length === 0) return existsSync(path.join(dir, 'route.ts'))
  const [head, ...rest] = segments
  if (existsSync(path.join(dir, head)) && routeExists(rest, path.join(dir, head))) return true
  return readdirSync(dir)
    .filter((name) => /^\[[^.\]]+\]$/.test(name) && statSync(path.join(dir, name)).isDirectory())
    .some((name) => routeExists(rest, path.join(dir, name)))
}

function adminApiCalls(): Array<{ file: string; url: string }> {
  const calls: Array<{ file: string; url: string }> = []
  for (const file of listFiles(ADMIN_DIR).filter((f) => /\.tsx?$/.test(f))) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/fetch\(\s*[`'"](\/api\/[^`'"]*)[`'"]/g)) {
      calls.push({ file: path.relative(ROOT, file), url: match[1] })
    }
  }
  return calls
}

function toSegments(url: string): string[] {
  return url
    .split('?')[0]
    .replace(/^\/api\//, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => (segment.includes('${') ? '__dynamic__' : segment))
}

describe('admin UI API calls', () => {
  const calls = adminApiCalls()

  it('finds the admin fetch calls it is meant to check', () => {
    expect(calls.length).toBeGreaterThan(0)
  })

  it.each(calls.map((c) => [c.url, c.file]))('%s (from %s) has a route handler', (url) => {
    expect(routeExists(toSegments(url))).toBe(true)
  })

  it('the resolver rejects endpoints that do not exist', () => {
    expect(routeExists(toSegments('/api/blog'))).toBe(false)
    expect(routeExists(toSegments('/api/blog/${id}'))).toBe(false)
  })
})
