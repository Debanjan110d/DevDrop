import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export interface BuyMeAChaiProps {
  variant?: 'pill' | 'outline' | 'compact' | 'subtle' | 'footer';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showArrow?: boolean;
  customText?: string;
  href?: string;
}

/**
 * Authentic Indian Cutting Chai Glass Icon
 * Features faceted tumbler flutes, hot amber tea, and rising steam curls.
 */
export function ChaiGlassIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Steam lines */}
      <path
        d="M9.5 2C9 3.2 10 3.8 9.5 5"
        stroke="#B45309"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M12.5 1.5C12 2.8 13 3.5 12.5 4.8"
        stroke="#B45309"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M15.5 2.5C15 3.3 15.8 4 15.5 4.8"
        stroke="#B45309"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Glass Body Outline */}
      <path
        d="M6 6H18L16.8 20.4C16.7 21.3 16 22 15.1 22H8.9C8 22 7.3 21.3 7.2 20.4L6 6Z"
        fill="#FEF3C7"
        fillOpacity="0.4"
        stroke="#1E1B18"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Chai Liquid Body */}
      <path
        d="M6.8 9.5H17.2L16.5 19.8C16.4 20.5 15.8 21 15.1 21H8.9C8.2 21 7.6 20.5 7.5 19.8L6.8 9.5Z"
        fill="#C05621"
      />
      {/* Chai Surface Froth */}
      <ellipse cx="12" cy="9.5" rx="5.2" ry="0.9" fill="#EA580C" />
      <ellipse cx="12" cy="9.5" rx="4" ry="0.6" fill="#FDBA74" fillOpacity="0.8" />
      {/* Vertical Facets / Cutting Flutes */}
      <path
        d="M9.2 13V19"
        stroke="#78350F"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M12 13V19.5"
        stroke="#78350F"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M14.8 13V19"
        stroke="#78350F"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Rim Reflection Highlight */}
      <path
        d="M7.8 7.5L8.4 18"
        stroke="#FFFFFF"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

/**
 * Universal "Buy me a chai" Component
 * Implements the signature warm golden pill design system across light & dark modes.
 */
export function BuyMeAChai({
  variant = 'pill',
  size = 'md',
  className = '',
  showArrow = true,
  customText = 'Buy me a chai',
  href = 'https://buymeachai.in/debanjan110d',
}: BuyMeAChaiProps) {
  // Size specifications
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const arrowSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  // Compact icon-only variant
  if (variant === 'compact') {
    const compactBoxSizes = {
      sm: 'w-8 h-8 rounded-xl',
      md: 'w-10 h-10 rounded-2xl',
      lg: 'w-12 h-12 rounded-2xl',
    };
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={customText}
        className={`inline-flex items-center justify-center bg-[#FFC436] hover:bg-[#FBBF24] active:scale-95 transition-transform shadow-md shadow-amber-500/15 ${compactBoxSizes[size]} ${className}`}
      >
        <ChaiGlassIcon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
      </a>
    );
  }

  // Outline variant
  if (variant === 'outline') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center rounded-full font-bold border-2 border-[#FFC436] bg-[#FFC436]/5 hover:bg-[#FFC436]/15 text-slate-100 hover:text-white transition-all active:scale-[0.98] ${sizeClasses[size]} ${className}`}
      >
        <ChaiGlassIcon className={iconSizes[size]} />
        <span>{customText}</span>
        {showArrow && <ArrowUpRight className={`${arrowSizes[size]} text-[#FFC436]`} />}
      </a>
    );
  }

  // Subtle inline text link
  if (variant === 'subtle') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFC436] hover:underline transition-colors ${className}`}
      >
        <ChaiGlassIcon className="w-3.5 h-3.5" />
        <span>{customText}</span>
        {showArrow && <ArrowUpRight className="w-3 h-3" />}
      </a>
    );
  }

  // Footer inline variant
  if (variant === 'footer') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-[#FFC436] transition-colors ${className}`}
      >
        <ChaiGlassIcon className="w-3.5 h-3.5" />
        <span className="font-semibold">{customText}</span>
        {showArrow && <ArrowUpRight className="w-3 h-3 text-[#FFC436]" />}
      </a>
    );
  }

  // Signature Default Golden Pill
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative inline-flex items-center justify-center rounded-full font-bold bg-[#FFC436] hover:bg-[#FBBF24] text-[#18181B] shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 select-none ${sizeClasses[size]} ${className}`}
    >
      <ChaiGlassIcon className={`${iconSizes[size]} transition-transform group-hover:-rotate-6`} />
      <span className="tracking-tight">{customText}</span>
      {showArrow && (
        <ArrowUpRight className={`${arrowSizes[size]} transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5`} />
      )}
    </a>
  );
}

export default BuyMeAChai;
