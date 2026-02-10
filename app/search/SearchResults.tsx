import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'

interface SearchResultsProps {
  query: string
}

export async function SearchResults({ query }: SearchResultsProps) {
  const searchTerm = query.toLowerCase().trim()

  // Fetch all results in parallel
  const [products, categories, blogPosts] = await Promise.all([
    // Search products
    prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } },
          { category: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        title: true,
        price: true,
        salePrice: true,
        image: true,
        category: true,
      },
      take: 20,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    }),

    // Search categories (distinct categories from products)
    prisma.product.groupBy({
      by: ['category'],
      where: {
        category: { contains: searchTerm },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    }),

    // Search blog posts
    prisma.blogPost.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        publishedAt: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
    }),
  ])

  const hasResults = products.length > 0 || categories.length > 0 || blogPosts.length > 0

  if (!hasResults) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto mb-4 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <h2 className="text-xl font-semibold">No results found</h2>
        <p className="mt-2 text-muted-foreground">
          We could not find anything matching &quot;{query}&quot;. Try different keywords or browse our{' '}
          <Link href="/collections" className="text-primary hover:underline">
            collections
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Products Section */}
      {products.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Products ({products.length})
            </h2>
            <Link
              href={`/collections?search=${encodeURIComponent(query)}`}
              className="text-sm text-primary hover:underline"
            >
              View all products
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const hasDiscount = product.salePrice && product.salePrice < product.price
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group rounded-lg border p-4 transition-shadow hover:shadow-md"
                >
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-md bg-muted">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </div>
                    )}
                    {hasDiscount && (
                      <div className="absolute left-2 top-2 rounded bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground">
                        Sale
                      </div>
                    )}
                  </div>
                  <h3 className="line-clamp-2 font-medium group-hover:text-primary">
                    {product.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {product.category}
                  </p>
                  <div className="mt-2">
                    {hasDiscount ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">
                          {formatPrice(Number(product.salePrice!))}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(Number(product.price))}
                        </span>
                      </div>
                    ) : (
                      <span className="font-semibold">
                        {formatPrice(Number(product.price))}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">
            Categories ({categories.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.category}
                href={`/collections?category=${encodeURIComponent(cat.category)}`}
                className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-2 transition-colors hover:bg-muted"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <path d="M3 6h18" />
                  <path d="M7 12h10" />
                  <path d="M10 18h4" />
                </svg>
                <span className="font-medium">{cat.category}</span>
                <span className="text-sm text-muted-foreground">
                  ({cat._count.id})
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Blog Posts Section */}
      {blogPosts.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Blog Posts ({blogPosts.length})
            </h2>
            <Link
              href={`/blogs?search=${encodeURIComponent(query)}`}
              className="text-sm text-primary hover:underline"
            >
              View all posts
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blogs/${post.slug}`}
                className="group flex gap-4 rounded-lg border p-4 transition-shadow hover:shadow-md"
              >
                <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="96px"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" x2="8" y1="13" y2="13" />
                        <line x1="16" x2="8" y1="17" y2="17" />
                        <line x1="10" x2="8" y1="9" y2="9" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 font-medium group-hover:text-primary">
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {post.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    {post.category?.name && (
                      <>
                        <span>{post.category.name}</span>
                        <span>-</span>
                      </>
                    )}
                    <time dateTime={post.publishedAt.toISOString()}>
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
