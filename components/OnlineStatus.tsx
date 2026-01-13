import React, { useState, useEffect } from 'react';
import { PrivacyService, OnlineStatus as OnlineStatusType } from '../services/privacyService';

interface OnlineStatusProps {
  userId: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({ 
  userId, 
  showText = false, 
  size = 'md',
  className = '' 
}) => {
  const [status, setStatus] = useState<OnlineStatusType | null>(null);
  const [loading, setLoading] = useState(true);

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm': return 'w-2 h-2';
      case 'lg': return 'w-4 h-4';
      default: return 'w-3 h-3';
    }
  };

  const getTextSize = (size: string) => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-base';
      default: return 'text-sm';
    }
  };

  useEffect(() => {
    loadOnlineStatus();
    
    // Set up polling to update status every 30 seconds
    const interval = setInterval(loadOnlineStatus, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const loadOnlineStatus = async () => {
    try {
      const result = await PrivacyService.getOnlineStatus(userId);
      if (result.success && result.data) {
        setStatus(result.data);
      }
    } catch (error) {
      console.error('Error loading online status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse ${getSizeClasses(size)}`} />
        {showText && (
          <span className="text-slate-400 dark:text-slate-500 text-sm animate-pulse">
            Loading...
          </span>
        )}
      </div>
    );
  }

  if (!status || !status.showStatus) {
    return null; // Don't show anything if user has disabled status visibility
  }

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Last seen unknown';
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastSeenDate.toLocaleDateString();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div 
          className={`rounded-full ${getSizeClasses(size)} ${
            status.isOnline 
              ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' 
              : 'bg-slate-400 dark:bg-slate-600'
          }`}
        />
        {status.isOnline && (
          <div 
            className={`absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75 ${getSizeClasses(size)}`}
          />
        )}
      </div>
      
      {showText && (
        <span className={`text-slate-600 dark:text-slate-400 ${getTextSize(size)}`}>
          {status.isOnline ? 'Online' : formatLastSeen(status.lastSeen)}
        </span>
      )}
    </div>
  );
};

export default OnlineStatus;