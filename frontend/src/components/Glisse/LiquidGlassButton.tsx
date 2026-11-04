import React from 'react';

export interface LiquidGlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  variant = 'glass',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-3 text-xs gap-1.5 rounded-lg';
      case 'lg':
        return 'h-10 px-4 text-sm gap-2.5 rounded-xl';
      case 'md':
      default:
        return 'h-9 px-3.5 text-xs gap-2 rounded-xl';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return `
          bg-blue-600 hover:bg-blue-500 active:bg-blue-700
          text-white font-medium
          border border-blue-500/30
          shadow-xs
        `;
      case 'danger':
        return `
          bg-rose-600 hover:bg-rose-500 active:bg-rose-700
          text-white font-medium
          border border-rose-500/30
          shadow-xs
        `;
      case 'secondary':
        return `
          bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]
          text-slate-800 dark:text-slate-200 font-medium
          border border-black/[0.08] dark:border-white/[0.08]
        `;
      case 'ghost':
        return `
          bg-transparent text-slate-700 dark:text-slate-300
          border border-transparent
          hover:bg-black/[0.04] dark:hover:bg-white/[0.06]
          hover:text-slate-900 dark:hover:text-white
        `;
      case 'glass':
      default:
        return `
          bg-white hover:bg-slate-50 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]
          text-slate-800 dark:text-slate-100 font-medium
          border border-black/[0.08] dark:border-white/[0.08]
          shadow-xs
        `;
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`
        relative inline-flex items-center justify-center select-none
        font-sans tracking-tight
        transition-colors duration-150
        active:scale-[0.98]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
        disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100
        ${getSizeStyles()}
        ${getVariantStyles()}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <svg 
          className="animate-spin w-3.5 h-3.5 text-current shrink-0" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
