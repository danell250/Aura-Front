import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from './Layout';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import BirthdayPost from './BirthdayPost';
import AdCard from './AdCard';
import Auth from './Auth';
import ProfileView from './ProfileView';
import ChatView from './ChatView';
import SettingsModal from './SettingsModal';
import AdManager from './AdManager';
import AcquaintancesView from './AcquaintancesView';
import DataAuraView from './DataAuraView';
import ShareModal from './ShareModal';
import CreditStoreModal from './CreditStoreModal';
import FeedFilters from './FeedFilters';
import Logo from './Logo';
import { useMetaTags } from '../hooks/useMetaTags';
import { INITIAL_POSTS, CURRENT_USER, INITIAL_ADS, MOCK_USERS, CREDIT_BUNDLES } from '../constants';
import { Post, User, Ad, Notification, EnergyType, Comment, CreditBundle } from '../types';
import { geminiService } from '../services/gemini';

const STORAGE_KEY = 'aura_user_session';
const POSTS_KEY = 'aura_posts_data';
const ADS_KEY = 'aura_ads_data';
const USERS_KEY = 'aura_all_users';

interface BirthdayAnnouncement {
  id: string;
  user: User;
  wish: string;
  reactions: Record<string, number>;
  userReactions: string[];
}

interface AppContentProps {
  isAuthenticated: boolean;
  currentUser: User;
  allUsers: User[];
  posts: Post[];
  ads: Ad[];
  birthdayAnnouncements: BirthdayAnnouncement[];
  notifications: Notification[];
  loading: boolean;
  searchQuery: string;
  activeEnergy: EnergyType | 'all';
  activeMediaType: 'all' | 'image' | 'video' | 'document';
  isSettingsOpen: boolean;
  isAdManagerOpen: boolean;
  isCreditStoreOpen: boolean;
  isDarkMode: boolean;
  sharingContent: { content: string; url: string; title?: string } | null;
  view: {type: 'feed' | 'profile' | 'chat' | 'acquaintances' | 'data_aura', targetId?: string};
  setIsAuthenticated: (value: boolean) => void;
  setCurrentUser: (user: User) => void;
  setAllUsers: (users: User[]) => void;
  setPosts: (posts: Post[]) => void;
  setAds: (ads: Ad[]) => void;
  setBirthdayAnnouncements: (announcements: BirthdayAnnouncement[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setActiveEnergy: (energy: EnergyType | 'all') => void;
  setActiveMediaType: (type: 'all' | 'image' | 'video' | 'document') => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsAdManagerOpen: (open: boolean) => void;
  setIsCreditStoreOpen: (open: boolean) => void;
  setIsDarkMode: (dark: boolean) => void;
  setSharingContent: (content: { content: string; url: string; title?: string } | null) => void;
  setView: (view: {type: 'feed' | 'profile' | 'chat' | 'acquaintances' | 'data_aura', targetId?: string}) => void;
  handleLogin: (userData: any) => void;
  handleUpdateProfile: (updates: Partial<User>) => void;
  handlePost: (content: string, mediaUrl?: string, mediaType?: any, taggedUserIds?: string[], documentName?: string, energy?: EnergyType) => void;
  handleDeletePost: (postId: string) => void;
  handleDeleteComment: (postId: string, commentId: string) => void;
  handleLike: (postId: string) => void;
  handleBoostPost: (postId: string) => void;
  handleBoostUser: (userId: string) => void;
  handleComment: (postId: string, text: string, parentId?: string) => void;
  handleReact: (postId: string, reaction: string, targetType: 'post' | 'comment', commentId?: string) => void;
  handleAddAcquaintance: (targetUser: User) => void;
  handleAcceptConnection: (notification: Notification) => void;
  handleRemoveAcquaintance: (userId: string) => void;
  handlePurchaseCredits: (bundle: CreditBundle) => void;
  toggleDarkMode: () => void;
}

const AppContent: React.FC<AppContentProps> = ({
  isAuthenticated, currentUser, allUsers, posts, ads, birthdayAnnouncements, notifications, loading,
  searchQuery, activeEnergy, activeMediaType, isSettingsOpen, isAdManagerOpen, isCreditStoreOpen,
  isDarkMode, sharingContent, view, setIsAuthenticated, setCurrentUser, setAllUsers, setPosts,
  setAds, setBirthdayAnnouncements, setNotifications, setLoading, setSearchQuery, setActiveEnergy,
  setActiveMediaType, setIsSettingsOpen, setIsAdManagerOpen, setIsCreditStoreOpen, setIsDarkMode,
  setSharingContent, setView, handleLogin, handleUpdateProfile, handlePost, handleDeletePost,
  handleDeleteComment, handleLike, handleBoostPost, handleBoostUser, handleComment, handleReact,
  handleAddAcquaintance, handleAcceptConnection, handleRemoveAcquaintance, handlePurchaseCredits,
  toggleDarkMode
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Set up meta tags for the current page
  const getMetaInfo = useCallback(() => {
    const baseUrl = 'https://auraradiance.netlify.app';
    
    if (view.type === 'profile' && view.targetId) {
      const profileUser = allUsers.find(u => u.id === view.targetId) || currentUser;
      return {
        title: `${profileUser.name} | Aura Profile`,
        description: `Connect with ${profileUser.name} on Aura - ${profileUser.bio || 'Professional social network'}`,
        url: `${baseUrl}/profile/${view.targetId}`,
        type: 'profile' as const
      };
    }
    
    if (sharingContent) {
      return {
        title: sharingContent.title || 'Post on Aura',
        description: sharingContent.content,
        url: `${baseUrl}/${sharingContent.url}`,
        type: 'article' as const
      };
    }
    
    return {
      title: 'Aura | Connect & Radiate',
      description: 'Establish your professional frequency on Aura, the world\'s most elegant social network. Connect, radiate, and broadcast your professional pulse.',
      url: baseUrl,
      type: 'website' as const
    };
  }, [view, sharingContent, allUsers, currentUser]);

  useMetaTags(getMetaInfo());

  // Handle URL-based routing
  useEffect(() => {
    const path = location.pathname;
    
    if (path.startsWith('/post/') && isAuthenticated) {
      const postId = path.split('/')[2];
      const post = posts.find(p => p.id === postId);
      if (post) {
        setSharingContent({
          content: post.content,
          url: `post/${postId}`,
          title: `${post.author.name} on Aura`
        });
        // Navigate to feed and highlight the post
        setView({ type: 'feed' });
      }
    } else if (path.startsWith('/profile/') && isAuthenticated) {
      const userId = path.split('/')[2];
      setView({ type: 'profile', targetId: userId });
    } else if (path === '/' && isAuthenticated) {
      setView({ type: 'feed' });
    }
  }, [location.pathname, isAuthenticated, posts, setView, setSharingContent]);

  const syncBirthdays = useCallback(async (users: User[]) => {
    const today = new Date();
    const mmToday = today.getMonth();
    const ddToday = today.getDate();
    const acquaintances = users.filter(u => currentUser.acquaintances?.includes(u.id));
    const birthdayPeeps = acquaintances.filter(u => {
      if (!u.dob) return false;
      const d = new Date(u.dob);
      return d.getMonth() === mmToday && d.getDate() === ddToday;
    });
    
    // Check if it's currentUser's birthday too
    if (currentUser.dob) {
      const d = new Date(currentUser.dob);
      if (d.getMonth() === mmToday && d.getDate() === ddToday) {
        birthdayPeeps.push(currentUser);
      }
    }

    const announcements: BirthdayAnnouncement[] = [];
    for (const person of birthdayPeeps) {
      const quirkyWish = await geminiService.generateQuirkyBirthdayWish(person.firstName, person.bio);
      announcements.push({
        id: `bday-${person.id}-${today.getFullYear()}`,
        user: person, wish: quirkyWish, reactions: {}, userReactions: []
      });
    }
    setBirthdayAnnouncements(announcements);
  }, [currentUser.acquaintances, currentUser.dob, setBirthdayAnnouncements]);

  useEffect(() => {
    if (isAuthenticated) {
      syncBirthdays(allUsers);
    }
  }, [isAuthenticated, allUsers, syncBirthdays]);

  const processedFeedItems = useMemo(() => {
    // Apply filters first
    const filteredPosts = posts.filter(p => {
      const matchesSearch = p.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.author.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEnergy = activeEnergy === 'all' || p.energy === activeEnergy;
      const matchesMedia = activeMediaType === 'all' || p.mediaType === activeMediaType;
      return matchesSearch && matchesEnergy && matchesMedia;
    });

    // Sort: Paid Ads at top, then Boosted posts, then by Timestamp
    const activeAds = ads.filter(a => a.status === 'active');
    
    // Sort posts: Boosted first, then timestamp
    const sortedPosts = [...filteredPosts].sort((a, b) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return b.timestamp - a.timestamp;
    });

    const combined: (Post | Ad | BirthdayAnnouncement)[] = [];
    
    // 1. Birthdays (top)
    if (view.type === 'feed' && activeEnergy === 'all' && activeMediaType === 'all' && !searchQuery) {
      birthdayAnnouncements.forEach(bday => combined.push(bday));
    }

    // 2. Paid Ads (High Advantage)
    if (view.type === 'feed' && !searchQuery && activeAds.length > 0) {
      // Put some ads right at the top
      const topAdsCount = Math.min(2, activeAds.length);
      for(let i=0; i < topAdsCount; i++) {
        combined.push(activeAds[i]);
      }
    }

    // 3. Posts with interleaved ads
    let adIdx = (view.type === 'feed' && !searchQuery) ? Math.min(2, activeAds.length) : 0;
    sortedPosts.forEach((post, index) => {
      combined.push(post);
      // Inject ads every 2 posts for better advantage
      if (view.type === 'feed' && (index + 1) % 2 === 0 && adIdx < activeAds.length) {
        combined.push(activeAds[adIdx]);
        adIdx++;
      }
    });

    // Append remaining ads
    if (view.type === 'feed' && activeEnergy === 'all' && !searchQuery) {
      while (adIdx < activeAds.length) { 
        combined.push(activeAds[adIdx]); 
        adIdx++; 
      }
    }

    return combined;
  }, [posts, ads, birthdayAnnouncements, view, searchQuery, activeEnergy, activeMediaType]);

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 transition-colors"><Logo size="lg" className="animate-float" /></div>;
  if (!isAuthenticated) return <Auth onLogin={handleLogin} allUsers={allUsers} />;

  return (
    <Layout 
      activeView={view.type} searchQuery={searchQuery} onSearchChange={setSearchQuery} 
      onLogout={() => { setIsAuthenticated(false); localStorage.removeItem(STORAGE_KEY); }}
      currentUser={currentUser} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode}
      onStartCampaign={() => setIsAdManagerOpen(true)} onViewSettings={() => setIsSettingsOpen(true)} 
      onViewChat={(id) => { setView({ type: 'chat', targetId: id }); navigate(`/chat/${id}`); }} 
      onViewFriends={() => { setView({ type: 'acquaintances' }); navigate('/acquaintances'); }} 
      onViewPrivacy={() => { setView({ type: 'data_aura' }); navigate('/data-aura'); }}
      onGoHome={() => { setView({ type: 'feed' }); setActiveEnergy('all'); setSearchQuery(''); navigate('/'); }} 
      onViewProfile={(id) => { setView({ type: 'profile', targetId: id }); navigate(`/profile/${id}`); }} 
      ads={ads} notifications={notifications}
      onOpenCreditStore={() => setIsCreditStoreOpen(true)}
    >
      {view.type === 'feed' && (
        <div className="space-y-6">
          <CreatePost allUsers={allUsers} currentUser={currentUser} onPost={handlePost} />
          
          <FeedFilters 
            activeMediaType={activeMediaType}
            onMediaTypeChange={setActiveMediaType}
            activeEnergy={activeEnergy}
            onEnergyChange={setActiveEnergy}
            authors={[]}
            activeAuthorId="all"
            onAuthorChange={() => {}}
          />

          <div className="space-y-6 min-h-[500px]">
            {processedFeedItems.length === 0 ? (
               <div className="py-32 text-center bg-white dark:bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 animate-in fade-in duration-700">
                  <div className="text-6xl mb-6 opacity-20 grayscale">🪐</div>
                  <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">No Posts Found</h3>
                  <p className="text-[10px] font-bold uppercase text-slate-400 mt-2 tracking-[0.2em]">Adjust your filters to discover new updates.</p>
                  <button onClick={() => { setActiveEnergy('all'); setActiveMediaType('all'); setSearchQuery(''); }} className="mt-8 text-emerald-500 font-black uppercase text-[10px] tracking-widest hover:underline underline-offset-8">Reset Filter</button>
               </div>
            ) : (
              processedFeedItems.map((item) => {
                /* Fix: Wrap handleReact to satisfy BirthdayPost's onReact signature requiring only 2 arguments while passing targetType: 'post' internally. */
                if ('wish' in item) return <BirthdayPost key={item.id} birthdayUser={item.user} quirkyWish={item.wish} birthdayPostId={item.id} reactions={item.reactions} userReactions={item.userReactions} onReact={(postId, reaction) => handleReact(postId, reaction, 'post')} onComment={handleComment} currentUser={currentUser} onViewProfile={(id) => { setView({ type: 'profile', targetId: id }); navigate(`/profile/${id}`); }} />;
                return 'content' in item 
                  ? <PostCard key={item.id} post={item as Post} currentUser={currentUser} allUsers={allUsers} onLike={handleLike} onComment={handleComment} onReact={handleReact} onShare={(p) => { setSharingContent({content: p.content, url: `post/${p.id}`, title: `${p.author.name} on Aura`}); }} onViewProfile={(id) => { setView({ type: 'profile', targetId: id }); navigate(`/profile/${id}`); }} onSearchTag={setSearchQuery} onBoost={handleBoostPost} onDeletePost={handleDeletePost} onDeleteComment={handleDeleteComment} />
                  : <AdCard key={(item as Ad).id} ad={item as Ad} onReact={(id, react) => {}} onShare={(ad) => setSharingContent({content: ad.headline, url: `ad/${ad.id}`, title: `${ad.company} on Aura`})} />
              })
            )}
          </div>
        </div>
      )}
      {view.type === 'profile' && (
        <ProfileView 
          user={allUsers.find(u => u.id === (view.targetId || currentUser.id)) || currentUser} 
          posts={posts.filter(p => p.author.id === (view.targetId || currentUser.id))} 
          currentUser={currentUser} 
          allUsers={allUsers} 
          onBack={() => { setView({ type: 'feed' }); navigate('/'); }} 
          onLike={handleLike} 
          onComment={handleComment} 
          onReact={handleReact} 
          onViewProfile={(id) => { setView({ type: 'profile', targetId: id }); navigate(`/profile/${id}`); }} 
          onShare={() => {}} 
          onAddAcquaintance={handleAddAcquaintance} 
          onRemoveAcquaintance={handleRemoveAcquaintance} 
          onSearchTag={setSearchQuery} 
          onBoostPost={handleBoostPost} 
          onBoostUser={handleBoostUser} 
          onEditProfile={() => setIsSettingsOpen(true)} 
          onDeletePost={handleDeletePost} 
          onDeleteComment={handleDeleteComment} 
        />
      )}
      {view.type === 'chat' && <ChatView currentUser={currentUser} acquaintances={allUsers.filter(u => currentUser.acquaintances?.includes(u.id))} onBack={() => { setView({ type: 'feed' }); navigate('/'); }} initialContactId={view.targetId} />}
      {view.type === 'acquaintances' && (
        <AcquaintancesView 
          currentUser={currentUser} 
          acquaintances={allUsers.filter(u => currentUser.acquaintances?.includes(u.id))} 
          onViewProfile={(id) => { setView({ type: 'profile', targetId: id }); navigate(`/profile/${id}`); }} 
          onViewChat={(id) => { setView({ type: 'chat', targetId: id }); navigate(`/chat/${id}`); }} 
          onRemoveAcquaintance={handleRemoveAcquaintance} 
          onBack={() => { setView({ type: 'feed' }); navigate('/'); }} 
        />
      )}
      {view.type === 'data_aura' && <DataAuraView currentUser={currentUser} allUsers={allUsers} posts={posts.filter(p => p.author.id === currentUser.id)} onBack={() => { setView({ type: 'feed' }); navigate('/'); }} onPurchaseGlow={(glow) => handleUpdateProfile({ activeGlow: glow })} onClearData={() => {}} onViewProfile={(id) => { setView({ type: 'profile', targetId: id }); navigate(`/profile/${id}`); }} onOpenCreditStore={() => setIsCreditStoreOpen(true)} />}
      {isSettingsOpen && <SettingsModal currentUser={currentUser} onClose={() => setIsSettingsOpen(false)} onUpdate={handleUpdateProfile} />}
      {isAdManagerOpen && <AdManager currentUser={currentUser} ads={ads} onAdCreated={(ad) => setAds([ad, ...ads])} onAdCancelled={(id) => setAds(ads.filter(a => a.id !== id))} onClose={() => setIsAdManagerOpen(false)} />}
      {isCreditStoreOpen && <CreditStoreModal currentUser={currentUser} onCreditsPurchased={handlePurchaseCredits} onClose={() => setIsCreditStoreOpen(false)} />}
      {sharingContent && <ShareModal content={sharingContent.content} url={sharingContent.url} title={sharingContent.title} onClose={() => setSharingContent(null)} />}
    </Layout>
  );
};

export default AppContent;
