import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('rounded-lg border p-4 text-sm transition-colors', {
  variants: {
    variant: {
      default: 'border-border bg-card text-card-foreground',
      destructive: 'border-destructive/30 bg-destructive/5 text-destructive',
      danger: 'border-danger/30 bg-danger/5 text-danger',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>;

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-1 font-medium leading-none tracking-normal', className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('leading-6 opacity-80', className)} {...props} />;
}
