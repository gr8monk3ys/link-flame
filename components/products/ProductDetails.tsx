"use client";

import Image from 'next/image';
import { Star } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useCart } from "@/lib/providers/CartProvider";
import { toast } from 'sonner';
import { useSession } from "next-auth/react";
import { ProductReviews } from '@/components/products/product-reviews';
import { VariantSelector, ProductVariant } from '@/components/products/variant-selector';
import { SubscribeOption } from '@/components/subscriptions';
import { SubscriptionFrequency } from '@/lib/subscriptions';
import { ImperfectBadge, ImperfectReasonTooltip, ImperfectSavingsBadge } from '@/components/imperfect';
import { EcoImpactCard, CertificationBadgesFull, CarbonNeutralBadge, type Certification } from '@/components/sustainability';
import { ValueBadgeList } from '@/components/filters/ValueBadge';

interface ProductValue {
  id: string;
  name: string;
  slug: string;
  iconName?: string | null;
}

export interface ProductDetailsProps {
  product: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    salePrice?: number | null;
    image: string;
    inventory: number;
    hasVariants: boolean;
    isSubscribable?: boolean;
    variants: ProductVariant[];
    reviews: { rating: number }[];
    // Imperfect product fields
    isImperfect?: boolean;
    imperfectReason?: string | null;
    imperfectDiscount?: number | null;
    // Sustainability fields
    isPlasticFree?: boolean;
    isVegan?: boolean;
    isCrueltyFree?: boolean;
    isOrganicCertified?: boolean;
    carbonFootprintGrams?: number | null;
    certifications?: Array<{
      certification: Certification;
    }>;
    // Shop by Values
    values?: ProductValue[];
  };
  averageRating: number | null;
}

// Stock status thresholds
const LOW_STOCK_THRESHOLD = 5;
const VERY_LOW_STOCK_THRESHOLD = 2;

function getStockStatus(inventory: number): { label: string; color: string; isAvailable: boolean } {
  if (inventory <= 0) {
    return { label: 'Out of Stock', color: 'text-red-600 bg-red-50', isAvailable: false };
  }
  if (inventory <= VERY_LOW_STOCK_THRESHOLD) {
    return { label: 'Only ' + inventory + ' left!', color: 'text-orange-600 bg-orange-50', isAvailable: true };
  }
  if (inventory <= LOW_STOCK_THRESHOLD) {
    return { label: 'Low Stock - ' + inventory + ' left', color: 'text-amber-600 bg-amber-50', isAvailable: true };
  }
  return { label: 'In Stock', color: 'text-green-600 bg-green-50', isAvailable: true };
}

export default function ProductDetails({ product, averageRating }: ProductDetailsProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(() => {
    if (product.hasVariants && product.variants.length > 0) {
      return product.variants.find(v => v.isDefault) || product.variants[0];
    }
    return null;
  });
  const [isSubscription, setIsSubscription] = useState(false);
  const [subscriptionFrequency, setSubscriptionFrequency] = useState<SubscriptionFrequency | null>(null);

  const handleVariantChange = useCallback((variant: ProductVariant) => {
    setSelectedVariant(variant);
  }, []);

  const handleSubscriptionChange = useCallback((subscription: boolean, frequency: SubscriptionFrequency | null) => {
    setIsSubscription(subscription);
    setSubscriptionFrequency(frequency);
  }, []);

  // Compute display values based on selected variant
  const displayPrice = selectedVariant?.price ?? selectedVariant?.salePrice ?? product?.salePrice ?? product?.price ?? 0;
  const displayImage = selectedVariant?.image ?? product?.image ?? '';
  const displayInventory = selectedVariant?.inventory ?? product?.inventory ?? 0;

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
              <div className="grid grid-cols-4 gap-6">
                {[displayImage].map((image) => (
                  <div
                    key={image}
                    className="relative flex h-24 cursor-pointer items-center justify-center rounded-md bg-background text-sm font-medium uppercase hover:bg-muted"
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
            {/* Imperfect Badge - Show prominently if product is imperfect */}
            {product.isImperfect && product.imperfectDiscount && (
              <div className="mb-4">
                <ImperfectBadge
                  discountPercent={product.imperfectDiscount}
                  size="lg"
                  variant="prominent"
                />
              </div>
            )}

            <h1 className="font-serif text-3xl font-semibold tracking-normal text-foreground">{product.title}</h1>

            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              {/* Imperfect price display */}
              {product.isImperfect && product.imperfectDiscount ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-bold tracking-tight text-amber-600">
                      {'$' + (displayPrice * (1 - product.imperfectDiscount / 100)).toFixed(2)}
                    </p>
                    <p className="text-xl text-muted-foreground line-through">
                      {'$' + Number(displayPrice).toFixed(2)}
                    </p>
                  </div>
                  <ImperfectSavingsBadge
                    originalPrice={displayPrice}
                    imperfectPrice={displayPrice * (1 - product.imperfectDiscount / 100)}
                    size="md"
                  />
                </div>
              ) : (
                <>
                  <p className="text-3xl tracking-tight text-foreground">
                    {'$' + Number(displayPrice).toFixed(2)}
                  </p>
                  {/* Show original price if on sale */}
                  {selectedVariant?.salePrice && selectedVariant.price && selectedVariant.price > selectedVariant.salePrice && (
                    <p className="text-lg text-muted-foreground line-through">
                      {'$' + Number(selectedVariant.price).toFixed(2)}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Imperfect Reason Tooltip */}
            {product.isImperfect && product.imperfectReason && (
              <div className="mt-4">
                <ImperfectReasonTooltip
                  reason={product.imperfectReason}
                  position="bottom"
                />
              </div>
            )}

            {/* Stock Status */}
            {(() => {
              const stockStatus = getStockStatus(displayInventory);
              return (
                <div className="mt-3">
                  <span className={'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ' + stockStatus.color}>
                    {stockStatus.isAvailable ? (
                      <svg className="mr-1.5 size-2 text-current" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx={4} cy={4} r={3} />
                      </svg>
                    ) : (
                      <svg className="mr-1.5 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <Star className="size-5" fill="currentColor" aria-hidden="true" />
                      </div>
                    ))}
                  </div>
                  <p className="sr-only">{averageRating} out of 5 stars</p>
                  <div className="ml-3 text-sm font-medium text-primary hover:text-primary/80">
                    {product.reviews.length} reviews
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <p className="text-base text-foreground">{product.description}</p>
            </div>

            {/* Sustainability Section */}
            {(product.isPlasticFree || product.isVegan || product.isCrueltyFree || product.isOrganicCertified || product.carbonFootprintGrams) && (
              <div className="mt-6">
                <EcoImpactCard
                  carbonFootprintGrams={product.carbonFootprintGrams}
                  isPlasticFree={product.isPlasticFree}
                  isVegan={product.isVegan}
                  isCrueltyFree={product.isCrueltyFree}
                  isOrganicCertified={product.isOrganicCertified}
                  variant="default"
                />
              </div>
            )}

            {/* Certifications */}
            {product.certifications && product.certifications.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium text-foreground">Certifications</h4>
                <CertificationBadgesFull
                  certifications={product.certifications.map(pc => pc.certification)}
                />
              </div>
            )}

            {/* Shop by Values */}
            {product.values && product.values.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium text-foreground">Values</h4>
                <ValueBadgeList
                  values={product.values}
                  size="md"
                  maxDisplay={12}
                />
              </div>
            )}

            {/* Carbon Neutral Shipping Badge */}
            <div className="mt-4">
              <CarbonNeutralBadge />
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

            {/* Subscribe & Save Option */}
            <SubscribeOption
              originalPrice={displayPrice}
              productTitle={product.title}
              isSubscribable={product.isSubscribable !== false}
              onSubscriptionChange={handleSubscriptionChange}
            />

            <div className="mt-6">
              <div className="mt-10 flex">
                <AddToCartButton
                  product={product}
                  inventory={displayInventory}
                  selectedVariant={selectedVariant}
                  displayPrice={displayPrice}
                  displayImage={displayImage}
                  isSubscription={isSubscription}
                  subscriptionFrequency={subscriptionFrequency}
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
    </div>
  );
}

interface AddToCartButtonProps {
  product: ProductDetailsProps['product'];
  inventory: number;
  selectedVariant: ProductVariant | null;
  displayPrice: number;
  displayImage: string;
  isSubscription?: boolean;
  subscriptionFrequency?: SubscriptionFrequency | null;
}

function AddToCartButton({
  product,
  inventory,
  selectedVariant,
  displayPrice,
  displayImage,
  isSubscription = false,
  subscriptionFrequency = null,
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
          variantDescription = ' (' + parts.join(', ') + ')';
        }
      }

      // Handle subscription purchase
      if (isSubscription && subscriptionFrequency) {
        const response = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frequency: subscriptionFrequency,
            items: [{
              productId: product.id,
              variantId: selectedVariant?.id || null,
              quantity: 1,
            }],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to create subscription');
        }

        toast.success("Subscription created! View it in your account.", {
          action: {
            label: "View",
            onClick: () => window.location.href = "/account/subscriptions",
          },
        });
        return;
      }

      // Regular add to cart
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
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to complete action.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isOutOfStock) {
    return (
      <button
        type="button"
        disabled
        className="flex max-w-xs flex-1 cursor-not-allowed items-center justify-center rounded-lg border border-transparent bg-muted px-8 py-3 text-base font-medium text-muted-foreground sm:w-full"
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
        className="flex max-w-xs flex-1 cursor-not-allowed items-center justify-center rounded-lg border border-transparent bg-muted px-8 py-3 text-base font-medium text-muted-foreground sm:w-full"
      >
        Select Options
      </button>
    );
  }

  const buttonText = isLoading
    ? (isSubscription ? 'Creating subscription...' : 'Adding...')
    : (isSubscription ? 'Subscribe & Save' : 'Add to cart');

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={isLoading}
      className="flex max-w-xs flex-1 items-center justify-center rounded-lg border border-transparent bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:w-full transition-all duration-200 active:scale-[0.98]"
    >
      {buttonText}
    </button>
  );
}
