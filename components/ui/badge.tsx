import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Chips are fully round. The house chip is the hairline one (outline /
// secondary): Paper Card with a hairline, Ink text, Moss on hover. The filled
// `default` is reserved for a single status or count. Status colours go
// through the tokens (text-success, bg-destructive), never a raw hue.
// See DESIGN.md → Components → Chips.
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors duration-150",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-border bg-card text-foreground hover:text-primary",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border bg-card text-foreground hover:text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
