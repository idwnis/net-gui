import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface LiquidGlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export const LiquidGlassModal: React.FC<LiquidGlassModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Clean Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog Window */}
      <div 
        className={`
          relative w-full ${maxWidth} my-auto sm:my-8
          bg-white dark:bg-[#12151f]
          border border-black/[0.1] dark:border-white/[0.12]
          shadow-xl shadow-black/10 dark:shadow-black/60
          rounded-2xl
          overflow-hidden z-10
          transition-all
        `}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-black/[0.07] dark:border-white/[0.08] flex items-center justify-between">
          <div className="min-w-0 pr-3">
            <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
