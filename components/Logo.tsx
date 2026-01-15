
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
        <div className="absolute inset-[3px] rounded-[1.3rem] bg-white flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-[72%] h-[72%] relative">
            <defs>
              <linearGradient id="auraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#auraGradient)" />
            <path
              d="M50 20C35 20 25 35 25 50C25 65 35 80 50 80C65 80 75 65 75 50C75 45 72 40 68 35C65 30 60 20 50 20ZM50 72C38 72 32 60 32 50C32 40 38 28 50 28C62 28 68 40 68 50C68 60 62 72 50 72Z"
              fill="white"
              opacity="0.8"
            />
            <circle cx="50" cy="50" r="4" fill="white" />
            <path
              d="M50 35 L50 38 M65 50 L62 50 M50 65 L50 62 M35 50 L38 50"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
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
