"use client";

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { StarIcon } from '@heroicons/react/20/solid';
import { useState, useEffect, useCallback } from 'react';
import { useCart } from "@/lib/providers/CartProvider";
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { useSession } from "next-auth/react";
import { ProductReviews } from '@/components/products/product-reviews';
import { VariantSelector, ProductVariant } from '@/components/products/variant-selector';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  salePrice?: number | null;
  image: string;
  inventory: number;
  hasVariants: boolean;
  variants: ProductVariant[];
  reviews: { rating: number }[];
}

// Stock status thresholds
const LOW_STOCK_THRESHOLD = 5;
const VERY_LOW_STOCK_THRESHOLD = 2;

function getStockStatus(inventory: number): { label: string; color: string; isAvailable: boolean } {
  if (inventory <= 0) {
    return { label: 'Out of Stock', color: 'text-red-600 bg-red-50', isAvailable: false };
  }
  if (inventory <= VERY_LOW_STOCK_THRESHOLD) {
    return { label: `Only ${inventory} left!`, color: 'text-orange-600 bg-orange-50', isAvailable: true };
  }
  if (inventory <= LOW_STOCK_THRESHOLD) {
    return { label: `Low Stock - ${inventory} left`, color: 'text-amber-600 bg-amber-50', isAvailable: true };
  }
  return { label: 'In Stock', color: 'text-green-600 bg-green-50', isAvailable: true };
}

interface ProductData {
  product: Product | null;
  averageRating: number | null;
}

export default function ProductPage() {
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const { id } = useParams();

  useEffect(() => {
    const getProductData = async (id: string | string[] | undefined) => {
      if (!id || Array.isArray(id)) {
        setProductData({ product: null, averageRating: null });
        return;
      }

      try {
        const res = await fetch(`/api/products/${id}`);

        if (!res.ok) {
          notFound();
        }

        const product = await res.json() as Product;
        const averageRating = product.reviews.length
          ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
          : null;
        setProductData({ product, averageRating });

        // Set default variant if product has variants
        if (product.hasVariants && product.variants.length > 0) {
          const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
          setSelectedVariant(defaultVariant);
        }
      } catch (error) {
        console.error("Failed to get product data", error);
        setProductData({ product: null, averageRating: null });
      }
    };

    getProductData(id);
  }, [id]);

  const handleVariantChange = useCallback((variant: ProductVariant) => {
    setSelectedVariant(variant);
  }, []);

  if (!productData) {
    return <div>Loading...</div>;
  }

  const { product, averageRating } = productData;

  // Compute display values based on selected variant
  const displayPrice = selectedVariant?.price ?? selectedVariant?.salePrice ?? product?.salePrice ?? product?.price ?? 0;
  const displayImage = selectedVariant?.image ?? product?.image ?? '';
  const displayInventory = selectedVariant?.inventory ?? product?.inventory ?? 0;

  return (
    <div className="bg-white">
      {product ? (
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
            {/* Image gallery */}
            <div className="flex flex-col-reverse">
              <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
                <div className="grid grid-cols-4 gap-6">
                  {[displayImage].map((image) => (
                    <div
                      key={image}
                      className="relative flex h-24 cursor-pointer items-center justify-center rounded-md bg-white text-sm font-medium uppercase hover:bg-gray-50"
                    >
                      <span className="absolute inset-0 overflow-hidden rounded-md">
                        <Image
                          src={image}
                          alt=""
                          width={200}
                          height={200}
                          className="size-full object-cover object-center"
                          sizes="96px"
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="aspect-[3/2] overflow-hidden rounded-lg">
                <Image
                  src={displayImage}
                  alt={product.title}
                  className="size-full object-cover object-center"
                  width={400}
                  height={400}
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Product info */}
            <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.title}</h1>

              <div className="mt-3">
                <h2 className="sr-only">Product information</h2>
                <p className="text-3xl tracking-tight text-gray-900">
                  ${Number(displayPrice).toFixed(2)}
                </p>
                {/* Show original price if on sale */}
                {selectedVariant?.salePrice && selectedVariant.price && selectedVariant.price > selectedVariant.salePrice && (
                  <p className="text-lg text-gray-500 line-through">
                    ${Number(selectedVariant.price).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Stock Status */}
              {(() => {
                const stockStatus = getStockStatus(displayInventory);
                return (
                  <div className="mt-3">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${stockStatus.color}`}>
                      {stockStatus.isAvailable ? (
                        <svg className="mr-1.5 h-2 w-2 text-current" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx={4} cy={4} r={3} />
                        </svg>
                      ) : (
                        <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {stockStatus.label}
                    </span>
                  </div>
                );
              })()}

              {/* Reviews */}
              {averageRating && (
                <div className="mt-3">
                  <h3 className="sr-only">Reviews</h3>
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[0, 1, 2, 3, 4].map((rating) => (
                        <div key={rating} className="shrink-0">
                          <StarIcon className="size-5" aria-hidden="true" />
                        </div>
                      ))}
                    </div>
                    <p className="sr-only">{averageRating} out of 5 stars</p>
                    <div className="ml-3 text-sm font-medium text-green-600 hover:text-green-500">
                      {product.reviews.length} reviews
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h3 className="sr-only">Description</h3>
                <p className="text-base text-gray-900">{product.description}</p>
              </div>

              {/* Variant Selector */}
              {product.hasVariants && product.variants.length > 0 && (
                <div className="mt-8 border-t pt-6">
                  <VariantSelector
                    variants={product.variants}
                    selectedVariant={selectedVariant}
                    onVariantChange={handleVariantChange}
                    basePrice={product.price}
                    baseImage={product.image}
                  />
                </div>
              )}

              <div className="mt-6">
                <div className="mt-10 flex">
                  <AddToCartButton
                    product={product}
                    inventory={displayInventory}
                    selectedVariant={selectedVariant}
                    displayPrice={displayPrice}
                    displayImage={displayImage}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-16 border-t pt-16">
            <ProductReviews productId={product.id} />
          </div>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

interface AddToCartButtonProps {
  product: Product;
  inventory: number;
  selectedVariant: ProductVariant | null;
  displayPrice: number;
  displayImage: string;
}

function AddToCartButton({
  product,
  inventory,
  selectedVariant,
  displayPrice,
  displayImage,
}: AddToCartButtonProps) {
  const { addItemToCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  const isOutOfStock = inventory <= 0;
  const needsVariant = product.hasVariants && !selectedVariant;

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }

    if (needsVariant) {
      toast.error("Please select a size/color option");
      return;
    }

    if (!session) {
      toast.error("Please sign in to add items to cart");
      return;
    }

    setIsLoading(true);
    try {
      // Build variant description for display
      let variantDescription = '';
      if (selectedVariant) {
        const parts = [
          selectedVariant.size,
          selectedVariant.color,
          selectedVariant.material,
        ].filter(Boolean);
        if (parts.length > 0) {
          variantDescription = ` (${parts.join(', ')})`;
        }
      }

      await addItemToCart({
        id: product.id,
        title: product.title + variantDescription,
        price: displayPrice,
        image: displayImage,
        quantity: 1,
        variantId: selectedVariant?.id || null,
        variant: selectedVariant ? {
          id: selectedVariant.id,
          sku: selectedVariant.sku,
          size: selectedVariant.size,
          color: selectedVariant.color,
          colorCode: selectedVariant.colorCode,
          material: selectedVariant.material,
        } : null,
      });
      toast.success("Product added to cart!");
    } catch (error) {
      console.error("Error adding product to cart:", error);
      toast.error("Failed to add product to cart.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isOutOfStock) {
    return (
      <button
        type="button"
        disabled
        className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-gray-300 px-8 py-3 text-base font-medium text-gray-500 cursor-not-allowed sm:w-full"
      >
        Out of Stock
      </button>
    );
  }

  if (needsVariant) {
    return (
      <button
        type="button"
        disabled
        className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-gray-300 px-8 py-3 text-base font-medium text-gray-500 cursor-not-allowed sm:w-full"
      >
        Select Options
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={isLoading}
      className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-green-600 px-8 py-3 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-50 sm:w-full"
    >
      {isLoading ? <span>Adding...</span> : <span>Add to cart</span>}
    </button>
  );
}
