import React from 'react';

export interface LiquidGlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  onClear?: () => void;
}

export const LiquidGlassInput = React.forwardRef<HTMLInputElement, LiquidGlassInputProps>(({
  leftIcon,
  rightAdornment,
  onClear,
  className = '',
  value,
  ...props
}, ref) => {
  return (
    <div className="relative flex items-center w-full">
      {leftIcon && (
        <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          {leftIcon}
        </div>
      )}

      <input
        ref={ref}
        value={value}
        className={`
          w-full h-9 text-xs font-sans
          bg-white dark:bg-[#0f121a]
          text-slate-900 dark:text-slate-100
          placeholder-slate-400 dark:placeholder-slate-500
          border border-black/[0.08] dark:border-white/[0.09]
          rounded-xl
          ${leftIcon ? 'pl-9' : 'pl-3.5'}
          ${rightAdornment || (onClear && value) ? 'pr-9' : 'pr-3.5'}
          transition-colors duration-150
          focus:outline-none focus:border-blue-500 dark:focus:border-blue-400
          focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20
          shadow-xs
          ${className}
        `}
        {...props}
      />

      {rightAdornment ? (
        <div className="absolute right-2.5 flex items-center">
          {rightAdornment}
        </div>
      ) : onClear && value ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      ) : null}
    </div>
  );
});

LiquidGlassInput.displayName = 'LiquidGlassInput';
