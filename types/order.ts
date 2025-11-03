/**
 * Order and OrderItem type definitions
 * Consolidates types previously defined inline in multiple pages
 */

export interface OrderItem {
  id: string;
  orderId?: string;
  productId?: string;
  quantity: number;
  price: number;
  title: string;
  product: {
    id: string;
    title: string;
    image: string;
    description: string | null;
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Order {
  id: string;
  userId?: string;
  amount: number;
  status: string;
  stripeSessionId: string | null;
  shippingAddress: string | null;
  paymentMethod: string | null;
  customerEmail: string | null;
  customerName: string | null;
  items: OrderItem[];
  createdAt: Date | string;
  updatedAt?: Date | string;
}

/**
 * API response type for orders list
 */
export interface OrdersListResponse {
  orders: Order[];
  count: number;
}

/**
 * API response type for single order
 */
export interface OrderDetailResponse {
  order: Order;
}
