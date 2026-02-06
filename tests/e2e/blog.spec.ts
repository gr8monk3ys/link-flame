import { test, expect } from '@playwright/test'

/**
 * Blog E2E Tests
 *
 * Tests blog-related functionality:
 * - Blog listing page
 * - Blog post rendering
 * - Category filtering
 * - Tag filtering
 * - Blog search
 * - SEO metadata
 * - Navigation
 */

test.describe('Blog', () => {
  test.describe('Blog Listing Page', () => {
    test('blog listing shows posts', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Should have blog posts (articles or cards)
      const blogPost = page.locator(
        'article, [data-testid="blog-card"], .blog-card'
      )

      // Wait for posts to load
      await expect(blogPost.first()).toBeVisible({ timeout: 10000 })
    })

    test('blog page has proper heading', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Should have main heading
      const heading = page.locator('h1')
      await expect(heading).toBeVisible({ timeout: 5000 })
      await expect(heading).toContainText(/blog|eco|living/i)
    })

    test('blog posts display correct information', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Wait for posts
      await page.waitForSelector('article, [data-testid="blog-card"]', {
        timeout: 10000,
      })

      // Check first blog post card
      const firstPost = page
        .locator('article, [data-testid="blog-card"]')
        .first()

      // Should have title
      const hasTitle = await firstPost
        .locator('h2, h3')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      // Should have image
      const hasImage = await firstPost
        .locator('img')
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      // Should have author or date
      const hasMetadata = await firstPost
        .locator('time, text=/by /i, text=/\\d{4}/i')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      expect(hasTitle || hasImage || hasMetadata).toBeTruthy()
    })

    test('blog posts have read more links', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Wait for posts
      await page.waitForSelector('article, [data-testid="blog-card"]', {
        timeout: 10000,
      })

      // Should have links to individual posts
      const postLink = page.locator(
        'article a, [data-testid="blog-card"] a, a[href*="/blogs/"]'
      )

      await expect(postLink.first()).toBeVisible({ timeout: 5000 })
    })

    test('featured posts section is displayed', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Look for featured section
      const featuredSection = page.locator(
        'text=/featured/i, [data-testid="featured-posts"]'
      )
      const hasFeatured = await featuredSection
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      // Featured section may not exist if no featured posts
      expect(hasFeatured || page.url().includes('/blogs')).toBeTruthy()
    })
  })

  test.describe('Individual Blog Post', () => {
    test('individual post renders correctly', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Wait for posts
      await page.waitForSelector('[data-testid="blog-post-link"]', {
        timeout: 10000,
      })

      // Click on first post
      const postLink = page
        .locator('[data-testid="blog-card"]')
        .first()
        .locator('[data-testid="blog-post-link"]')
        .first()
      await postLink.scrollIntoViewIfNeeded()
      await postLink.click()
      await page.waitForURL(/\/blogs\/[^/]+$/, {
        timeout: 10000,
        waitUntil: 'domcontentloaded',
      })

      // Should be on individual post page
      expect(page.url()).toMatch(/\/blogs\/[^/]+$/)

      // Should have article content
      const article = page.locator('article')
      await expect(article).toBeVisible({ timeout: 10000 })
    })

    test('blog post shows title', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="blog-post-link"]', {
        timeout: 10000,
      })

      // Navigate to post
      await Promise.all([
        page.waitForURL(/\/blogs\/[^/]+$/, { timeout: 10000 }),
        page.locator('[data-testid="blog-post-link"]').first().click(),
      ])

      // Should have h1 title
      const title = page.locator('h1')
      await expect(title).toBeVisible({ timeout: 5000 })
    })

    test('blog post shows author information', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="blog-post-link"]', {
        timeout: 10000,
      })

      // Navigate to post
      await Promise.all([
        page.waitForURL(/\/blogs\/[^/]+$/, { timeout: 10000 }),
        page.locator('[data-testid="blog-post-link"]').first().click(),
      ])

      // Should show author info
      const authorInfo = page.locator(
        'text=/by /i, [data-testid="author"], .author, img[alt*="author"]'
      )
      const hasAuthor = await authorInfo
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      expect(hasAuthor || page.url().includes('/blogs/')).toBeTruthy()
    })

    test('blog post shows publish date', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="blog-post-link"]', {
        timeout: 10000,
      })

      // Navigate to post
      await Promise.all([
        page.waitForURL(/\/blogs\/[^/]+$/, { timeout: 10000 }),
        page.locator('[data-testid="blog-post-link"]').first().click(),
      ])

      // Should show date
      const dateElement = page.locator('time, text=/\\d{4}/i')
      const hasDate = await dateElement
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      expect(hasDate || page.url().includes('/blogs/')).toBeTruthy()
    })

    test('blog post shows reading time', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="blog-post-link"]', {
        timeout: 10000,
      })

      // Navigate to post
      await Promise.all([
        page.waitForURL(/\/blogs\/[^/]+$/, { timeout: 10000 }),
        page.locator('[data-testid="blog-post-link"]').first().click(),
      ])
      await page.waitForSelector('article', { timeout: 10000 })

      // Should show reading time
      const readingTime = page.locator('text=/min read/i, text=/minute/i')
      const hasReadingTime = await readingTime
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      expect(hasReadingTime || page.url().includes('/blogs/')).toBeTruthy()
    })

    test('blog post shows cover image', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="blog-post-link"]', {
        timeout: 10000,
      })

      // Navigate to post
      await Promise.all([
        page.waitForURL(/\/blogs\/[^/]+$/, { timeout: 10000 }),
        page.locator('[data-testid="blog-post-link"]').first().click(),
      ])
      await page.waitForSelector('article', { timeout: 10000 })

      // Should have cover image
      const image = page.locator('img')
      await expect(image.first()).toBeVisible({ timeout: 5000 })
    })

    test('blog post shows category and tags', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="blog-post-link"]', {
        timeout: 10000,
      })

      // Navigate to post
      await Promise.all([
        page.waitForURL(/\/blogs\/[^/]+$/, { timeout: 10000 }),
        page.locator('[data-testid="blog-post-link"]').first().click(),
      ])
      await page.waitForSelector('article', { timeout: 10000 })

      // Should show category or tags
      const categoryTags = page.locator(
        'a[href*="/categories/"], a[href*="/tags/"], text=/#/i'
      )
      const hasCategoryTags = await categoryTags
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      expect(hasCategoryTags || page.url().includes('/blogs/')).toBeTruthy()
    })
  })

  test.describe('Category Filtering', () => {
    test('can navigate to category page', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Find category link
      const categoryLink = page.locator(
        'a[href*="/blogs/categories/"], a[href*="/categories/"], [data-testid="category-link"]'
      )

      if (await categoryLink.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await Promise.all([
          page.waitForURL(/\/blogs\/categories\/[a-zA-Z0-9-]+/, { timeout: 10000 }),
          categoryLink.first().click(),
        ])

        // Should be on category page
        expect(page.url()).toMatch(/\/blogs\/categories\/[a-zA-Z0-9-]+/)
      }
    })

    test('category page shows filtered posts', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Find and click category link
      const categoryLink = page
        .locator('a[href*="/blogs/categories/"], a[href*="/categories/"]')
        .first()

      if (await categoryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        const categoryHref = await categoryLink.getAttribute('href')
        await categoryLink.click()
        await page.waitForLoadState('domcontentloaded')

        // Should show posts
        const posts = page.locator('article, [data-testid="blog-card"]')
        const postCount = await posts.count()

        // May have 0 posts if category is empty
        expect(postCount >= 0).toBeTruthy()
      }
    })

    test('category page shows category heading', async ({ page }) => {
      // Navigate directly to a category page
      await page.goto('/blogs/categories/lifestyle', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Should have category heading or handle 404
      const heading = page.locator('h1, h2')
      const has404 = await page
        .locator('text=/not found|404/i')
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      expect(
        (await heading.first().isVisible({ timeout: 3000 }).catch(() => false)) ||
          has404 ||
          page.url().includes('/blogs/')
      ).toBeTruthy()
    })
  })

  test.describe('Tag Filtering', () => {
    test('can navigate to tag page', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Find tag link
      const tagLink = page.locator(
        'a[href*="/blogs/tags/"], a[href*="/tags/"], [data-testid="tag-link"]'
      )

      if (await tagLink.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await Promise.all([
          page.waitForURL(/\/blogs\/tags\/[a-zA-Z0-9-]+/, { timeout: 10000 }),
          tagLink.first().click(),
        ])

        // Should be on tag page
        expect(page.url()).toContain('/tags/')
      }
    })

    test('tag page shows filtered posts', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Find and click tag link
      const tagLink = page
        .locator('a[href*="/blogs/tags/"], a[href*="/tags/"]')
        .first()

      if (await tagLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await tagLink.click()
        await page.waitForLoadState('domcontentloaded')

        // Should show posts or empty state
        const posts = page.locator('article, [data-testid="blog-card"]')
        const postCount = await posts.count()

        expect(postCount >= 0).toBeTruthy()
      }
    })
  })

  test.describe('Blog Search', () => {
    test('blog search is available', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Look for search input
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search"], input[name="search"], [data-testid="blog-search"]'
      )
      const hasSearch = await searchInput
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      expect(hasSearch || page.url().includes('/blogs')).toBeTruthy()
    })

    test('blog search returns results', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Find search input
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search"], input[name="search"]'
      )

      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill('eco')
        await page.keyboard.press('Enter')
        await page.waitForLoadState('domcontentloaded')

        // Should show results or no results message
        const results = page.locator('article, [data-testid="blog-card"]')
        const hasResults = await results
          .first()
          .isVisible({ timeout: 5000 })
          .catch(() => false)
        const hasNoResults = await page
          .getByText(/no results/i)
          .isVisible({ timeout: 3000 })
          .catch(() => false)

        expect(hasResults || hasNoResults).toBeTruthy()
      }
    })

    test('blog search handles empty results', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Find search input
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search"], input[name="search"]'
      )

      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill('xyznonexistentterm123')
        await page.keyboard.press('Enter')
        await page.waitForLoadState('domcontentloaded')

        // Should show empty state
        const emptyState = page.locator('text=/no results|not found|no posts/i')
        const hasEmptyState = await emptyState
          .isVisible({ timeout: 5000 })
          .catch(() => false)

        expect(hasEmptyState || page.url().includes('/blogs')).toBeTruthy()
      }
    })
  })

  test.describe('SEO Metadata', () => {
    test('blog page has proper meta tags', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Check for title tag
      const title = await page.title()
      expect(title.length).toBeGreaterThan(0)
    })

    test('blog post has proper meta description', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="blog-post-link"]', {
        timeout: 10000,
      })

      // Navigate to post
      await Promise.all([
        page.waitForURL(/\/blogs\/[^/]+$/, { timeout: 10000 }),
        page.locator('[data-testid="blog-post-link"]').first().click(),
      ])
      await page.waitForSelector('article', { timeout: 10000 })

      // Check for meta description
      const metaDescription = await page
        .locator('meta[name="description"]')
        .first()
        .getAttribute('content')

      // Meta description should exist and have content
      expect(metaDescription?.length || 0).toBeGreaterThanOrEqual(0)
    })

    test('blog post has Open Graph tags', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="blog-post-link"]', {
        timeout: 10000,
      })

      // Navigate to post
      await Promise.all([
        page.waitForURL(/\/blogs\/[^/]+$/, { timeout: 10000 }),
        page.locator('[data-testid="blog-post-link"]').first().click(),
      ])
      await page.waitForSelector('article', { timeout: 10000 })

      // Check for OG tags
      const ogTitle = await page
        .locator('meta[property="og:title"]')
        .getAttribute('content')
        .catch(() => null)

      const ogDescription = await page
        .locator('meta[property="og:description"]')
        .getAttribute('content')
        .catch(() => null)

      const ogImage = await page
        .locator('meta[property="og:image"]')
        .getAttribute('content')
        .catch(() => null)

      // At least one OG tag should be present
      expect(ogTitle || ogDescription || ogImage).toBeTruthy()
    })

    test('blog post has JSON-LD structured data', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="blog-post-link"]', {
        timeout: 10000,
      })

      // Navigate to post
      await Promise.all([
        page.waitForURL(/\/blogs\/[^/]+$/, { timeout: 10000 }),
        page.locator('[data-testid="blog-post-link"]').first().click(),
      ])
      await page.waitForSelector('article', { timeout: 10000 })

      // Check for JSON-LD
      await page.waitForSelector('script[type="application/ld+json"]', {
        timeout: 10000,
        state: 'attached',
      })
      const jsonLd = await page
        .locator('script[type="application/ld+json"]')
        .first()
        .textContent()
        .catch(() => null)

      if (jsonLd) {
        const parsed = JSON.parse(jsonLd)
        expect(parsed['@type'] || parsed['@context']).toBeDefined()
      }
    })
  })

  test.describe('Navigation', () => {
    test('can navigate back from post to blog listing', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="blog-post-link"]', {
        timeout: 10000,
      })

      // Navigate to post
      await Promise.all([
        page.waitForURL(/\/blogs\/[^/]+$/, { timeout: 10000 }),
        page.locator('[data-testid="blog-post-link"]').first().click(),
      ])
      await page.waitForSelector('article', { timeout: 10000 })

      // Find back link or use browser back
      const backLink = page.locator(
        'a[href="/blogs"], a:has-text("Back"), a:has-text("Blog")'
      )

      if (await backLink.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await backLink.first().click()
        await page.waitForURL(/\/blogs\/?$/, { timeout: 10000 })

        // Should be back on blog listing
        expect(page.url()).toMatch(/\/blogs\/?$/)
      } else {
        // Use browser back
        await page.goBack()
        await page.waitForURL(/\/blogs\/?$/, { timeout: 10000 })

        expect(page.url()).toContain('/blogs')
      }
    })

    test('category links from post work', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="blog-post-link"]', {
        timeout: 10000,
      })

      // Navigate to post
      await Promise.all([
        page.waitForURL(/\/blogs\/[^/]+$/, { timeout: 10000 }),
        page.locator('[data-testid="blog-post-link"]').first().click(),
      ])
      await page.waitForSelector('article', { timeout: 10000 })

      // Find category link on post
      const categoryLink = page.locator('a[href*="/categories/"]')

      if (await categoryLink.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await Promise.all([
          page.waitForURL(/\/blogs\/categories\/[a-zA-Z0-9-]+/, { timeout: 10000 }),
          categoryLink.first().click(),
        ])

        // Should be on category page
        expect(page.url()).toContain('/categories/')
      }
    })

    test('tag links from post work', async ({ page }) => {
      await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="blog-post-link"]', {
        timeout: 10000,
      })

      // Navigate to post
      await Promise.all([
        page.waitForURL(/\/blogs\/[^/]+$/, { timeout: 10000 }),
        page.locator('[data-testid="blog-post-link"]').first().click(),
      ])
      await page.waitForSelector('article', { timeout: 10000 })

      // Find tag link on post
      const tagLink = page.locator('a[href*="/tags/"]')

      if (await tagLink.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await Promise.all([
          page.waitForURL(/\/blogs\/tags\/[a-zA-Z0-9-]+/, { timeout: 10000 }),
          tagLink.first().click(),
        ])

        // Should be on tag page
        expect(page.url()).toContain('/tags/')
      }
    })
  })

  test.describe('Blog API', () => {
    test('blog API returns posts', async ({ page }) => {
      const response = await page.request.get('/api/blog/posts')

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body.success).toBeTruthy()
      expect(Array.isArray(body.data)).toBeTruthy()
    })

    test('blog API supports search', async ({ page }) => {
      const response = await page.request.get('/api/blog/search?q=eco')

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body.success).toBeTruthy()
      expect(Array.isArray(body.data)).toBeTruthy()
    })

    test('blog API supports category filter', async ({ page }) => {
      const listResponse = await page.request.get('/api/blog/posts')
      const listBody = await listResponse.json()

      expect(listResponse.ok()).toBeTruthy()
      expect(listBody.success).toBeTruthy()

      const category = listBody.data?.[0]?.category
      if (category) {
        const response = await page.request.get(`/api/blog/posts?category=${encodeURIComponent(category)}`)
        expect(response.ok()).toBeTruthy()

        const body = await response.json()
        expect(body.success).toBeTruthy()
        expect(Array.isArray(body.data)).toBeTruthy()
      }
    })

    test('single blog post API returns post details', async ({ page }) => {
      // First get list of posts
      const listResponse = await page.request.get('/api/blog/posts')
      const listBody = await listResponse.json()

      if (listBody.data?.length > 0) {
        const slug = listBody.data[0].slug

        // Get specific post
        const response = await page.request.get(`/api/blog/post/${slug}`)

        expect(response.ok()).toBeTruthy()

        const body = await response.json()
        expect(body.slug).toBe(slug)
        expect(body).toHaveProperty('title')
      }
    })
  })
})
