import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-[var(--radius-md)] type-button ring-offset-background transition-[background-color,transform,box-shadow,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-[1.125rem] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "btn-glow",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background font-medium text-foreground hover:bg-muted",
        "destructive-outline":
          "border border-destructive/40 bg-background font-medium text-destructive hover:bg-destructive/10 hover:text-destructive",
        secondary:
          "border border-border bg-secondary font-medium text-secondary-foreground hover:bg-muted",
        ghost: "font-medium text-foreground hover:bg-muted hover:text-foreground",
        link: "font-medium text-primary underline-offset-4 hover:underline",
        hero: "btn-glow tracking-tight",
        "hero-outline": "border border-input bg-card font-medium text-foreground hover:bg-muted",
      },
      size: {
        default: "h-12 min-h-12 px-7",
        sm: "h-11 min-h-11 px-5 text-[length:var(--text-support)] font-semibold leading-[var(--leading-support)]",
        lg: "h-14 min-h-14 px-10 text-[length:var(--text-ui)] leading-[var(--leading-ui)]",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
