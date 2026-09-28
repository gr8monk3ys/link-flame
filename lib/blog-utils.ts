// Pure helpers and types for blog posts. Safe to import from client components
// (lib/blog.ts reads the filesystem and must stay server-only).

export interface Author {
  name: string
  image: string
  bio: string
}

export interface BlogPost {
  slug: string
  title: string
  description: string
  coverImage: string
  publishedAt: Date
  author: Author
  category: string
  tags: string[]
  readingTime: string
  featured?: boolean
  content?: string
}

/** Pure, isomorphic filter so it can run in client components. */
export function filterPosts<T extends Pick<BlogPost, "title" | "description" | "tags" | "category">>(
  posts: T[],
  query: string
): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(q) ||
      post.description.toLowerCase().includes(q) ||
      post.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      post.category.toLowerCase().includes(q)
  )
}

export function postHref(post: Pick<BlogPost, "slug">) {
  return `/blogs/${post.slug}`
}

export function categoryHref(category: string) {
  return `/blogs/categories/${encodeURIComponent(category)}`
}

export function tagHref(tag: string) {
  return `/blogs/tags/${encodeURIComponent(tag.toLowerCase())}`
}
