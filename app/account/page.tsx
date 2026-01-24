"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Package,
  Settings,
  Heart,
  Trophy,
  TrendingUp,
  ChevronRight,
  Loader2,
  RefreshCw
} from "lucide-react";

const accountLinks = [
  {
    title: "Subscribe & Save",
    description: "Manage your recurring deliveries and save up to 20%",
    href: "/account/subscriptions",
    icon: RefreshCw,
  },
  {
    title: "Environmental Impact",
    description: "Track your positive impact on the planet",
    href: "/account/impact",
    icon: TrendingUp,
  },
  {
    title: "Loyalty Rewards",
    description: "View your points, tier status, and redeem rewards",
    href: "/account/loyalty",
    icon: Trophy,
  },
  {
    title: "Order History",
    description: "View and track your orders",
    href: "/account/orders",
    icon: Package,
  },
  {
    title: "Account Settings",
    description: "Update your profile and security settings",
    href: "/account/settings",
    icon: Settings,
  },
  {
    title: "Wishlists",
    description: "Manage your wishlists and saved products",
    href: "/account/saved",
    icon: Heart,
  },
];

export default function AccountPage() {
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const isSignedIn = !!session;

  if (!isLoaded) {
    return (
      <div className="container flex items-center justify-center py-10">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      {/* Header with user info */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="size-16 rounded-full object-cover"
                />
              ) : (
                <User className="size-8 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl">
                Welcome, {session.user?.name || "User"}
              </CardTitle>
              <CardDescription className="text-base">
                {session.user?.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Account navigation */}
      <div className="grid gap-4">
        {accountLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{link.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
