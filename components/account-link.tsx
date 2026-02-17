"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Icons } from "@/components/shared/icons";
import { cn } from "@/lib/utils";

export function AccountLink({ className }: { className?: string }) {
  const { status } = useSession();

  const href = status === "authenticated" ? "/account" : "/auth/signin";

  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
        className
      )}
    >
      <div className="flex items-center space-x-2">
        <Icons.user className="size-5" />
        <span className="sr-only">Account</span>
      </div>
    </Link>
  );
}

