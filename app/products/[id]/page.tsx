"use client";

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { StarIcon } from '@heroicons/react/20/solid';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useCart } from "@/hooks/useCart";
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { useAuth } from "@clerk/nextjs";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image: string;
  reviews: { rating: number }[];
}

interface ProductData {
  product: Product | null;
  averageRating: number | null;
}

export default function ProductPage() {
  const [productData, setProductData] = useState<ProductData | null>(null);
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
      } catch (error) {
        console.error("Failed to get product data", error);
        setProductData({ product: null, averageRating: null });
      }
    };

    getProductData(id);
  }, [id]);

  if (!productData) {
    return <div>Loading...</div>;
  }

  const { product, averageRating } = productData;

  return (
    <div className="bg-white">
      {product ? (
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
            {/* Image gallery */}
            <div className="flex flex-col-reverse">
              <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
                <div className="grid grid-cols-4 gap-6">
                  {[product.image].map((image) => (
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
                          unoptimized
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="aspect-[3/2] overflow-hidden rounded-lg">
                <Image
                  src={product.image}
                  alt={product.title}
                  className="size-full object-cover object-center"
                  width={400}
                  height={400}
                />
              </div>
            </div>

            {/* Product info */}
            <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.title}</h1>

              <div className="mt-3">
                <h2 className="sr-only">Product information</h2>
                <p className="text-3xl tracking-tight text-gray-900">
                  ${Number(product.price).toFixed(2)}
                </p>
              </div>

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

              <div className="mt-6">
                <div className="mt-10 flex">
                  <AddToCartButton productId={id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

function AddToCartButton({ productId }: { productId: string | string[] | undefined }) {
  const { addToCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = useAuth();

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      if (typeof productId === 'string' && userId) {
        await addToCart(userId, productId);
        toast.success("Product added to cart!");
      } else {
        toast.error("Invalid product ID or user not logged in");
      }
    } catch (error) {
      console.error("Error adding product to cart:", error);
      toast.error("Failed to add product to cart.");
    } finally {
      setIsLoading(false);
    }
  };

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
