"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Icons } from "@/components/shared/icons";
import { cn } from "@/lib/utils";

// A round hairline pill in the header cluster, beside search and the cart.
export function AccountLink({ className }: { className?: string }) {
  const { status } = useSession();

  const href = status === "authenticated" ? "/account" : "/auth/signin";

  return (
    <Link href={href} className={cn("cta-secondary size-9 rounded-full", className)}>
      <Icons.user className="size-4" aria-hidden="true" />
      <span className="sr-only">Account</span>
    </Link>
  );
}
