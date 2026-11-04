import React from 'react';

export interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'elevated' | 'glass';
  interactive?: boolean;
  refractive?: boolean;
  specular?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  variant = 'default',
  interactive = false,
  refractive = false,
  specular = false,
  className = '',
  children,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'subtle':
        return `
          bg-slate-50/70 dark:bg-white/[0.02]
          border border-black/[0.06] dark:border-white/[0.06]
        `;
      case 'elevated':
        return `
          bg-white dark:bg-[#12151f]
          border border-black/[0.08] dark:border-white/[0.1]
          shadow-md shadow-black/[0.04] dark:shadow-xl dark:shadow-black/50
        `;
      case 'glass':
        return `
          bg-white/80 dark:bg-[#0f121a]/80
          backdrop-blur-md
          border border-black/[0.06] dark:border-white/[0.08]
          shadow-xs
        `;
      case 'default':
      default:
        return `
          bg-white dark:bg-[#0f121a]
          border border-black/[0.07] dark:border-white/[0.08]
          shadow-xs
        `;
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        transition-colors duration-150
        ${getVariantStyles()}
        ${interactive ? 'hover:border-black/20 dark:hover:border-white/20 active:scale-[0.99] cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
