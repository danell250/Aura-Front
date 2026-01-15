
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 shadow-[0_18px_45px_rgba(16,185,129,0.65)]" />
        <div className="absolute inset-[3px] rounded-[1.3rem] bg-slate-950 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-teal-400/5 to-transparent" />
          <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] relative">
            <defs>
              <linearGradient id="auraMark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="50%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="30" fill="none" stroke="url(#auraMark)" strokeWidth="7" strokeLinecap="round" strokeDasharray="160 60" />
            <circle cx="50" cy="50" r="18" fill="none" stroke="url(#auraMark)" strokeWidth="5" strokeLinecap="round" strokeDasharray="60 120" opacity="0.85" />
            <circle cx="50" cy="34" r="4" fill="#a7f3d0" />
            <circle cx="66" cy="56" r="3.2" fill="#6ee7b7" />
          </svg>
        </div>
      </div>
      {showText && (
        <div className="text-left leading-tight">
          <div className="flex items-baseline gap-2">
            <span className={`${textSizes[size]} font-black tracking-tight text-slate-900 dark:text-white`}>
              Aura
            </span>
            <span className="text-[9px] uppercase tracking-[0.32em] text-emerald-500/90">
              Social
            </span>
          </div>
          <p className="mt-1 text-[9px] font-medium tracking-[0.22em] uppercase text-slate-400 dark:text-slate-500">
            Connect & Radiate
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;
