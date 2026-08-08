'use client';

import * as React from "react";
import { useMemo } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/ui-cn";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return <fieldset data-slot="field-set" className={cn("flex flex-col gap-6", className)} {...props} />;
}

export type FieldLegendProps = React.ComponentProps<"legend"> & { variant?: "legend" | "label" };

export function FieldLegend({ className, variant = "legend", ...props }: FieldLegendProps) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn("mb-3 font-medium data-[variant=legend]:text-base data-[variant=label]:text-sm", className)}
      {...props}
    />
  );
}

export function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-group" className={cn("group/field-group @container/field-group flex w-full flex-col gap-6", className)} {...props} />;
}

const fieldVariants = cva("group/field flex w-full gap-3", {
  variants: {
    orientation: {
      vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
      horizontal: "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      responsive: "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto",
    },
  },
  defaultVariants: { orientation: "vertical" },
});

export type FieldProps = React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>;

export function Field({ className, orientation = "vertical", ...props }: FieldProps) {
  return <div role="group" data-slot="field" data-orientation={orientation} className={cn(fieldVariants({ orientation }), className)} {...props} />;
}

export function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-content" className={cn("group/field-content flex flex-1 flex-col gap-1 leading-snug", className)} {...props} />;
}

export function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label data-slot="field-label" className={cn("group/field-label peer/field-label flex w-fit has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col", className)} {...props} />;
}

export function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-label" className={cn("flex w-fit items-center text-sm font-medium", className)} {...props} />;
}

export function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="field-description" className={cn("text-sm font-normal leading-normal text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary", className)} {...props} />;
}

export function FieldSeparator({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="field-separator" data-content={Boolean(children)} className={cn("relative -my-2 h-5 text-sm", className)} {...props}>
      <Separator className="absolute inset-0 top-1/2" />
      {children ? <span data-slot="field-separator-content" className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground">{children}</span> : null}
    </div>
  );
}

export type FieldErrorProps = React.ComponentProps<"div"> & { errors?: Array<{ message?: string } | undefined> };

export function FieldError({ className, children, errors, ...props }: FieldErrorProps) {
  const content = useMemo(() => {
    if (children) return children;
    if (!errors?.length) return null;
    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];
    if (uniqueErrors.length === 1) return uniqueErrors[0]?.message ?? null;
    return <ul className="ml-4 flex list-disc flex-col gap-1">{uniqueErrors.map((error, index) => error?.message ? <li key={`${error.message}-${index}`}>{error.message}</li> : null)}</ul>;
  }, [children, errors]);

  if (!content) return null;
  return <div role="alert" data-slot="field-error" className={cn("text-sm font-normal text-destructive", className)} {...props}>{content}</div>;
}

export { fieldVariants };
