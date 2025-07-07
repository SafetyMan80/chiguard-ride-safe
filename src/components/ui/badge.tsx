import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-[var(--shadow-interactive)]",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-[var(--shadow-card)]",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-[var(--shadow-emergency)]",
        outline: "text-foreground border-border hover:bg-muted/50",
        emergency:
          "border-transparent bg-chicago-red text-white shadow-[var(--shadow-emergency)] animate-pulse-emergency font-bold",
        chicago:
          "border-transparent bg-chicago-blue text-white hover:bg-chicago-dark-blue shadow-[var(--shadow-soft)]",
        live:
          "border-transparent bg-chicago-green text-white animate-pulse shadow-[var(--shadow-soft)]",
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
