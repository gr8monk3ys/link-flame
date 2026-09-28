import { existsSync } from "fs"
import { readFile, readdir } from "fs/promises"
import path from "path"
import matter from "gray-matter"
import { cache } from "react"

import type { BlogPost } from "@/lib/blog-utils"

export type { Author, BlogPost } from "@/lib/blog-utils"

const postsDirectory = path.join(process.cwd(), "content/blogs")

const publicDirectory = path.join(process.cwd(), "public")

// An existing asset in /public, used when a post has no usable cover image.
const DEFAULT_COVER_IMAGE = "/images/leaves.jpg"

/**
 * Returns `src` if it is a remote URL or a file that exists under /public,
 * otherwise `undefined`, so a typo'd or not-yet-added image never 404s.
 */
function resolveImage(src: unknown): string | undefined {
  if (typeof src !== "string" || src.trim() === "") return undefined
  if (/^https?:\/\//.test(src)) return src
  if (!src.startsWith("/")) return undefined
  return existsSync(path.join(publicDirectory, src)) ? src : undefined
}

const byNewest = (a: BlogPost, b: BlogPost) =>
  b.publishedAt.getTime() - a.publishedAt.getTime()

// Cache the single post retrieval (per request)
export const getMDXPost = cache(async (slug: string): Promise<BlogPost | null> => {
  const fullPath = path.join(postsDirectory, `${slug}.mdx`)

  try {
    const fileContents = await readFile(fullPath, "utf8")
    const { data, content } = matter(fileContents)

    return {
      slug,
      title: data.title,
      description: data.description || "",
      coverImage: resolveImage(data.coverImage) ?? DEFAULT_COVER_IMAGE,
      publishedAt: new Date(data.date),
      author: {
        name: data.author?.name || "Link Flame Team",
        image: resolveImage(data.author?.image),
        bio:
          data.author?.bio ||
          "Passionate about sustainability and eco-friendly living.",
      },
      category: data.category || "General",
      tags: data.tags || ["Sustainability"],
      readingTime: `${Math.ceil(content.split(" ").length / 200)} min read`,
      content,
      featured: data.featured || false,
    }
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error)
    return null
  }
})

// Cache the MDX posts retrieval (per request). Posts that fail to parse are skipped.
export const getAllMDXPosts = cache(async (): Promise<BlogPost[]> => {
  const fileNames = await readdir(postsDirectory)

  const posts = await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith(".mdx"))
      .map((fileName) => getMDXPost(fileName.replace(/\.mdx$/, "")))
  )

  return posts.filter((post): post is BlogPost => post !== null).sort(byNewest)
})

// Additional helper functions
export async function getAllPosts(): Promise<BlogPost[]> {
  return getAllMDXPosts()
}

export async function getFeaturedPosts(): Promise<BlogPost[]> {
  const posts = await getAllMDXPosts()
  return posts.filter((post) => post.featured)
}

export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const posts = await getAllMDXPosts()
  return posts.filter(
    (post) => post.category.toLowerCase() === category.toLowerCase()
  )
}

export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getAllMDXPosts()
  return posts.filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  )
}

export async function getTagCounts(): Promise<Array<{ tag: string; count: number }>> {
  const posts = await getAllMDXPosts()
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) {
      const normalized = tag.toLowerCase()
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
    }
  }
  return Array.from(counts, ([tag, count]) => ({ tag, count })).sort(
    (a, b) => b.count - a.count
  )
}
