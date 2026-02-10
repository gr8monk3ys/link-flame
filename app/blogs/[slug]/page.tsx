import { Metadata } from 'next'
import Image from 'next/image'
import { PageProps } from '@/types/next'
import { getAllPosts, getPost } from '@/lib/blog'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import DOMPurify from 'isomorphic-dompurify'
import { getBaseUrl } from '@/lib/url'

// Render at request time — DB not available during Vercel build
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  try {
    const posts = await getAllPosts()
    return posts.map(post => ({
      slug: post.slug
    }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params
}: PageProps<{ slug: string }>): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {}
  }

  const siteUrl = getBaseUrl()
  const postUrl = `${siteUrl}/blogs/${post.slug}`
  const imageUrl = post.coverImage?.startsWith('http')
    ? post.coverImage
    : `${siteUrl}${post.coverImage || '/images/blogs/default-hero.jpg'}`

  return {
    title: post.title,
    description: post.description || post.title,
    keywords: post.tags,
    authors: [{ name: post.author.name }],
    creator: post.author.name,
    publisher: 'Link Flame',
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      type: 'article',
      url: postUrl,
      title: post.title,
      description: post.description || post.title,
      siteName: 'Link Flame',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: post.publishedAt instanceof Date ? post.publishedAt.toISOString() : post.publishedAt,
      modifiedTime: post.updatedAt instanceof Date ? post.updatedAt.toISOString() : post.updatedAt,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description || post.title,
      images: [imageUrl],
      creator: '@linkflame',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function BlogPost({ params }: PageProps<{ slug: string }>) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const publishedAt = typeof post.publishedAt === 'string'
    ? post.publishedAt
    : post.publishedAt.toISOString()

  const updatedAt = post.updatedAt
    ? typeof post.updatedAt === 'string'
      ? post.updatedAt
      : post.updatedAt.toISOString()
    : publishedAt

  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(post.content || '', {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
  })

  // Build JSON-LD structured data
  const siteUrl = getBaseUrl()
  const postUrl = `${siteUrl}/blogs/${post.slug}`
  const imageUrl = post.coverImage?.startsWith('http')
    ? post.coverImage
    : `${siteUrl}${post.coverImage || '/images/blogs/default-hero.jpg'}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: imageUrl,
    datePublished: publishedAt,
    dateModified: updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      image: post.author.image,
      jobTitle: post.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Link Flame',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    keywords: post.tags.join(', '),
    articleSection: post.category,
    wordCount: post.content?.split(/\s+/).length || 0,
    timeRequired: post.readingTime,
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/blogs`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.category,
        item: `${siteUrl}/blogs/categories/${post.category?.toLowerCase()}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: post.title,
        item: postUrl,
      },
    ],
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Article Content */}
      <article className="prose lg:prose-xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1>{post.title}</h1>
          <div className="not-prose flex items-center gap-4 text-gray-500">
            <div className="flex items-center gap-2">
              {post.author.image && (
                <Image
                  src={post.author.image}
                  alt={post.author.name}
                  width={40}
                  height={40}
                  className="size-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-gray-900">{post.author.name}</p>
                <p className="text-sm">{post.author.role}</p>
              </div>
            </div>
            <span>·</span>
            <time dateTime={publishedAt}>
              {format(typeof post.publishedAt === 'string' ? parseISO(post.publishedAt) : post.publishedAt, 'MMMM d, yyyy')}
            </time>
            {post.readingTime && (
              <>
                <span>·</span>
                <span>{post.readingTime}</span>
              </>
            )}
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
            </div>
          )}

          {/* Category and Tags */}
          <div className="not-prose mt-4 flex flex-wrap gap-2">
            {post.category && (
              <a
                href={`/blogs/categories/${post.category.toLowerCase()}`}
                className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20"
              >
                {post.category}
              </a>
            )}
            {post.tags.map((tag) => (
              <a
                key={tag}
                href={`/blogs/tags/${tag.toLowerCase()}`}
                className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
              >
                #{tag}
              </a>
            ))}
          </div>
        </header>

        {/* Article Content */}
        <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />

        {/* Article Footer */}
        <footer className="not-prose mt-12 border-t pt-8">
          <p className="text-sm text-gray-500">
            Last updated: {format(typeof updatedAt === 'string' ? parseISO(updatedAt) : new Date(updatedAt), 'MMMM d, yyyy')}
          </p>
        </footer>
      </article>
    </>
  )
}
