import { type HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md';
  color?: 'primary' | 'success' | 'warning' | 'error';
}

const colorClasses = {
  primary: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
};

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
};

export function Progress({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  className,
  ...props
}: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={twMerge(
        'w-full overflow-hidden rounded-full bg-muted',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      <div
        className={twMerge('h-full rounded-full transition-all duration-300', colorClasses[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
