import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Authentication | Link Flame",
  description: "Create an account or sign in to manage your Link Flame experience.",
};

export default function AuthenticationPage() {
  redirect("/auth/signup");
}
