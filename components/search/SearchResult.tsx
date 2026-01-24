'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn, formatPrice } from '@/lib/utils'
import {
  ProductSuggestion,
  CategorySuggestion,
  BlogPostSuggestion,
} from '@/lib/types/search'

interface ProductResultProps {
  product: ProductSuggestion
  isHighlighted?: boolean
  onSelect?: () => void
}

export function ProductResult({
  product,
  isHighlighted = false,
  onSelect,
}: ProductResultProps) {
  const hasDiscount = product.salePrice && product.salePrice < product.price

  return (
    <Link
      href={`/products/${product.slug}`}
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
        'hover:bg-accent focus:bg-accent focus:outline-none',
        isHighlighted && 'bg-accent'
      )}
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
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
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.title}</p>
        <p className="text-xs text-muted-foreground">{product.category}</p>
      </div>
      <div className="shrink-0 text-right">
        {hasDiscount ? (
          <>
            <p className="text-sm font-semibold text-primary">
              {formatPrice(product.salePrice!)}
            </p>
            <p className="text-xs text-muted-foreground line-through">
              {formatPrice(product.price)}
            </p>
          </>
        ) : (
          <p className="text-sm font-semibold">{formatPrice(product.price)}</p>
        )}
      </div>
    </Link>
  )
}

interface CategoryResultProps {
  category: CategorySuggestion
  isHighlighted?: boolean
  onSelect?: () => void
}

export function CategoryResult({
  category,
  isHighlighted = false,
  onSelect,
}: CategoryResultProps) {
  return (
    <Link
      href={`/collections?category=${encodeURIComponent(category.name)}`}
      onClick={onSelect}
      className={cn(
        'flex items-center justify-between rounded-md px-3 py-2 transition-colors',
        'hover:bg-accent focus:bg-accent focus:outline-none',
        isHighlighted && 'bg-accent'
      )}
    >
      <div className="flex items-center gap-2">
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
        <span className="text-sm font-medium">{category.name}</span>
      </div>
      <span className="text-xs text-muted-foreground">
        {category.count} {category.count === 1 ? 'product' : 'products'}
      </span>
    </Link>
  )
}

interface BlogPostResultProps {
  post: BlogPostSuggestion
  isHighlighted?: boolean
  onSelect?: () => void
}

export function BlogPostResult({
  post,
  isHighlighted = false,
  onSelect,
}: BlogPostResultProps) {
  return (
    <Link
      href={`/blogs/${post.slug}`}
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
        'hover:bg-accent focus:bg-accent focus:outline-none',
        isHighlighted && 'bg-accent'
      )}
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
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
        <p className="truncate text-sm font-medium">{post.title}</p>
        {post.category && (
          <p className="text-xs text-muted-foreground">{post.category}</p>
        )}
      </div>
      <div className="shrink-0">
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
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </Link>
  )
}

interface RecentSearchResultProps {
  query: string
  isHighlighted?: boolean
  onSelect?: () => void
  onRemove?: () => void
}

export function RecentSearchResult({
  query,
  isHighlighted = false,
  onSelect,
  onRemove,
}: RecentSearchResultProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onRemove?.()
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors',
        'hover:bg-accent focus:bg-accent focus:outline-none',
        isHighlighted && 'bg-accent'
      )}
    >
      <div className="flex items-center gap-2">
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
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="text-sm">{query}</span>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          aria-label={`Remove "${query}" from recent searches`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </button>
  )
}
