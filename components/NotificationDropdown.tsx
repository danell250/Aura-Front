
import React from 'react';
import { Notification } from '../types';

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onRead: (id: string) => void;
  onAccept?: (notification: Notification) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onClose, onRead, onAccept }) => {
  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(ts);
  };

  return (
    <div className="absolute right-0 mt-2 w-80 glass rounded-3xl border border-slate-200/50 shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Notifications</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
              onClick={() => notif.type !== 'acquaintance_request' && onRead(notif.id)}
              className={`p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
            >
              <img src={notif.fromUser.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 leading-tight">
                  <span className="font-bold">{notif.fromUser.name}</span> {notif.message}
                </p>
                {notif.type === 'acquaintance_request' && !notif.isRead && (
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
                        onRead(notif.id);
                      }}
                      className="px-3 py-1 bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      Ignore
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{formatDate(notif.timestamp)}</p>
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
