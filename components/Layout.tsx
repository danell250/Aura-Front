
import React, { useState, useEffect } from 'react';
import { APP_NAME } from '../constants';
import { User, Ad, Notification, Post } from '../types';
import Logo from './Logo';
import NotificationDropdown from './NotificationDropdown';
import SearchDropdown from './SearchDropdown';
import TrendingTopics from './TrendingTopics';
import { SearchResult } from '../services/searchService';
import { Avatar } from './MediaDisplay';

interface LayoutProps {
  children: React.ReactNode;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onLogout: () => void;
  currentUser: User;
  onGoHome: () => void;
  onViewProfile: (userId: string) => void;
  onViewChat: (userId?: string) => void;
  onViewFriends: () => void;
  onViewSettings: () => void;
  onViewPrivacy: () => void;
  onStartCampaign: () => void;
  onViewAdManager: () => void;
  onOpenCreditStore: () => void;
  ads: Ad[];
  posts: Post[];
  users: User[];
  notifications: Notification[];
  activeView: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSearchResult?: (result: SearchResult) => void;
  onSearchTag?: (hashtag: string) => void;
  onOpenMessaging?: () => void;
  onReadNotification?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onAcceptAcquaintance?: (notification: Notification) => void;
  onRejectAcquaintance?: (notification: Notification) => void;
  onNavigateNotification?: (notification: Notification) => void;
  unreadMessageCount?: number;
  messagePulse?: boolean;
  unreadNotificationCount?: number;
  isNotificationSoundEnabled?: boolean;
  onToggleNotificationSound?: (enabled: boolean) => void;
  onRefreshNotifications?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, searchQuery, onSearchChange, onLogout, currentUser,
  onGoHome, onViewProfile, onViewChat, onViewFriends,
  onViewSettings, onViewPrivacy, onStartCampaign, onViewAdManager, onOpenCreditStore, ads, posts, users, notifications,
  activeView, isDarkMode, onToggleDarkMode, onSearchResult, onSearchTag, onOpenMessaging,
  onReadNotification, onMarkAllNotificationsRead, onAcceptAcquaintance, onRejectAcquaintance, onNavigateNotification, unreadMessageCount = 0, messagePulse = false, unreadNotificationCount, isNotificationSoundEnabled = true, onToggleNotificationSound, onRefreshNotifications
}) => {
  const unreadCount = typeof unreadNotificationCount === 'number' ? unreadNotificationCount : notifications.filter(n => !n.isRead).length;
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showUnreadBadge, setShowUnreadBadge] = useState(unreadCount > 0);

  useEffect(() => {
    if (unreadCount > 0) {
      setShowUnreadBadge(true);
    }
  }, [unreadCount]);

  // Keyboard shortcut for search focus (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        // Focus the search input
        const searchInput = document.querySelector('input[placeholder*="Search Aura Network"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="pt-16 min-h-screen flex flex-col bg-[#FDFDFD] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 h-16 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onGoHome}>
          <Logo showText={false} size="sm" />
          <h1 className="text-lg font-bold text-slate-900 dark:text-white hidden sm:block tracking-tight">{APP_NAME}</h1>
        </div>

        <div className="flex-1 max-w-xl mx-12 hidden md:block">
          <SearchDropdown
            posts={posts}
            users={users}
            ads={ads}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onSelectResult={(result) => {
              if (onSearchResult) {
                onSearchResult(result);
              }
            }}
            placeholder="Search Aura Network... (⌘K)"
            userId={currentUser.id}
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Mobile Search Button */}
          <button 
            onClick={() => {
              const searchInput = document.querySelector('input[placeholder*="Search Aura Network"]') as HTMLInputElement;
              if (searchInput) {
                searchInput.focus();
                searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className="md:hidden p-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Open search"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          <button onClick={onToggleDarkMode} className="p-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <div className="relative">
            <button onClick={() => onOpenMessaging ? onOpenMessaging() : onViewChat()} className={`p-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors relative ${messagePulse ? 'animate-pulse' : ''}`}>
              💬
              {unreadMessageCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-[9px] text-white flex items-center justify-center rounded-full font-bold ring-2 ring-white dark:ring-slate-900">
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
              {messagePulse && (
                <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 rounded-full bg-rose-400 opacity-75 animate-ping"></span>
              )}
            </button>
          </div>
          <div className="relative">
            <button 
              onClick={() => {
                const nextOpen = !isNotificationsOpen;
                setIsNotificationsOpen(nextOpen);
                if (nextOpen && onRefreshNotifications) {
                  onRefreshNotifications();
                }
                setShowUnreadBadge(false);
              }}
              className="p-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg relative transition-colors"
            >
              🔔 {showUnreadBadge && unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 text-[9px] text-white flex items-center justify-center rounded-full font-bold ring-2 ring-white dark:ring-slate-900">{unreadCount}</span>}
            </button>
            {isNotificationsOpen && (
              <NotificationDropdown 
                notifications={notifications} 
                onClose={() => setIsNotificationsOpen(false)} 
                onRead={onReadNotification || (() => {})}
                onAccept={onAcceptAcquaintance}
                onReject={onRejectAcquaintance}
                onNavigate={onNavigateNotification}
                isSoundEnabled={isNotificationSoundEnabled}
                onToggleSound={onToggleNotificationSound}
                onMarkAllRead={onMarkAllNotificationsRead}
              />
            )}
          </div>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
          <div onClick={() => onViewProfile(currentUser.id)} className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 cursor-pointer hover:ring-emerald-500/50 transition-all bg-slate-50 dark:bg-slate-800">
             <Avatar 
               src={currentUser.avatar} 
               type={currentUser.avatarType} 
               name={currentUser.firstName} 
               size="custom"
               className="w-full h-full"
             />
          </div>
        </div>
      </header>

      {/* Mobile Search Bar */}
      <div className="md:hidden sticky top-16 z-40 px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <SearchDropdown
          posts={posts}
          users={users}
          ads={ads}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onSelectResult={(result) => {
            if (onSearchResult) {
              onSearchResult(result);
            }
          }}
          placeholder="Search Aura Network..."
          userId={currentUser.id}
        />
      </div>

      <div className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-4 py-6 sm:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
        <aside className="hidden lg:flex flex-col w-64 space-y-6 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar pb-10">
          <button
            onClick={() => onViewProfile(currentUser.id)}
            className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-emerald-400/60 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all cursor-pointer shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shrink-0">
              <Avatar
                src={currentUser.avatar}
                type={currentUser.avatarType}
                name={currentUser.name}
                size="custom"
                className="w-full h-full"
              />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {currentUser.name}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                View Profile
              </span>
            </div>
          </button>
          <nav className="space-y-2">
            <NavItem label="Home Feed" onClick={onGoHome} active={activeView === 'feed'} />
            <NavItem label="Credit Hub" onClick={onOpenCreditStore} active={activeView === 'credits'} isAction />
            <NavItem label="Ad Plans" onClick={onStartCampaign} active={false} />
            <NavItem label="Ad Manager" onClick={onViewAdManager} active={activeView === 'ad_manager'} />
            <NavItem label="Acquaintances" onClick={onViewFriends} active={activeView === 'acquaintances'} />
            <NavItem label="Privacy & Data" onClick={onViewPrivacy} active={activeView === 'data_aura'} />
          </nav>
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <NavItem label="Log Out" onClick={onLogout} />
          </div>
        </aside>

        <main className="flex-1 min-w-0 max-w-full lg:max-w-3xl mx-auto lg:mx-0 w-full">{children}</main>

        <aside className="hidden xl:flex flex-col w-80 space-y-6 sticky top-28 self-start max-h-[calc(100vh-8rem)] sidebar-scroll">
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Neural Credits
              </h3>
            </div>
            
            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2 transition-all duration-300">
                {currentUser?.auraCredits?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Amplify your professional presence and boost your reach across the network
              </p>
            </div>
            
            <button 
              onClick={onOpenCreditStore} 
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Boost Your Reach
            </button>
            
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Post Boosts</span>
                <span>Profile Visibility</span>
                <span>Ad Campaigns</span>
              </div>
            </div>
          </div>

          <TrendingTopics 
            posts={posts} 
            ads={ads} 
            onHashtagClick={(hashtag) => {
              if (onSearchTag) {
                onSearchTag(hashtag);
              }
            }}
          />
        </aside>
      </div>
    </div>
  );
};

const NavItem = ({ label, icon, active, onClick, isAction }: any) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-xl transition-all duration-200 group ${active ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold' : isAction ? 'text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>
    {icon && <span className={`text-lg transition-transform group-hover:scale-110 ${active ? 'scale-110' : ''}`}>{icon}</span>}
    <span className={`text-sm tracking-tight ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
  </button>
);

export default Layout;
