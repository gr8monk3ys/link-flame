'use client'

import React from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/providers/CartProvider'
import { cn } from '@/lib/utils'

interface CartLinkProps {
  className?: string
}

export function CartLink({ className }: CartLinkProps) {
  const { cart, cartTotal, hasInitializedCart } = useCart()
  const itemCount = cart?.items?.length || 0

  return (
    <Link
      href="/cart"
      className={cn(
        'relative flex items-center justify-center rounded-md p-2 text-foreground transition-colors hover:bg-accent',
        className
      )}
      aria-label="Cart"
    >
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
        className="size-5"
      >
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
      {hasInitializedCart && itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  )
}
