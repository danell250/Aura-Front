
import React from 'react';
import { APP_NAME } from '../constants';
import { User, Ad, Notification } from '../types';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onLogout: () => void;
  currentUser: User;
  onGoHome: () => void;
  onViewProfile: (userId: string) => void;
  onViewChat: (userId?: string) => void;
  onViewFriends: () => void;
  onViewSettings: () => void;
  onViewPrivacy: () => void;
  onStartCampaign: () => void;
  onOpenCreditStore?: () => void;
  ads: Ad[];
  notifications: Notification[];
  activeView: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, searchQuery, onSearchChange, onLogout, currentUser,
  onGoHome, onViewProfile, onViewChat, onViewFriends,
  onViewSettings, onViewPrivacy, onStartCampaign, onOpenCreditStore, ads, notifications,
  activeView, isDarkMode, onToggleDarkMode
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderMedia = (url: string, type: 'image' | 'video' | undefined, className: string) => {
    if (!url) return <div className={`${className} bg-slate-200 dark:bg-slate-800`}></div>;
    const isVideo = type === 'video' || url.toLowerCase().match(/\.(mp4|webm|ogg|mov|gifv)$/) !== null;
    const isGif = url.toLowerCase().match(/\.gif$/) !== null;
    const objectClass = "object-contain bg-slate-50 dark:bg-slate-800";
    if (isVideo) {
      return (
        <video key={`header-video-${url}`} src={url} className={`${className} ${objectClass} w-full h-full`} autoPlay loop muted playsInline preload="auto" />
      );
    }
    return (
      <img key={`header-img-${url}`} src={url} className={`${className} ${objectClass} w-full h-full`} alt="" loading="eager" unoptimized={isGif ? "true" : undefined} />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-6 h-16 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onGoHome}>
          <Logo showText={false} size="sm" />
          <h1 className="text-lg font-bold text-slate-900 dark:text-white hidden sm:block tracking-tight">{APP_NAME}</h1>
        </div>

        <div className="flex-1 max-w-xl mx-12 hidden md:block">
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => onSearchChange(e.target.value)} 
              placeholder="Search Aura Network..." 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-6 py-2 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all text-sm font-medium outline-none" 
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={onToggleDarkMode} className="p-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">{isDarkMode ? '🌞' : '🌙'}</button>
          <button onClick={() => onViewChat()} className="p-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">✉️</button>
          <button className="p-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg relative transition-colors">🔔 {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 text-[9px] text-white flex items-center justify-center rounded-full font-bold ring-2 ring-white dark:ring-slate-900">{unreadCount}</span>}</button>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
          <div onClick={() => onViewProfile(currentUser.id)} className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 cursor-pointer hover:ring-emerald-500/50 transition-all bg-slate-50 dark:bg-slate-800">
             {renderMedia(currentUser.avatar, currentUser.avatarType, "w-full h-full")}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 py-8 flex gap-8">
        <aside className="hidden lg:flex flex-col w-64 space-y-6 sticky top-28 self-start max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar pb-10">
          <nav className="space-y-2">
            <NavItem label="Home Feed" icon="🏠" onClick={onGoHome} active={activeView === 'feed'} />
            <NavItem label="Credit Hub" icon="💎" onClick={onOpenCreditStore} active={activeView === 'credits'} isAction />
            <NavItem label="Ad Manager" icon="📢" onClick={onStartCampaign} active={activeView === 'ad_manager'} />
            <NavItem label="Connections" icon="🤝" onClick={onViewFriends} active={activeView === 'acquaintances'} />
            <NavItem label="Privacy & Data" icon="🧠" onClick={onViewPrivacy} active={activeView === 'data_aura'} />
          </nav>
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <NavItem label="Settings" icon="⚙️" onClick={onViewSettings} active={activeView === 'settings'} />
            <NavItem label="Log Out" icon="🚪" onClick={onLogout} />
          </div>
        </aside>

        <main className="flex-1 min-w-0 max-w-3xl mx-auto lg:mx-0">{children}</main>

        <aside className="hidden xl:flex flex-col w-80 space-y-8 sticky top-28 self-start">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">Neural Credits</h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white">💎 {currentUser.auraCredits.toLocaleString()}</p>
            <button onClick={onOpenCreditStore} className="mt-6 w-full py-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-black uppercase text-[10px] tracking-widest rounded-2xl border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">Sync Credits</button>
          </div>
          
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white overflow-hidden relative group cursor-pointer" onClick={onOpenCreditStore}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
            <h4 className="text-xs font-black uppercase tracking-widest mb-3 relative z-10">Expand Your Reach</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-6 relative z-10 font-medium">Use credits to boost your presence and illuminate your professional profile.</p>
            <span className="text-[10px] font-black uppercase text-emerald-400 group-hover:text-emerald-300 transition-colors relative z-10 flex items-center gap-2">Buy Credits <span className="translate-x-0 group-hover:translate-x-2 transition-transform">→</span></span>
          </div>
        </aside>
      </div>
    </div>
  );
};

const NavItem = ({ label, icon, active, onClick, isAction }: any) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-xl transition-all duration-200 group ${active ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold' : isAction ? 'text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>
    <span className={`text-lg transition-transform group-hover:scale-110 ${active ? 'scale-110' : ''}`}>{icon}</span>
    <span className={`text-sm tracking-tight ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
  </button>
);

export default Layout;
