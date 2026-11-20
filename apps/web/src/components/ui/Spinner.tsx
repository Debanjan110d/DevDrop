import { type HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={twMerge(
        'inline-block animate-spin rounded-full border-current border-t-transparent',
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
