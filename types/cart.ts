export interface CartItemVariant {
  id: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  colorCode: string | null;
  material: string | null;
}

export interface CartItem {
  id: string;            // productId
  cartItemId?: string;   // unique cart item ID for deletion
  title: string;
  price: number;
  quantity: number;
  image: string;
  variantId?: string | null;
  variant?: CartItemVariant | null;
}

export interface Cart {
  items: CartItem[];
  addToCart: (userId: string, productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  checkout: () => Promise<void>;
}
