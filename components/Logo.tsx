
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
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizes[size]} relative`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="auraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#auraGradient)" />
          <path 
            d="M50 25C36.2 25 25 36.2 25 50C25 63.8 36.2 75 50 75C63.8 75 75 63.8 75 50C75 45.4 72.2 40.8 68.5 36.2C65.7 31.6 61.1 25 50 25ZM50 67.5C40.3 67.5 32.5 59.7 32.5 50C32.5 40.3 40.3 32.5 50 32.5C59.7 32.5 67.5 40.3 67.5 50C67.5 59.7 59.7 67.5 50 67.5Z" 
            fill="white" 
            opacity="0.9"
          />
          <circle cx="50" cy="50" r="3.5" fill="white" />
        </svg>
      </div>
      {showText && (
        <div className="text-left">
          <h1 className={`${textSizes[size]} font-bold tracking-tight text-slate-900 dark:text-white leading-none`}>
            Aura
          </h1>
        </div>
      )}
    </div>
  );
};

export default Logo;
