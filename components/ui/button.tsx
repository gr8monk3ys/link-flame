import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// The notebook has one filled button (cta-primary, one per view) and paper-card
// buttons for everything else. Focus is the global :focus-visible outline in
// styles/globals.css, so no ring stack here. The honey `accent` button of the
// aurora era is gone: the quiz CTA is a `default` button like any other
// primary action. See DESIGN.md → Components → Buttons.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "cta-primary rounded-xl",
        destructive: "cta-secondary rounded-xl text-destructive hover:text-destructive",
        outline: "cta-secondary rounded-xl",
        secondary: "cta-secondary rounded-xl",
        ghost:
          "rounded-xl border border-transparent text-foreground hover:border-border hover:bg-card hover:text-primary",
        link: "ink-underline h-auto px-0 text-primary",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
