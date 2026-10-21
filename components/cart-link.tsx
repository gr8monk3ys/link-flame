'use client'

import React from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/providers/CartProvider'
import { cn } from '@/lib/utils'

interface CartLinkProps {
  className?: string
}

// A round hairline pill in the header cluster; the item count is a small Moss
// disc at its corner (the one filled chip the header carries).
export function CartLink({ className }: CartLinkProps) {
  const { cart, hasInitializedCart } = useCart()
  const itemCount = cart?.items?.length || 0

  return (
    <Link
      href="/cart"
      className={cn('cta-secondary relative size-8 rounded-full sm:size-9', className)}
      aria-label={hasInitializedCart && itemCount > 0 ? `Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : 'Cart'}
    >
      <svg aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
      >
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
      {hasInitializedCart && itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary font-mono text-xs font-semibold tabular-nums text-primary-foreground">
          {itemCount}
        </span>
      )}
    </Link>
  )
}
