import Link from "next/link";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default function SignOutPage() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">Ready to sign out?</h1>
      <p className="text-sm text-muted-foreground">
        Click below to end your session.
      </p>
      <div className="flex items-center gap-2">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="default">
            Sign Out
          </Button>
        </form>
        <Button asChild variant="ghost">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
