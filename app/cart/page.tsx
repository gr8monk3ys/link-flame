import type { Metadata } from 'next';
import CartPageClient from './CartPageClient';

export const metadata: Metadata = {
  title: 'Cart | Link Flame',
  description: 'Review your cart, adjust quantities, and proceed to checkout.',
};

export default function CartPage() {
  return <CartPageClient />;
}
