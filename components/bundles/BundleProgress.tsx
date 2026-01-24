"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, Circle } from "lucide-react"

interface BundleProgressProps {
  currentItems: number
  minItems: number | null
  maxItems: number | null
  className?: string
}

export function BundleProgress({
  currentItems,
  minItems,
  maxItems,
  className,
}: BundleProgressProps) {
  const min = minItems || 1
  const max = maxItems || min

  // Calculate progress percentage
  const progress = Math.min((currentItems / min) * 100, 100)
  const isComplete = currentItems >= min
  const isOverMax = maxItems ? currentItems > maxItems : false
  const itemsNeeded = Math.max(0, min - currentItems)

  // Generate step indicators
  const steps = Array.from({ length: min }, (_, i) => i + 1)

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {isComplete ? (
            <span className="text-green-600">Bundle complete!</span>
          ) : (
            <span className="text-muted-foreground">
              Select {itemsNeeded} more item{itemsNeeded !== 1 ? "s" : ""} to complete your bundle
            </span>
          )}
        </div>
        <div className="text-sm">
          <span className={cn(
            "font-semibold",
            isComplete ? "text-green-600" : "text-foreground",
            isOverMax && "text-destructive"
          )}>
            {currentItems}
          </span>
          <span className="text-muted-foreground">
            {" / "}
            {min}
            {maxItems && maxItems !== min && ` - ${maxItems}`}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-all duration-300",
            isComplete ? "bg-green-500" : "bg-primary",
            isOverMax && "bg-destructive"
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Step Indicators */}
      {min <= 8 && (
        <div className="flex justify-between">
          {steps.map((step) => (
            <div
              key={step}
              className="flex flex-col items-center"
            >
              {currentItems >= step ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/50" />
              )}
              <span className="mt-1 text-xs text-muted-foreground">{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warning if over max */}
      {isOverMax && (
        <p className="text-sm text-destructive">
          You have selected too many items. Maximum is {maxItems}.
        </p>
      )}
    </div>
  )
}
