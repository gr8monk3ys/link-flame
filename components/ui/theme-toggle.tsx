"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Icons } from "@/components/shared/icons"
import { cn } from "@/lib/utils"

// A round hairline pill (cta-secondary): the same control as the header's
// cart and account pills. The sun and moon swap by rotating; both are hidden
// from assistive tech and the button's name says what it does.
export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, theme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn("cta-secondary relative size-9 rounded-full", className)}
    >
      <Icons.sun
        aria-hidden="true"
        className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
      />
      <Icons.moon
        aria-hidden="true"
        className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
      />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
