import React from 'react';

export interface LiquidGlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'info' | 'warning' | 'danger' | 'purple';
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
}

export const LiquidGlassBadge: React.FC<LiquidGlassBadgeProps> = ({
  variant = 'neutral',
  dot = false,
  pulse = false,
  children,
  className = '',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
      case 'info':
        return 'bg-blue-500/10 text-blue-700 dark:text-sky-300 border-blue-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      case 'danger':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
      case 'purple':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
      case 'neutral':
      default:
        return 'bg-black/[0.04] dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border-black/[0.07] dark:border-white/[0.08]';
    }
  };

  const getDotColor = () => {
    switch (variant) {
      case 'success': return 'bg-emerald-500';
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-amber-500';
      case 'danger': return 'bg-rose-500';
      case 'purple': return 'bg-purple-500';
      case 'neutral':
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md
        text-[11px] font-medium tracking-tight font-mono
        border
        ${getVariantStyles()}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span 
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotColor()} ${pulse ? 'animate-pulse' : ''}`} 
        />
      )}
      <span>{children}</span>
    </span>
  );
};
