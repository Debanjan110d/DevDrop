import { type HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary/20 text-primary',
  success: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400',
  error: 'bg-red-500/20 text-red-400',
  info: 'bg-blue-500/20 text-blue-400',
  muted: 'bg-slate-700 text-slate-400',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
          variantClasses[variant],
          className,
        ),
      )}
      {...props}
    />
  );
}

export function statusToBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'completed':
      return 'success';
    case 'uploading':
    case 'downloading':
      return 'info';
    case 'pending':
    case 'available':
      return 'warning';
    case 'failed':
      return 'error';
    case 'cancelled':
    case 'expired':
      return 'muted';
    default:
      return 'default';
  }
}
