'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, Eye, Gift } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: string;
  shippingStatus: string | null;
  trackingNumber: string | null;
  createdAt: string;
  isGift: boolean;
  giftRecipientName: string | null;
  giftMessage: string | null;
  hidePrice: boolean;
  user: {
    name: string;
    email: string;
  } | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shippingFilter, setShippingFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateShippingStatus(orderId: string, status: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingStatus: status }),
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(
          orders.map((o) =>
            o.id === orderId ? { ...o, shippingStatus: status } : o
          )
        );
      } else {
        alert('Failed to update shipping status');
      }
    } catch (error) {
      console.error('Failed to update shipping status:', error);
      alert('Failed to update shipping status');
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toString().includes(search);

    const matchesPaymentStatus =
      statusFilter === 'all' || order.status === statusFilter;

    const matchesShippingStatus =
      shippingFilter === 'all' ||
      (shippingFilter === 'pending' && !order.shippingStatus) ||
      order.shippingStatus === shippingFilter;

    return matchesSearch && matchesPaymentStatus && matchesShippingStatus;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-600">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="mt-2 text-gray-600">Manage customer orders and shipping</p>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name, email, or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={shippingFilter}
              onChange={(e) => setShippingFilter(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Shipping Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Shipping
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Gift
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {order.user?.name || order.customerName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.user?.email || order.customerEmail}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ${order.amount.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${
                        order.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <select
                      value={order.shippingStatus || 'pending'}
                      onChange={(e) =>
                        updateShippingStatus(order.id, e.target.value)
                      }
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-transparent focus:ring-2 focus:ring-green-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    {order.isGift ? (
                      <div className="group relative inline-block">
                        <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-1 text-xs font-medium text-pink-800">
                          <Gift className="size-3" />
                          Gift
                        </span>
                        {/* Tooltip with gift details */}
                        {(order.giftRecipientName || order.giftMessage) && (
                          <div className="absolute left-1/2 z-10 mt-2 hidden w-64 -translate-x-1/2 rounded-lg bg-gray-900 p-3 text-xs text-white shadow-lg group-hover:block">
                            {order.giftRecipientName && (
                              <div className="mb-1">
                                <span className="font-semibold">To: </span>
                                {order.giftRecipientName}
                              </div>
                            )}
                            {order.giftMessage && (
                              <div className="line-clamp-3 italic">
                                &ldquo;{order.giftMessage}&rdquo;
                              </div>
                            )}
                            {order.hidePrice && (
                              <div className="mt-1 text-gray-300">
                                Prices hidden on packing slip
                              </div>
                            )}
                            <div className="absolute -top-2 left-1/2 size-0 -translate-x-1/2 border-x-8 border-b-8 border-transparent border-b-gray-900" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="size-4" />
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {orders.length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">
            {orders.filter((o) => !o.shippingStatus).length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Shipped</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {orders.filter((o) => o.shippingStatus === 'shipped').length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Delivered</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {orders.filter((o) => o.shippingStatus === 'delivered').length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="flex items-center gap-2">
            <Gift className="size-4 text-pink-600" />
            <p className="text-sm text-gray-600">Gift Orders</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-pink-600">
            {orders.filter((o) => o.isGift).length}
          </p>
        </div>
      </div>
    </div>
  );
}
