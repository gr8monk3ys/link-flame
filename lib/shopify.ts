import Client from "shopify-buy";
import type { Product, ProductVariant } from "shopify-buy";
import { ShopifyLineItem, ShopifyCheckout, ShopifyProduct, ShopifyVariant } from "@/types/shopify";

if (!process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN");
}

if (!process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
  throw new Error("Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN");
}

export const shopifyClient = Client.buildClient({
  domain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  storefrontAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  apiVersion: '2024-01',
});

export async function createCheckout(lineItems: ShopifyLineItem[]): Promise<string> {
  try {
    const checkout = await shopifyClient.checkout.create();
    await shopifyClient.checkout.addLineItems(checkout.id, lineItems);
    return checkout.webUrl;
  } catch (error) {
    console.error("[SHOPIFY_ERROR]", error);
    throw new Error("Failed to create checkout");
  }
}

export async function getProductVariant(productId: string): Promise<string> {
  try {
    const product = await shopifyClient.product.fetch(productId);
    const variant = product.variants[0] as ProductVariant;
    
    if (!variant) {
      throw new Error(`No variant found for product ${productId}`);
    }

    return variant.id;
  } catch (error) {
    console.error("[SHOPIFY_ERROR]", error);
    throw new Error("Failed to fetch product variant");
  }
}

export async function getProduct(productId: string): Promise<ShopifyProduct> {
  try {
    const product = await shopifyClient.product.fetch(productId);
    return {
      id: product.id,
      title: product.title,
      variants: product.variants.map((variant: ProductVariant) => ({
        id: variant.id,
        price: {
          amount: variant.price.amount,
          currencyCode: variant.price.currencyCode,
        },
        availableForSale: variant.availableForSale,
      })),
    };
  } catch (error) {
    console.error("[SHOPIFY_ERROR]", error);
    throw new Error("Failed to fetch product");
  }
}
