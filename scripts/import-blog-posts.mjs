#!/usr/bin/env node
/**
 * Import blog posts from a folder of Markdown files into the database.
 *
 *   node scripts/import-blog-posts.mjs <folder>                 # dry run: prints what would change
 *   node scripts/import-blog-posts.mjs <folder> --apply         # writes
 *   node scripts/import-blog-posts.mjs <folder> --apply --remove welcome,getting-started
 *
 * Each file is front matter plus a Markdown body:
 *
 *   ---
 *   slug: how-to-count-a-day-of-waste
 *   title: "How to count a day of household waste"
 *   description: "..."
 *   category: Guides
 *   tags: waste-audit,method
 *   publishedAt: 2026-11-11
 *   readingTime: "5 min read"
 *   featured: false
 *   coverImage: /images/blogs/default-hero.jpg   # optional
 *   ---
 *
 * Posts are upserted by slug, so running it twice changes nothing new. Every
 * post gets the one byline "Team Link Flame" (created if missing). Categories
 * are found by name, or created. `--remove` deletes posts by slug; it is the
 * only delete this script does. Uses DATABASE_URL from the environment.
 */
import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import matter from "gray-matter"
import { PrismaClient } from "@prisma/client"

const AUTHOR = { name: "Team Link Flame", role: "Editorial Team", image: "/images/team/default-avatar.jpg" }

const args = process.argv.slice(2)
const folder = args.find((a) => !a.startsWith("--"))
const apply = args.includes("--apply")
const removeIdx = args.indexOf("--remove")
const removeSlugs =
  removeIdx >= 0 ? (args[removeIdx + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean) : []

if (!folder) {
  console.error("Usage: node scripts/import-blog-posts.mjs <folder> [--apply] [--remove slug,slug]")
  process.exit(2)
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function readPosts(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_") && f !== "README.md")
  return files.map((file) => {
    const { data, content } = matter(readFileSync(join(dir, file), "utf8"))
    const missing = ["slug", "title", "description", "category", "publishedAt"].filter((k) => !data[k])
    if (missing.length) throw new Error(`${file}: missing ${missing.join(", ")}`)
    if (!SLUG.test(String(data.slug))) throw new Error(`${file}: bad slug "${data.slug}"`)
    const publishedAt = new Date(data.publishedAt)
    if (Number.isNaN(publishedAt.getTime())) throw new Error(`${file}: bad publishedAt`)
    if (!content.trim()) throw new Error(`${file}: empty body`)
    return {
      file,
      slug: String(data.slug),
      title: String(data.title),
      description: String(data.description),
      category: String(data.category),
      tags: data.tags ? String(data.tags) : null,
      readingTime: data.readingTime ? String(data.readingTime) : null,
      featured: data.featured === true,
      coverImage: data.coverImage ? String(data.coverImage) : "/images/blogs/default-hero.jpg",
      publishedAt,
      content: content.trim() + "\n",
    }
  })
}

const posts = readPosts(resolve(folder))
const slugs = new Set()
for (const p of posts) {
  if (slugs.has(p.slug)) throw new Error(`duplicate slug ${p.slug}`)
  slugs.add(p.slug)
}
const clash = removeSlugs.filter((s) => slugs.has(s))
if (clash.length) throw new Error(`--remove names a post this import writes: ${clash.join(", ")}`)

const prisma = new PrismaClient()
try {
  const existing = await prisma.blogPost.findMany({
    where: { slug: { in: [...slugs, ...removeSlugs] } },
    select: { slug: true },
  })
  const have = new Set(existing.map((p) => p.slug))

  console.log(apply ? "APPLY" : "DRY RUN (add --apply to write)")
  for (const p of posts) console.log(`  ${have.has(p.slug) ? "update" : "create"}  ${p.slug}  (${p.category})`)
  for (const s of removeSlugs) console.log(`  ${have.has(s) ? "delete" : "absent"}  ${s}`)

  if (!apply) process.exit(0)

  let author = await prisma.author.findFirst({ where: { name: AUTHOR.name } })
  if (!author) author = await prisma.author.create({ data: AUTHOR })

  const categoryIds = new Map()
  for (const name of new Set(posts.map((p) => p.category))) {
    let cat = await prisma.category.findFirst({ where: { name } })
    if (!cat) cat = await prisma.category.create({ data: { name } })
    categoryIds.set(name, cat.id)
  }

  for (const p of posts) {
    const data = {
      title: p.title,
      description: p.description,
      content: p.content,
      coverImage: p.coverImage,
      publishedAt: p.publishedAt,
      authorId: author.id,
      categoryId: categoryIds.get(p.category),
      tags: p.tags,
      featured: p.featured,
      readingTime: p.readingTime,
    }
    await prisma.blogPost.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: data })
  }
  if (removeSlugs.length) {
    const { count } = await prisma.blogPost.deleteMany({ where: { slug: { in: removeSlugs } } })
    console.log(`  deleted ${count} post(s)`)
  }
  console.log(`  wrote ${posts.length} post(s)`)
} finally {
  await prisma.$disconnect()
}
