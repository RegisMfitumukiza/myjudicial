import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 [&>svg]:pointer-events-none [&>svg]:h-3 [&>svg]:w-3",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary dark:bg-white/10 dark:text-white",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-success/10 text-success dark:bg-white/10 dark:text-white",
        warning: "bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning",
        destructive:
          "bg-destructive/10 text-destructive dark:bg-destructive/15 dark:text-red-400",
        outline: "border-border text-foreground",
        ghost: "text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
