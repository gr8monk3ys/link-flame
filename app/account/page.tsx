"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Package,
  Settings,
  Heart,
  ChevronRight,
  Loader2
} from "lucide-react";

const accountLinks = [
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
    title: "Saved Items",
    description: "View your wishlist and saved products",
    href: "/saved",
    icon: Heart,
  },
];

export default function AccountPage() {
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const isSignedIn = !!session;

  if (!isLoaded) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
    <div className="container py-10 max-w-4xl">
      {/* Header with user info */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-primary" />
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
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{link.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
