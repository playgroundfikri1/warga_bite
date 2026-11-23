import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        success: "bg-[#DCFCE7] text-[#16A34A]",
        warning: "bg-[#FEF3C7] text-[#D97706]",
        danger: "bg-[#FEE2E2] text-[#DC2626]",
        neutral: "bg-[#F1F5F9] text-[#64748B]",
        primary: "bg-[#FFEDD5] text-[#EA580C]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
