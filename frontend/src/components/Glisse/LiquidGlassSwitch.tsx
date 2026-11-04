import React from 'react';

export interface LiquidGlassSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}

export const LiquidGlassSwitch: React.FC<LiquidGlassSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  className = ''
}) => {
  const isSmall = size === 'sm';
  const trackWidth = isSmall ? 'w-7 h-4' : 'w-9 h-5';
  const thumbSize = isSmall ? 'w-3 h-3' : 'w-4 h-4';
  const translateDist = isSmall ? 'translate-x-3' : 'translate-x-4';

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <label 
      className={`inline-flex items-center gap-2 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <div 
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        className={`
          relative inline-flex items-center rounded-full p-0.5
          transition-colors duration-150
          border
          ${trackWidth}
          ${checked 
            ? 'bg-blue-600 border-blue-600' 
            : 'bg-black/10 dark:bg-white/10 border-black/10 dark:border-white/10'
          }
        `}
      >
        <span
          className={`
            relative rounded-full bg-white shadow-xs
            transition-transform duration-150
            flex items-center justify-center
            ${thumbSize}
            ${checked ? translateDist : 'translate-x-0'}
          `}
        />
      </div>

      {label && (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
    </label>
  );
};
