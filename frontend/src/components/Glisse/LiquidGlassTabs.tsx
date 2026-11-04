import React from 'react';

export interface TabOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface LiquidGlassTabsProps<T extends string = string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const LiquidGlassTabs = <T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className = ''
}: LiquidGlassTabsProps<T>) => {
  const isSmall = size === 'sm';

  return (
    <div
      role="tablist"
      className={`
        inline-flex items-center p-1 rounded-xl
        bg-black/[0.04] dark:bg-white/[0.05]
        border border-black/[0.06] dark:border-white/[0.08]
        relative select-none max-w-full overflow-x-auto no-scrollbar touch-pan-x
        ${className}
      `}
    >
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={`
              relative z-10 flex items-center justify-center gap-1.5 font-medium
              transition-colors duration-150
              active:scale-[0.98]
              ${isSmall ? 'px-2.5 py-1 text-[11px] rounded-lg' : 'px-3.5 py-1.5 text-xs rounded-lg'}
              ${isActive 
                ? 'text-slate-900 dark:text-white font-medium bg-white dark:bg-white/[0.1] shadow-xs border border-black/[0.06] dark:border-white/[0.08]' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }
            `}
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span 
                className={`
                  text-[10px] font-mono px-1.5 py-0.5 rounded-full
                  ${isActive 
                    ? 'bg-blue-500/15 text-blue-600 dark:bg-blue-400/25 dark:text-blue-300' 
                    : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                  }
                `}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
