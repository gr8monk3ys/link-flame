import { prisma } from '@/lib/prisma';
import {
  DollarSign,
  ShoppingCart,
  Users,
  FileText,
  TrendingUp,
  Package
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}

function StatCard({ title, value, change, icon, trend }: StatCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p
              className={`mt-2 flex items-center gap-1 text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp className="size-4" />
              {change}
            </p>
          )}
        </div>
        <div className="rounded-full bg-green-100 p-3 text-green-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  // Fetch analytics data
  const [
    totalRevenue,
    totalOrders,
    totalUsers,
    totalProducts,
    totalBlogPosts,
    recentOrders,
    lowStockProducts,
  ] = await Promise.all([
    // Total revenue
    prisma.order.aggregate({
      _sum: { amount: true },
      where: { status: 'paid' },
    }),
    // Total orders
    prisma.order.count(),
    // Total users
    prisma.user.count(),
    // Total products
    prisma.product.count(),
    // Total blog posts
    prisma.blogPost.count(),
    // Recent orders
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
    // Low stock products
    prisma.product.findMany({
      where: { inventory: { lte: 5 } },
      take: 5,
      orderBy: { inventory: 'asc' },
    }),
  ]);

  // Calculate stats
  const revenue = Number(totalRevenue._sum.amount) || 0;
  const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${revenue.toFixed(2)}`}
          change="+12.5% from last month"
          trend="up"
          icon={<DollarSign className="size-6" />}
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          change="+8.2% from last month"
          trend="up"
          icon={<ShoppingCart className="size-6" />}
        />
        <StatCard
          title="Total Users"
          value={totalUsers}
          change="+15.3% from last month"
          trend="up"
          icon={<Users className="size-6" />}
        />
        <StatCard
          title="Products"
          value={totalProducts}
          icon={<Package className="size-6" />}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Average Order Value
          </h2>
          <p className="text-3xl font-bold text-green-600">
            ${avgOrderValue.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Blog Posts
          </h2>
          <p className="text-3xl font-bold text-green-600">{totalBlogPosts}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {order.customerName || 'Unknown'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      ${order.amount.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${
                          order.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-6">
          <div className="flex items-start">
            <div className="shrink-0">
              <Package className="size-6 text-yellow-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Low Stock Alert
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>The following products are running low on inventory:</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {lowStockProducts.map((product) => (
                    <li key={product.id}>
                      {product.title} - {product.inventory} left
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
