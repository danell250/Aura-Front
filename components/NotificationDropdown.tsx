
import React from 'react';
import { Notification } from '../types';
import { Avatar } from './MediaDisplay';

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onRead: (id: string) => void;
  onAccept?: (notification: Notification) => void;
  onReject?: (notification: Notification) => void;
  onNavigate?: (notification: Notification) => void;
  isSoundEnabled?: boolean;
  onToggleSound?: (enabled: boolean) => void;
  onMarkAllRead?: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onClose, onRead, onAccept, onReject, onNavigate, isSoundEnabled = true, onToggleSound, onMarkAllRead }) => {
  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(ts);
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log('[Notification] Clicked notification:', notification.type, notification);
    if (!notification.isRead) {
      onRead(notification.id);
    }
    
    if (notification.type !== 'acquaintance_request' && notification.type !== 'connection_request' && onNavigate) {
      console.log('[NotificationDropdown] Calling onNavigate with notification:', notification);
      onNavigate(notification);
      onClose();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reaction':
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'boost_received':
        return '🚀';
      case 'acquaintance_request':
      case 'connection_request':
        return '🤝';
      case 'acquaintance_accepted':
        return '✅';
      case 'acquaintance_rejected':
        return '❌';
      case 'profile_view':
        return '👁️';
      case 'time_capsule_invite':
      case 'time_capsule_unlocked':
        return '⏰';
      case 'credit_received':
        return '💰';
      case 'message':
        return '📩';
      case 'share':
        return '🔄';
      default:
        return '🔔';
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.35)] z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Notifications</h3>
        <div className="flex items-center gap-2">
          {onMarkAllRead && notifications.some(n => !n.isRead) && (
            <button
              onClick={onMarkAllRead}
              className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={() => onToggleSound && onToggleSound(!isSoundEnabled)}
            className={`p-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-colors ${isSoundEnabled ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
            aria-label={isSoundEnabled ? 'Mute notification sounds' : 'Unmute notification sounds'}
          >
            {isSoundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto no-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic text-sm">
            No signals in your orbit yet.
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0 ${!notif.isRead ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
            >
              <div className="relative">
                <Avatar
                  src={notif.fromUser.avatar}
                  type={notif.fromUser.avatarType}
                  name={notif.fromUser.name}
                  size="custom"
                  className="w-10 h-10 rounded-xl"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-xs border border-slate-200 dark:border-slate-700">
                  {getNotificationIcon(notif.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-tight">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!notif.isRead) {
                        onRead(notif.id);
                      }
                      if (onNavigate) {
                        console.log('[NotificationDropdown] Name click navigation for:', notif.type, notif);
                        onNavigate(notif);
                      }
                      onClose();
                    }}
                    className="font-bold hover:text-emerald-600 dark:hover:text-emerald-400"
                  >
                    {notif.fromUser.name}
                  </button>{' '}
                  {notif.message}
                </p>
                {(notif.type === 'acquaintance_request' || notif.type === 'connection_request') && !notif.isRead && (
                  <div className="mt-2 flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onAccept) onAccept(notif);
                      }}
                      className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm hover:bg-emerald-600 transition-colors"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onReject) onReject(notif);
                      }}
                      className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm hover:bg-rose-600 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase">{formatDate(notif.timestamp)}</p>
              </div>
              {!notif.isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
