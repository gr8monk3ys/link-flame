import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CartItem } from "@/types/cart";

export function useCart() {
  const { userId } = useAuth();
  const router = useRouter();

  async function addToCart(productId: string, quantity: number = 1) {
    try {
      if (!userId) {
        router.push("/sign-in");
        return;
      }

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        throw new Error("Failed to add item to cart");
      }

      toast.success("Item added to cart");
      router.refresh();
    } catch (error) {
      toast.error("Error adding item to cart");
      console.error("[ADD_TO_CART_ERROR]", error);
    }
  }

  async function updateQuantity(productId: string, quantity: number) {
    try {
      if (!userId) return;

      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        throw new Error("Failed to update cart");
      }

      router.refresh();
    } catch (error) {
      toast.error("Error updating cart");
      console.error("[UPDATE_CART_ERROR]", error);
    }
  }

  async function removeItem(productId: string) {
    try {
      if (!userId) return;

      const response = await fetch(`/api/cart/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      toast.success("Item removed from cart");
      router.refresh();
    } catch (error) {
      toast.error("Error removing item");
      console.error("[REMOVE_FROM_CART_ERROR]", error);
    }
  }

  async function checkout() {
    try {
      if (!userId) {
        router.push("/sign-in");
        return;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error("Error proceeding to checkout");
      console.error("[CHECKOUT_ERROR]", error);
    }
  }

  return {
    addToCart,
    updateQuantity,
    removeItem,
    checkout,
  };
}
