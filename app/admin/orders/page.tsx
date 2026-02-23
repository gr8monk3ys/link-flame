'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, Eye, Gift, RefreshCw } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: string;
  shippingStatus: string | null;
  trackingNumber: string | null;
  shippingCarrier: string | null;
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

const CARRIER_OPTIONS = [
  { value: '', label: 'Select Carrier' },
  { value: 'UPS', label: 'UPS' },
  { value: 'USPS', label: 'USPS' },
  { value: 'FedEx', label: 'FedEx' },
  { value: 'DHL', label: 'DHL' },
  { value: 'Other', label: 'Other' },
];

function getCsrfToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((c) => c.startsWith('csrf_token='))
    ?.split('=')[1];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shippingFilter, setShippingFilter] = useState('all');
  const [refundingOrderId, setRefundingOrderId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<
    Record<string, { trackingNumber: string; shippingCarrier: string }>
  >({});

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?admin=true&limit=50');
      if (res.ok) {
        const responseData = await res.json();
        setOrders(responseData.data || []);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch orders:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Initialize tracking inputs from order data
  useEffect(() => {
    const inputs: Record<
      string,
      { trackingNumber: string; shippingCarrier: string }
    > = {};
    for (const order of orders) {
      inputs[order.id] = {
        trackingNumber: order.trackingNumber || '',
        shippingCarrier: order.shippingCarrier || '',
      };
    }
    setTrackingInputs(inputs);
  }, [orders]);

  function updateTrackingInput(
    orderId: string,
    field: 'trackingNumber' | 'shippingCarrier',
    value: string
  ) {
    setTrackingInputs((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }));
  }

  async function updateShippingStatus(orderId: string, status: string) {
    try {
      const csrfToken = getCsrfToken();
      const tracking = trackingInputs[orderId];

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({
          shippingStatus: status,
          ...(tracking?.trackingNumber
            ? { trackingNumber: tracking.trackingNumber }
            : {}),
          ...(tracking?.shippingCarrier
            ? { shippingCarrier: tracking.shippingCarrier }
            : {}),
        }),
      });

      if (res.ok) {
        setOrders(
          orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  shippingStatus: status,
                  trackingNumber:
                    tracking?.trackingNumber || o.trackingNumber,
                  shippingCarrier:
                    tracking?.shippingCarrier || o.shippingCarrier,
                }
              : o
          )
        );
      } else {
        const errorData = await res.json().catch(() => null);
        alert(
          errorData?.error?.message || 'Failed to update shipping status'
        );
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update shipping status:', error);
      }
      alert('Failed to update shipping status');
    }
  }

  async function handleRefund(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const confirmed = window.confirm(
      `Are you sure you want to refund order #${orderId}?\n\nAmount: $${Number(order.amount).toFixed(2)}\nCustomer: ${order.customerName || order.user?.name || 'Unknown'}\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setRefundingOrderId(orderId);

    try {
      const csrfToken = getCsrfToken();

      const res = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      });

      if (res.ok) {
        setOrders(
          orders.map((o) =>
            o.id === orderId ? { ...o, status: 'refunded' } : o
          )
        );
        alert('Refund processed successfully');
      } else {
        const errorData = await res.json().catch(() => null);
        alert(
          errorData?.error?.message || 'Failed to process refund'
        );
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to process refund:', error);
      }
      alert('Failed to process refund');
    } finally {
      setRefundingOrderId(null);
    }
  }

  function getPaymentStatusBadge(status: string): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toString().includes(search);

    const matchesPaymentStatus =
      statusFilter === 'all' || order.status === statusFilter;

    const matchesShippingStatus =
      shippingFilter === 'all' ||
      (shippingFilter === 'pending' && !order.shippingStatus) ||
      order.shippingStatus === shippingFilter;

    return matchesSearch && matchesPaymentStatus && matchesShippingStatus;
  });

  // Determine if tracking fields should be shown for a given shipping status
  function shouldShowTracking(shippingStatus: string | null): boolean {
    const trackableStatuses = [
      'shipped',
      'in_transit',
      'out_for_delivery',
      'delivered',
    ];
    return shippingStatus !== null && trackableStatuses.includes(shippingStatus);
  }

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
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={shippingFilter}
              onChange={(e) => setShippingFilter(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Shipping Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tracking
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
                  colSpan={9}
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
                    ${Number(order.amount).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${getPaymentStatusBadge(order.status)}`}
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
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-transparent focus:ring-2 focus:ring-ring"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="in_transit">In Transit</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {shouldShowTracking(order.shippingStatus) ? (
                      <div className="flex flex-col gap-1">
                        <select
                          value={
                            trackingInputs[order.id]?.shippingCarrier || ''
                          }
                          onChange={(e) =>
                            updateTrackingInput(
                              order.id,
                              'shippingCarrier',
                              e.target.value
                            )
                          }
                          className="w-28 rounded border border-gray-300 p-1 text-xs focus:border-transparent focus:ring-2 focus:ring-ring"
                        >
                          {CARRIER_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Tracking #"
                          value={
                            trackingInputs[order.id]?.trackingNumber || ''
                          }
                          onChange={(e) =>
                            updateTrackingInput(
                              order.id,
                              'trackingNumber',
                              e.target.value
                            )
                          }
                          onBlur={() => {
                            // Save tracking info when user leaves the field
                            const tracking = trackingInputs[order.id];
                            if (
                              tracking &&
                              (tracking.trackingNumber !==
                                (order.trackingNumber || '') ||
                                tracking.shippingCarrier !==
                                  (order.shippingCarrier || ''))
                            ) {
                              updateShippingStatus(
                                order.id,
                                order.shippingStatus || 'processing'
                              );
                            }
                          }}
                          className="w-36 rounded border border-gray-300 px-2 py-1 text-xs focus:border-transparent focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
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
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="size-4" />
                        View
                      </Link>
                      {order.status === 'paid' && (
                        <button
                          onClick={() => handleRefund(order.id)}
                          disabled={refundingOrderId === order.id}
                          className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {refundingOrderId === order.id ? (
                            <>
                              <RefreshCw className="size-3 animate-spin" />
                              Refunding...
                            </>
                          ) : (
                            'Refund'
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {orders.length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">
            {orders.filter((o) => !o.shippingStatus || o.shippingStatus === 'processing').length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Shipped</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {orders.filter((o) => o.shippingStatus === 'shipped' || o.shippingStatus === 'in_transit').length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Delivered</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {orders.filter((o) => o.shippingStatus === 'delivered').length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Refunded</p>
          <p className="mt-1 text-2xl font-bold text-purple-600">
            {orders.filter((o) => o.status === 'refunded').length}
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
