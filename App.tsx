
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from './components/Layout';
import PostCard from './components/PostCard';
import CreatePost from './components/CreatePost';
import BirthdayPost from './components/BirthdayPost';
import AdCard from './components/AdCard';
import Auth from './components/Auth';
import ProfileView from './components/ProfileView';
import ChatView from './components/ChatView';
import SettingsModal from './components/SettingsModal';
import AdManager from './components/AdManager';
import AcquaintancesView from './components/AcquaintancesView';
import DataAuraView from './components/DataAuraView';
import ShareModal from './components/ShareModal';
import CreditStoreModal from './components/CreditStoreModal';
import FeedFilters from './components/FeedFilters';
import Logo from './components/Logo';
import { INITIAL_POSTS, CURRENT_USER, INITIAL_ADS, MOCK_USERS, CREDIT_BUNDLES } from './constants';
import { Post, User, Ad, Notification, EnergyType, Comment, CreditBundle } from './types';
import { geminiService } from './services/gemini';
import { AdService } from './services/adService';

const STORAGE_KEY = 'aura_user_session';
const POSTS_KEY = 'aura_posts_data';
const ADS_KEY = 'aura_ads_data';
const USERS_KEY = 'aura_all_users';
const API_BASE_URL = 'https://aura-back-s1bw.onrender.com/api';

interface BirthdayAnnouncement {
  id: string;
  user: User;
  wish: string;
  reactions: Record<string, number>;
  userReactions: string[];
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [posts, setPosts] = useState<Post[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [birthdayAnnouncements, setBirthdayAnnouncements] = useState<BirthdayAnnouncement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEnergy, setActiveEnergy] = useState<EnergyType | 'all'>('all');
  const [activeMediaType, setActiveMediaType] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdManagerOpen, setIsAdManagerOpen] = useState(false);
  const [isCreditStoreOpen, setIsCreditStoreOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sharingContent, setSharingContent] = useState<{ content: string; url: string } | null>(null);
  
  const [view, setView] = useState<{type: 'feed' | 'profile' | 'chat' | 'acquaintances' | 'data_aura', targetId?: string}>({ type: 'feed' });

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
  }, [currentUser.acquaintances]);

  useEffect(() => {
    const savedUsers = localStorage.getItem(USERS_KEY);
    const usersToProcess = savedUsers ? JSON.parse(savedUsers) : MOCK_USERS;
    setAllUsers(usersToProcess);

    const savedSession = localStorage.getItem(STORAGE_KEY);
    let wasAuthenticated = false;
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        // Find user by ID in the latest users list to get fresh profile data (avatar etc)
        const refreshedUser = usersToProcess.find((u: User) => u.id === user.id) || user;
        setCurrentUser(refreshedUser);
        setIsAuthenticated(true);
        wasAuthenticated = true;
      } catch (e) { localStorage.removeItem(STORAGE_KEY); }
    }

    const savedPosts = localStorage.getItem(POSTS_KEY);
    setPosts(savedPosts ? JSON.parse(savedPosts) : INITIAL_POSTS);
    const savedAds = localStorage.getItem(ADS_KEY);
    setAds(savedAds ? JSON.parse(savedAds) : INITIAL_ADS);
    
    if (localStorage.getItem('aura_theme') === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      syncBirthdays(allUsers);
    }
  }, [isAuthenticated, allUsers, syncBirthdays]);

  useEffect(() => { if (posts.length > 0) localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); }, [posts]);
  useEffect(() => { if (ads.length > 0) localStorage.setItem(ADS_KEY, JSON.stringify(ads)); }, [ads]);
  useEffect(() => { localStorage.setItem(USERS_KEY, JSON.stringify(allUsers)); }, [allUsers]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('aura_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const handleLogin = (userData: any) => {
    // Search in all users (both initial mocks and newly registered ones)
    const existingUser = allUsers.find(u => 
      (userData.email && u.email.toLowerCase() === userData.email.toLowerCase()) || 
      (userData.handle && u.handle.toLowerCase() === userData.handle.toLowerCase()) || 
      (userData.id && u.id === userData.id)
    );

    if (existingUser) {
      setCurrentUser(existingUser);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingUser));
      syncBirthdays(allUsers);
      return;
    }

    const newUser: User = {
      id: userData.id || `user-${Date.now()}`, 
      ...userData,
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.firstName}${userData.lastName}${Date.now()}`,
      avatarType: 'image', 
      handle: userData.handle || ('@' + userData.firstName.toLowerCase().replace(/\s+/g, '') + userData.lastName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 100)),
      name: userData.name || `${userData.firstName} ${userData.lastName}`,
      acquaintances: ['1', '2', '3'], 
      blockedUsers: [], 
      trustScore: 10, 
      auraCredits: 50, 
      activeGlow: 'none'
    };
    
    // Update both state and localStorage consistently
    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    syncBirthdays(updatedUsers);
  };

  const handleUpdateProfile = (updates: Partial<User>) => {
    const updatedUser = { ...currentUser, ...updates };
    if (updates.firstName && updates.lastName) updatedUser.name = `${updates.firstName} ${updates.lastName}`;
    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  };

  const handlePost = (content: string, mediaUrl?: string, mediaType?: any, taggedUserIds?: string[], documentName?: string, energy?: EnergyType) => {
    const newPost: Post = {
      id: `p-${Date.now()}`, author: currentUser, content, mediaUrl, mediaType, energy: energy || EnergyType.NEUTRAL,
      radiance: 0, timestamp: Date.now(), reactions: {}, comments: [], userReactions: [], isBoosted: false
    };
    setPosts([newPost, ...posts]);
  };

  const handleDeletePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  const handleDeleteComment = useCallback((postId: string, commentId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: p.comments.filter(c => c.id !== commentId)
      };
    }));
  }, []);

  const handleLike = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const isPostInLikedSession = (p as any).sessionLiked || false;
      return { ...p, radiance: isPostInLikedSession ? Math.max(0, p.radiance - 1) : p.radiance + 1, sessionLiked: !isPostInLikedSession } as any;
    }));
  }, []);

  const handleBoostPost = useCallback((postId: string) => {
    const boostCost = 50;
    const isSpecialUser = currentUser.email?.toLowerCase() === 'danelloosthuizen3@gmail.com';
    
    if (!isSpecialUser && currentUser.auraCredits < boostCost) {
      setIsCreditStoreOpen(true);
      return;
    }
    
    if (!isSpecialUser) {
      handleUpdateProfile({ auraCredits: currentUser.auraCredits - boostCost });
    }
    
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, radiance: p.radiance + 100, isBoosted: true } : p));
  }, [currentUser.auraCredits, currentUser.email]);

  const handleBoostUser = useCallback((userId: string) => {
    const boostCost = 200;
    const isSpecialUser = currentUser.email?.toLowerCase() === 'danelloosthuizen3@gmail.com';

    if (!isSpecialUser && currentUser.auraCredits < boostCost) {
      setIsCreditStoreOpen(true);
      return;
    }
    
    if (!isSpecialUser) {
      handleUpdateProfile({ auraCredits: currentUser.auraCredits - boostCost });
    }
    
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, trustScore: Math.min(100, u.trustScore + 10), auraCredits: u.auraCredits + 50 } : u));
  }, [currentUser.auraCredits, currentUser.email]);

  const handleAdCreated = useCallback(async (ad: Ad) => {
    // Ensure ad is active immediately so it shows in feed
    const newAd = { ...ad, status: 'active' };

    // Optimistically add to local state
    setAds(prev => [newAd, ...prev]);

    // Save to backend
    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const response = await fetch(`${API_BASE_URL}/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAd)
      });

      const result = await response.json();

      if (result.success) {
        // Replace local ad with data from backend
        setAds(prev => prev.map(a => a.id === ad.id ? { ...result.data, status: 'active' } : a));
        return true;
      } else {
        console.error('Failed to create ad on backend:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Failed to save ad to backend:', error);
      return false;
    }
  }, []);

  const handlePurchaseCredits = (bundle: CreditBundle) => {
    const updatedCredits = currentUser.auraCredits + bundle.credits;
    handleUpdateProfile({ auraCredits: updatedCredits });
  };

  const handleComment = useCallback((postId: string, text: string, parentId?: string) => {
    const newComment: Comment = { id: `c-${Date.now()}`, author: currentUser, text, timestamp: Date.now(), parentId, reactions: {}, userReactions: [] };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
  }, [currentUser]);

  const handleReact = useCallback((postId: string, reaction: string, targetType: 'post' | 'comment', commentId?: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      if (targetType === 'post') {
        const reactions = { ...p.reactions };
        const userReactions = [...(p.userReactions || [])];
        if (userReactions.includes(reaction)) {
          reactions[reaction] = Math.max(0, (reactions[reaction] || 1) - 1);
          if (reactions[reaction] === 0) delete reactions[reaction];
          userReactions.splice(userReactions.indexOf(reaction), 1);
        } else {
          reactions[reaction] = (reactions[reaction] || 0) + 1;
          userReactions.push(reaction);
        }
        return { ...p, reactions, userReactions };
      } else if (targetType === 'comment' && commentId) {
        const comments = p.comments.map(c => {
          if (c.id !== commentId) return c;
          const reactions = { ...(c.reactions || {}) };
          const userReactions = [...(c.userReactions || [])];
          if (userReactions.includes(reaction)) {
            reactions[reaction] = Math.max(0, (reactions[reaction] || 1) - 1);
            if (reactions[reaction] === 0) delete reactions[reaction];
            userReactions.splice(userReactions.indexOf(reaction), 1);
          } else {
            reactions[reaction] = (reactions[reaction] || 0) + 1;
            userReactions.push(reaction);
          }
          return { ...c, reactions, userReactions };
        });
        return { ...p, comments };
      }
      return p;
    }));
  }, []);

  const handleAddAcquaintance = useCallback((targetUser: User) => {
    if (currentUser.id === targetUser.id) return;
    
    // Check if a request was already sent to avoid duplicates
    if (notifications.some(n => n.type === 'connection_request' && n.fromUser.id === currentUser.id)) {
      return;
    }

    const newNotification: Notification = {
      id: `notif-conn-${Date.now()}`,
      type: 'connection_request',
      fromUser: currentUser,
      message: 'wants to connect with you',
      timestamp: Date.now(),
      isRead: false
    };

    // In a real app, this would be sent to the target user. 
    // Since this is a demo/mock, we'll simulate receiving it if it's not the currentUser sending to themselves.
    setNotifications(prev => [newNotification, ...prev]);
  }, [currentUser, notifications]);

  const handleAcceptConnection = useCallback((notification: Notification) => {
    const requesterId = notification.fromUser.id;
    
    // Update current user's acquaintances
    const updatedCurrentUser = {
      ...currentUser,
      acquaintances: Array.from(new Set([...(currentUser.acquaintances || []), requesterId]))
    };
    
    setCurrentUser(updatedCurrentUser);
    
    // Update allUsers to reflect connection on both sides
    setAllUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) return updatedCurrentUser;
      if (u.id === requesterId) {
        return {
          ...u,
          acquaintances: Array.from(new Set([...(u.acquaintances || []), currentUser.id]))
        };
      }
      return u;
    }));

    // Mark notification as read
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCurrentUser));
  }, [currentUser, allUsers]);

  const handleRemoveAcquaintance = useCallback((userId: string) => {
    const updatedAcquaintances = (currentUser.acquaintances || []).filter(id => id !== userId);
    const updatedUser = { ...currentUser, acquaintances: updatedAcquaintances };
    
    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) return updatedUser;
      if (u.id === userId) {
        return {
          ...u,
          acquaintances: (u.acquaintances || []).filter(id => id !== currentUser.id)
        };
      }
      return u;
    }));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  }, [currentUser]);

  const processedFeedItems = useMemo(() => {
    console.log("🔍 Processing feed items:", { 
      totalPosts: posts.length, 
      totalAds: ads.length, 
      activeAds: ads.filter(a => a.status === 'active').length,
      view: view.type,
      searchQuery,
      activeEnergy,
      activeMediaType
    });

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
    console.log("📢 Active ads to display:", activeAds.length, activeAds);
    
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

    // 2. Paid Ads (High Advantage) - Show ads regardless of filters
    if (view.type === 'feed' && activeAds.length > 0) {
      // Put some ads right at the top
      const topAdsCount = Math.min(2, activeAds.length);
      for(let i=0; i < topAdsCount; i++) {
        combined.push(activeAds[i]);
      }
      console.log("✅ Added", topAdsCount, "ads to top of feed");
    }

    // 3. Posts with interleaved ads
    let adIdx = (view.type === 'feed') ? Math.min(2, activeAds.length) : 0;
    sortedPosts.forEach((post, index) => {
      combined.push(post);
      // Inject ads every 2 posts for better advantage
      if (view.type === 'feed' && (index + 1) % 2 === 0 && adIdx < activeAds.length) {
        combined.push(activeAds[adIdx]);
        adIdx++;
      }
    });

    // Append remaining ads - Show ads regardless of filters
    if (view.type === 'feed') {
      while (adIdx < activeAds.length) { 
        combined.push(activeAds[adIdx]); 
        adIdx++; 
      }
    }

    console.log("📊 Final combined feed items:", combined.length, "items");
    return combined;
  }, [posts, ads, birthdayAnnouncements, view, searchQuery, activeEnergy, activeMediaType]);

  useEffect(() => {
    (window as any).handleAcceptConnection = handleAcceptConnection;
    return () => { delete (window as any).handleAcceptConnection; };
  }, [handleAcceptConnection]);

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 transition-colors"><Logo size="lg" className="animate-float" /></div>;
  if (!isAuthenticated) return <Auth onLogin={handleLogin} allUsers={allUsers} />;

  return (
    <Layout 
      activeView={view.type} searchQuery={searchQuery} onSearchChange={setSearchQuery} 
      onLogout={() => { setIsAuthenticated(false); localStorage.removeItem(STORAGE_KEY); }}
      currentUser={currentUser} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode}
      onStartCampaign={() => setIsAdManagerOpen(true)} onViewSettings={() => setIsSettingsOpen(true)} 
      onViewChat={(id) => setView({ type: 'chat', targetId: id })} 
      onViewFriends={() => setView({ type: 'acquaintances' })} onViewPrivacy={() => setView({ type: 'data_aura' })}
      onGoHome={() => { setView({ type: 'feed' }); setActiveEnergy('all'); setSearchQuery(''); }} 
      onViewProfile={(id) => setView({ type: 'profile', targetId: id })} 
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
                if ('wish' in item) return <BirthdayPost key={item.id} birthdayUser={item.user} quirkyWish={item.wish} birthdayPostId={item.id} reactions={item.reactions} userReactions={item.userReactions} onReact={(postId, reaction) => handleReact(postId, reaction, 'post')} onComment={handleComment} currentUser={currentUser} onViewProfile={(id) => setView({ type: 'profile', targetId: id })} />;
                return 'content' in item 
                  ? <PostCard key={item.id} post={item as Post} currentUser={currentUser} allUsers={allUsers} onLike={handleLike} onComment={handleComment} onReact={handleReact} onShare={(p) => setSharingContent({content: p.content, url: `p/${p.id}`})} onViewProfile={(id) => setView({ type: 'profile', targetId: id })} onSearchTag={setSearchQuery} onBoost={handleBoostPost} onDeletePost={handleDeletePost} onDeleteComment={handleDeleteComment} />
                  : <AdCard key={(item as Ad).id} ad={item as Ad} onReact={(id, react) => {}} onShare={(ad) => setSharingContent({content: ad.headline, url: `ad/${ad.id}`})} />
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
          onBack={() => setView({ type: 'feed' })} 
          onLike={handleLike} 
          onComment={handleComment} 
          onReact={handleReact} 
          onViewProfile={(id) => setView({ type: 'profile', targetId: id })} 
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
      {view.type === 'chat' && <ChatView currentUser={currentUser} acquaintances={allUsers.filter(u => currentUser.acquaintances?.includes(u.id))} onBack={() => setView({ type: 'feed' })} initialContactId={view.targetId} />}
      {view.type === 'acquaintances' && (
        <AcquaintancesView 
          currentUser={currentUser} 
          acquaintances={allUsers.filter(u => currentUser.acquaintances?.includes(u.id))} 
          onViewProfile={(id) => setView({ type: 'profile', targetId: id })} 
          onViewChat={(id) => setView({ type: 'chat', targetId: id })} 
          onRemoveAcquaintance={handleRemoveAcquaintance} 
          onBack={() => setView({ type: 'feed' })} 
        />
      )}
      {view.type === 'data_aura' && <DataAuraView currentUser={currentUser} allUsers={allUsers} posts={posts.filter(p => p.author.id === currentUser.id)} onBack={() => setView({ type: 'feed' })} onPurchaseGlow={(glow) => handleUpdateProfile({ activeGlow: glow })} onClearData={() => {}} onViewProfile={(id) => setView({ type: 'profile', targetId: id })} onOpenCreditStore={() => setIsCreditStoreOpen(true)} />}
      {isSettingsOpen && <SettingsModal currentUser={currentUser} onClose={() => setIsSettingsOpen(false)} onUpdate={handleUpdateProfile} />}
      {isAdManagerOpen && <AdManager currentUser={currentUser} ads={ads} onAdCreated={handleAdCreated} onAdCancelled={(id) => setAds(ads.filter(a => a.id !== id))} onClose={() => setIsAdManagerOpen(false)} />}
      {isCreditStoreOpen && <CreditStoreModal currentUser={currentUser} onCreditsPurchased={handlePurchaseCredits} onClose={() => setIsCreditStoreOpen(false)} />}
      {sharingContent && <ShareModal content={sharingContent.content} url={sharingContent.url} onClose={() => setSharingContent(null)} />}
    </Layout>
  );
};

export default App;
