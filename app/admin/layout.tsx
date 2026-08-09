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
    <div className="min-h-screen bg-muted">
      {/* Admin Navbar */}
      <nav className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <Link href="/admin" className="flex items-center">
                <span className="text-xl font-bold text-green-700 dark:text-green-400">
                  Link Flame
                </span>
                <span className="ml-2 rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-200">
                  Admin
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground">
                {user?.name || user?.email}
              </span>
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                View Site
              </Link>
              <Link
                href="/auth/signout"
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <LogOut className="size-4" />
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 shrink-0">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="size-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
