import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/ui-cn";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn("text-sm font-medium leading-none text-foreground", className)}
      {...props}
    />
  );
}
