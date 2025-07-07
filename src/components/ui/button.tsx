import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-target",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-interactive)] hover:shadow-[var(--shadow-elevated)] hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[var(--shadow-emergency)] hover:shadow-[var(--shadow-emergency)] hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-interactive)] hover:scale-[1.02] active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-interactive)] hover:scale-[1.02] active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95",
        link: "text-primary underline-offset-4 hover:underline",
        emergency: "bg-gradient-to-r from-chicago-red to-chicago-red/90 text-white hover:from-chicago-red/90 hover:to-chicago-red shadow-[var(--shadow-emergency)] hover:shadow-[var(--shadow-emergency)] font-semibold hover:scale-[1.02] active:scale-[0.98] animate-pulse-emergency",
        chicago: "bg-gradient-to-r from-chicago-blue to-chicago-dark-blue text-white hover:from-chicago-dark-blue hover:to-chicago-navy shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elevated)] hover:scale-[1.02] active:scale-[0.98] font-semibold",
        "chicago-outline": "border-2 border-chicago-blue text-chicago-blue bg-background hover:bg-chicago-light-blue/20 dark:hover:bg-chicago-blue/10 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-interactive)] hover:scale-[1.02] active:scale-[0.98] font-medium",
      },
      size: {
        default: "h-10 px-4 py-2 min-w-[48px] min-h-[44px]",
        sm: "h-9 rounded-md px-3 min-w-[44px] min-h-[40px]",
        lg: "h-11 rounded-md px-8 min-w-[48px] min-h-[48px]",
        icon: "h-10 w-10 min-w-[48px] min-h-[44px]",
        "touch-large": "h-12 px-6 py-3 min-w-[48px] min-h-[48px]",
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
