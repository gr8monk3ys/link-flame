import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "USER" | "EDITOR" | "ADMIN"
    } & DefaultSession["user"]
  }

  interface User {
    role: "USER" | "EDITOR" | "ADMIN"
  }
}
