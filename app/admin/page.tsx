import { prisma } from '@/lib/prisma';

// Render at request time — DB not available during Vercel build
export const dynamic = 'force-dynamic';

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
    <div className="rounded-lg bg-card p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p
              className={`mt-2 flex items-center gap-1 text-sm ${
                trend === 'up' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              <TrendingUp className="size-4" />
              {change}
            </p>
          )}
        </div>
        <div className="rounded-full bg-green-100 p-3 text-green-700 dark:bg-green-900/30 dark:text-green-400">
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
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${revenue.toFixed(2)}`}
          icon={<DollarSign className="size-6" />}
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={<ShoppingCart className="size-6" />}
        />
        <StatCard
          title="Total Users"
          value={totalUsers}
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
        <div className="rounded-lg bg-card p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Average Order Value
          </h2>
          <p className="text-3xl font-bold text-green-700 dark:text-green-400">
            ${avgOrderValue.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg bg-card p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Blog Posts
          </h2>
          <p className="text-3xl font-bold text-green-700 dark:text-green-400">{totalBlogPosts}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg bg-card shadow">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                      #{order.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                      {order.customerName || 'Unknown'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                      ${order.amount.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${
                          order.status === 'paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
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
        <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-6 dark:bg-yellow-950/40">
          <div className="flex items-start">
            <div className="shrink-0">
              <Package className="size-6 text-yellow-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Low Stock Alert
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
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
