'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const CATEGORIES = [
  'Kitchen',
  'Bathroom',
  'Personal Care',
  'Home',
  'Fashion',
  'Food & Drink',
  'Outdoor',
  'Office',
  'Uncategorized',
]

interface ProductData {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  price: number
  salePrice: number | null
  image: string
  category: string
  inventory: number
  isImperfect: boolean
  imperfectDiscount: number | null
  isSubscribable: boolean
}

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch('/api/csrf')
  if (!res.ok) {
    throw new Error('Failed to fetch CSRF token')
  }
  const data = await res.json()
  return data.token
}

export default function AdminProductEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [image, setImage] = useState('')
  const [category, setCategory] = useState('Uncategorized')
  const [inventory, setInventory] = useState('0')
  const [isImperfect, setIsImperfect] = useState(false)
  const [imperfectDiscount, setImperfectDiscount] = useState('')
  const [isSubscribable, setIsSubscribable] = useState(false)

  useEffect(() => {
    async function fetchProduct(): Promise<void> {
      try {
        const res = await fetch(`/api/products/${id}`)
        if (!res.ok) {
          setFetchError('Product not found')
          return
        }

        const json = await res.json()
        const product: ProductData = json.data || json

        setTitle(product.title || '')
        setSubtitle(product.subtitle || '')
        setDescription(product.description || '')
        setPrice(String(product.price || ''))
        setSalePrice(product.salePrice ? String(product.salePrice) : '')
        setImage(product.image || '')
        setCategory(product.category || 'Uncategorized')
        setInventory(String(product.inventory ?? 0))
        setIsImperfect(product.isImperfect || false)
        setImperfectDiscount(product.imperfectDiscount ? String(product.imperfectDiscount) : '')
        setIsSubscribable(product.isSubscribable || false)
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProduct()
    }
  }, [id])

  function validate(): string | null {
    if (!title.trim()) {
      return 'Title is required'
    }
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      return 'Price must be a positive number'
    }
    if (salePrice.trim()) {
      const salePriceNum = parseFloat(salePrice)
      if (isNaN(salePriceNum) || salePriceNum <= 0) {
        return 'Sale price must be a positive number'
      }
      if (salePriceNum >= priceNum) {
        return 'Sale price must be less than regular price'
      }
    }
    if (!image.trim()) {
      return 'Image URL is required'
    }
    try {
      new URL(image)
    } catch {
      return 'Image must be a valid URL'
    }
    const inventoryNum = parseInt(inventory, 10)
    if (isNaN(inventoryNum) || inventoryNum < 0) {
      return 'Inventory must be a non-negative whole number'
    }
    if (isImperfect && imperfectDiscount.trim()) {
      const discountNum = parseInt(imperfectDiscount, 10)
      if (isNaN(discountNum) || discountNum < 1 || discountNum > 90) {
        return 'Imperfect discount must be between 1 and 90 percent'
      }
    }
    return null
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      const csrfToken = await fetchCsrfToken()

      const body: Record<string, unknown> = {
        title: title.trim(),
        price: parseFloat(price),
        image: image.trim(),
        category,
        inventory: parseInt(inventory, 10),
        subtitle: subtitle.trim() || null,
        description: description.trim() || null,
        salePrice: salePrice.trim() ? parseFloat(salePrice) : null,
        isImperfect,
        isSubscribable,
        imperfectDiscount: isImperfect && imperfectDiscount.trim()
          ? parseInt(imperfectDiscount, 10)
          : null,
      }

      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        const message = data.error?.message || 'Failed to update product'
        setError(message)
        return
      }

      router.push('/admin/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="size-5 animate-spin" />
          Loading product...
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/products"
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="size-4" />
          Back to Products
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {fetchError}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="size-4" />
          Back to Products
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="mt-2 text-gray-600">
          Update product details
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="e.g., Bamboo Toothbrush Set"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700">
              Subtitle
            </label>
            <input
              id="subtitle"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              maxLength={200}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="e.g., Pack of 4 - Soft Bristles"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Describe the product..."
            />
          </div>

          {/* Price and Sale Price */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0.01"
                step="0.01"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700">
                Sale Price ($)
              </label>
              <input
                id="salePrice"
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                min="0.01"
                step="0.01"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Image URL <span className="text-red-500">*</span>
            </label>
            <input
              id="image"
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Category and Inventory */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="inventory" className="block text-sm font-medium text-gray-700">
                Inventory
              </label>
              <input
                id="inventory"
                type="number"
                value={inventory}
                onChange={(e) => setInventory(e.target.value)}
                min="0"
                step="1"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Imperfect / Subscribable toggles */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  id="isImperfect"
                  type="checkbox"
                  checked={isImperfect}
                  onChange={(e) => setIsImperfect(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="isImperfect" className="text-sm font-medium text-gray-700">
                  Imperfect / Seconds Item
                </label>
              </div>

              {isImperfect && (
                <div>
                  <label
                    htmlFor="imperfectDiscount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Imperfect Discount (%)
                  </label>
                  <input
                    id="imperfectDiscount"
                    type="number"
                    value={imperfectDiscount}
                    onChange={(e) => setImperfectDiscount(e.target.value)}
                    min="1"
                    max="90"
                    step="1"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="e.g., 20"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                id="isSubscribable"
                type="checkbox"
                checked={isSubscribable}
                onChange={(e) => setIsSubscribable(e.target.checked)}
                className="size-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="isSubscribable" className="text-sm font-medium text-gray-700">
                Subscribe & Save Eligible
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-6">
            <Link
              href="/admin/products"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
