import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui-cn";

export type AlertVariant = "default" | "success" | "destructive";

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
};

const variants: Record<AlertVariant, string> = {
  default: "border-border bg-card text-card-foreground",
  success:
    "border-primary/30 bg-primary/10 text-foreground [&_[data-slot=alert-description]]:text-foreground/80",
  destructive:
    "border-destructive/35 bg-destructive/10 text-destructive [&_[data-slot=alert-description]]:text-destructive",
};

export function Alert({ className, variant = "default", ...props }: AlertProps) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn("relative w-full rounded-lg border px-4 py-3 text-sm", variants[variant], className)}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      data-slot="alert-title"
      className={cn("mb-1 font-medium leading-none", className)}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="alert-description"
      className={cn("text-sm leading-5 text-muted-foreground", className)}
      {...props}
    />
  );
}
