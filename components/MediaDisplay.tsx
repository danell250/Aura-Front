import React from 'react';

interface AvatarProps {
  src?: string;
  type?: 'image' | 'video' | string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  type, 
  name, 
  size = 'md', 
  className = '', 
  onClick 
}) => {
  const isVideo = type === 'video' || (src && src.toLowerCase().match(/\.(mp4|webm|ogg|mov|gifv)$/) !== null);
  // const isGif = src && src.toLowerCase().match(/\.gif$/) !== null;

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-24 h-24 text-xl',
    custom: ''
  };

  const baseClasses = `relative overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase ${size !== 'custom' ? 'rounded-full' : ''} ${sizeClasses[size]} ${className}`;

  if (!src) {
    return (
      <div className={baseClasses} onClick={onClick}>
        {name ? name.charAt(0) : '?'}
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className={baseClasses} onClick={onClick}>
        <video 
          src={src} 
          className="w-full h-full object-cover" 
          autoPlay 
          loop 
          muted 
          playsInline 
        />
      </div>
    );
  }

  return (
    <div className={baseClasses} onClick={onClick}>
      <img 
        src={src} 
        alt={name} 
        className="w-full h-full object-cover" 
        loading="lazy"
      />
    </div>
  );
};

interface MediaDisplayProps {
  url: string;
  type?: 'image' | 'video' | string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  fallback?: React.ReactNode;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({ 
  url, 
  type, 
  className = '', 
  controls = false,
  autoPlay = true,
  fallback
}) => {
  if (!url) {
    if (fallback) return <>{fallback}</>; 
    return <div className={`bg-slate-100 dark:bg-slate-800 ${className}`} />;
  }

  const isVideo = type === 'video' || url.toLowerCase().match(/\.(mp4|webm|ogg|mov|gifv)$/) !== null;
  // const isGif = url.toLowerCase().match(/\.gif$/) !== null;

  if (isVideo) {
    return (
      <video 
        src={url} 
        className={className} 
        autoPlay={autoPlay} 
        loop 
        muted={!controls} 
        playsInline 
        controls={controls}
      />
    );
  }

  return (
    <img 
      src={url} 
      className={className} 
      alt="Media content" 
      loading="lazy" 
    />
  );
};