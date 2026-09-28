"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Icons.sun aria-hidden="true" className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Icons.moon aria-hidden="true" className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
