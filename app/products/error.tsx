'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ProductsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <h2 className="text-xl font-semibold mb-2">Could not load products</h2>
      <p className="text-muted-foreground mb-6">We had trouble loading the product catalog.</p>
      <div className="flex gap-3">
        <button onClick={() => reset()} className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">Try again</button>
        <Link href="/" className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300">Go home</Link>
      </div>
    </div>
  )
}
