export interface ShopifyLineItem {
  variantId: string;
  quantity: number;
}

export interface ShopifyCheckout {
  id: string;
  webUrl: string;
  lineItems: ShopifyLineItem[];
}

export interface MoneyV2 {
  amount: number;  // Changed from string to number to match Shopify's API
  currencyCode: string;
}

export interface ShopifyVariant {
  id: string;
  price: MoneyV2;
  availableForSale: boolean;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  variants: ShopifyVariant[];
}
