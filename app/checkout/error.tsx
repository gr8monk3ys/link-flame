'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function CheckoutError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <h2 className="mb-2 text-xl font-semibold">Checkout could not be loaded</h2>
      <p className="mb-6 text-muted-foreground">We had trouble loading checkout. Your cart items are safe.</p>
      <div className="flex gap-3">
        <button onClick={() => reset()} className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">Try again</button>
        <Link href="/cart" className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300">Back to cart</Link>
      </div>
    </div>
  )
}
