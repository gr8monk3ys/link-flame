import { create } from "zustand";
import { persist, type StateStorage } from "zustand/middleware";
import type { Cart, CartItem } from "@/types/cart";

interface CartState extends Cart {
  items: CartItem[];
}

interface CartActions {
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  checkout: () => Promise<void>;
}

type CartStore = CartState & CartActions;

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addToCart: async (productId: string, quantity: number = 1) => {
        try {
          const response = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity }),
          });

          if (!response.ok) throw new Error("Failed to add item to cart");

          // Fetch product details
          const productResponse = await fetch(`/api/products/${productId}`);
          if (!productResponse.ok) throw new Error("Failed to fetch product");
          
          const product = await productResponse.json();
          const currentItems = get().items;
          const existingItem = currentItems.find((item: CartItem) => item.id === productId);

          if (existingItem) {
            set({
              items: currentItems.map((item: CartItem) =>
                item.id === productId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            });
          } else {
            set({
              items: [...currentItems, {
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
                quantity,
              }],
            });
          }
        } catch (error) {
          console.error("[ADD_TO_CART_ERROR]", error);
          throw error;
        }
      },
      updateQuantity: async (productId: string, quantity: number) => {
        try {
          const response = await fetch("/api/cart", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity }),
          });

          if (!response.ok) throw new Error("Failed to update cart");

          const currentItems = get().items;
          set({
            items: currentItems.map((item: CartItem) =>
              item.id === productId ? { ...item, quantity } : item
            ),
          });
        } catch (error) {
          console.error("[UPDATE_CART_ERROR]", error);
          throw error;
        }
      },
      removeItem: async (productId: string) => {
        try {
          const response = await fetch(`/api/cart?productId=${productId}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error("Failed to remove item");

          const currentItems = get().items;
          set({
            items: currentItems.filter((item: CartItem) => item.id !== productId),
          });
        } catch (error) {
          console.error("[REMOVE_ITEM_ERROR]", error);
          throw error;
        }
      },
      checkout: async () => {
        // This will be handled by Shopify checkout
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
