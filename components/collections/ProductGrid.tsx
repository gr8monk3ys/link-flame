'use client';

import Image from 'next/image';
import { useCart } from "@/hooks/useCart";

interface Product {
  id: string;
  title: string;
  price: { toString: () => string } | number;
  salePrice?: { toString: () => string } | number;
  image: string;
  category: string;
  description?: string;
  reviews: { rating: number }[];
  createdAt: Date;
}

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export default function ProductGrid({ 
  products, 
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange
}: ProductGridProps) {
  const { addToCart } = useCart();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square w-full rounded-lg bg-gray-200" />
            <div className="mt-4 space-y-3">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters
          </p>
        </div>
      </div>
    );
  }

  const getAverageRating = (reviews: { rating: number }[]) => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const isNewProduct = (date: Date) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(date) > thirtyDaysAgo;
  };

  const formatPrice = (price: { toString: () => string } | number) => {
    if (typeof price === 'number') {
      return price.toFixed(2);
    }
    // Handle Prisma Decimal
    return Number(price.toString()).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="group relative">
            {/* Quick view button */}
            <button
              className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
              onClick={() => window.location.href = `/products/${product.id}`}
            >
              <svg className="size-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>

            {/* Add to cart button */}
            <button
              className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white opacity-0 shadow-md transition-opacity hover:bg-green-500 group-hover:opacity-100"
              onClick={() => addToCart(product.id)}
            >
              Add to Cart
            </button>

            {/* New badge */}
            {isNewProduct(product.createdAt) && (
              <div className="absolute left-4 top-4 z-10">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  New
                </span>
              </div>
            )}

            {/* Wishlist button */}
            <button
              className="absolute right-4 top-16 z-10 rounded-full bg-white p-2 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
              onClick={() => {/* TODO: Implement wishlist */}}
            >
              <svg className="size-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={product.image}
                alt={product.title}
                width={400}
                height={400}
                className="size-full object-cover object-center transition-opacity group-hover:opacity-75"
                priority={currentPage === 1}
                unoptimized
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <h3 className="text-sm text-gray-700">
                  <a href={`/products/${product.id}`}>
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.title}
                  </a>
                </h3>
                <div className="text-sm font-medium">
                  {product.salePrice ? (
                    <div className="flex flex-col items-end">
                      <span className="text-red-600">${formatPrice(product.salePrice)}</span>
                      <span className="text-gray-500 line-through">${formatPrice(product.price)}</span>
                    </div>
                  ) : (
                    <span className="text-gray-900">${formatPrice(product.price)}</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500">{product.category}</p>
              {product.description && (
                <p className="line-clamp-2 text-sm text-gray-600">{product.description}</p>
              )}
              <div className="flex items-center space-x-2">
                {getAverageRating(product.reviews) && (
                  <>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {getAverageRating(product.reviews)}
                      </span>
                      <span className="ml-1 text-yellow-400">★</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({product.reviews.length} reviews)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm"
            >
              {[12, 24, 36, 48].map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md p-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">First</span>
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center p-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Previous</span>
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage - 2 + i;
                if (page > 0 && page <= totalPages) {
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`relative inline-flex items-center p-2 text-sm font-semibold ${
                        page === currentPage
                          ? 'z-10 bg-green-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                return null;
              })}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center p-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Next</span>
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md p-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Last</span>
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
