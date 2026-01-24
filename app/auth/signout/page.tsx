"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignOutPage() {
  useEffect(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  return (
    <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Signing Out</CardTitle>
          <CardDescription>Please wait while we sign you out...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="size-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
