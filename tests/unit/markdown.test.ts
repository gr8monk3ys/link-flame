// @vitest-environment node
// renderPostBody runs in server components, and DOMPurify misbehaves under
// happy-dom (its NodeIterator removes the wrong nodes) — node + jsdom matches
// the runtime that actually sanitizes this HTML.
import { describe, it, expect } from 'vitest'
import { renderPostBody } from '@/lib/markdown'

describe('renderPostBody', () => {
  it('converts markdown to HTML', () => {
    const html = renderPostBody('Some **bold** text\n\n- item one\n- item two')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<li>item one</li>')
  })

  it('demotes every heading one level so the page h1 stays unique', () => {
    const html = renderPostBody('# Title\n\n## Section\n\n##### Deep')
    expect(html).not.toContain('<h1')
    expect(html).toContain('<h2')
    expect(html).toContain('<h3')
    expect(html).toContain('<h6')
  })

  it('strips script tags and event handlers', () => {
    const html = renderPostBody('hello <script>alert(1)</script> <img src="x" onerror="alert(1)">')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
  })

  it('keeps links with their href', () => {
    const html = renderPostBody('[shop](/collections)')
    expect(html).toContain('<a href="/collections"')
  })

  it('returns empty string for empty input', () => {
    expect(renderPostBody('')).toBe('')
  })
})
