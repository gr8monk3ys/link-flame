import { prisma } from "@/lib/prisma";
import type { CartItem } from "@/types/cart";

export async function getCartItems(userId: string): Promise<CartItem[]> {
  const cartItems = await prisma.cartItem.findMany({
    where: {
      userId,
    },
    include: {
      product: true,
    },
  });

  return cartItems.map((item) => ({
    id: item.productId,
    title: item.product.title,
    price: Number(item.product.price),
    image: item.product.image,
    quantity: item.quantity,
  }));
}

export async function addToCart(userId: string, productId: string, quantity: number = 1): Promise<void> {
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      userId,
      productId,
    },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: {
        id: existingItem.id,
      },
      data: {
        quantity: existingItem.quantity + quantity,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity,
      },
    });
  }
}

export async function updateCartItemQuantity(userId: string, productId: string, quantity: number): Promise<void> {
  await prisma.cartItem.updateMany({
    where: {
      userId,
      productId,
    },
    data: {
      quantity,
    },
  });
}

export async function removeFromCart(userId: string, productId: string): Promise<void> {
  await prisma.cartItem.deleteMany({
    where: {
      userId,
      productId,
    },
  });
}

export async function clearCart(userId: string): Promise<void> {
  await prisma.cartItem.deleteMany({
    where: {
      userId,
    },
  });
}
