import { create } from "zustand";
import { persist, type StateStorage } from "zustand/middleware";
import type { Cart, CartItem } from "@/types/cart";
import { useEffect } from "react";

interface CartState extends Cart {
  items: CartItem[];
  isLoading: boolean;
  fetchCartItems: () => Promise<void>;
}

interface CartActions {
  addToCart: (userId: string, productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  checkout: () => Promise<void>;
}

type CartStore = CartState & CartActions;

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      fetchCartItems: async () => {
        try {
          set({ isLoading: true });
          const response = await fetch("/api/cart");
          
          if (response.ok) {
            const items = await response.json();
            set({ items });
          } else {
            console.error("Failed to fetch cart items");
          }
        } catch (error) {
          console.error("[FETCH_CART_ERROR]", error);
        } finally {
          set({ isLoading: false });
        }
      },
      addToCart: async (userId: string, productId: string, quantity: number = 1) => {
        try {
          const response = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, productId, quantity }),
          });

          if (!response.ok) throw new Error("Failed to add item to cart");

          // After successfully adding to the database, fetch the updated cart
          await get().fetchCartItems();
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

          // After successfully updating the database, fetch the updated cart
          await get().fetchCartItems();
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

          // After successfully removing from the database, fetch the updated cart
          await get().fetchCartItems();
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
