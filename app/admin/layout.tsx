import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  Users,
  Settings,
  LogOut
} from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, user } = await getServerAuth();

  // Require authentication and ADMIN role
  if (!userId || user?.role !== 'ADMIN') {
    redirect('/auth/signin?error=AccessDenied');
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Blog Posts', href: '/admin/blog', icon: FileText },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/admin" className="flex items-center">
                <span className="text-xl font-bold text-green-600">
                  Link Flame
                </span>
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                  Admin
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {user?.name || user?.email}
              </span>
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                View Site
              </Link>
              <Link
                href="/auth/signout"
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
