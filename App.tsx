import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from './components/Layout';
import PostCard from './components/PostCard';
import CreatePost from './components/CreatePost';
import BirthdayPost from './components/BirthdayPost';
import AdCard from './components/AdCard';
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
import Login from './components/Login';
import { INITIAL_POSTS, CURRENT_USER, INITIAL_ADS, MOCK_USERS, CREDIT_BUNDLES } from './constants';
import { Post, User, Ad, Notification, EnergyType, Comment, CreditBundle } from './types';
import { geminiService } from './services/gemini';
import { SearchResult } from './services/searchService';

const STORAGE_KEY = 'aura_user_session';
const POSTS_KEY = 'aura_posts_data';
const ADS_KEY = 'aura_ads_data';
const USERS_KEY = 'aura_all_users';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://aura-back-s1bw.onrender.com/api';

interface BirthdayAnnouncement {
  id: string;
  user: User;
  wish: string;
  reactions: Record<string, number>;
  userReactions: string[];
}

const App: React.FC = () => {
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [view, setView] = useState<{ type: 'feed' | 'profile' | 'chat' | 'acquaintances' | 'data_aura', targetId?: string }>({ type: 'feed' });

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

    // Periodically sync with backend/Firestore to get new users
    const syncUsers = async () => {
      try {
        const { UserService } = await import('./services/userService');
        const remoteUsersResult = await UserService.getAllUsers();
        if (remoteUsersResult.success && remoteUsersResult.users) {
          const localUserIds = new Set(usersToProcess.map((u: User) => u.id));
          const newUsers = remoteUsersResult.users.filter(u => !localUserIds.has(u.id));

          if (newUsers.length > 0) {
            const updatedUsers = [...usersToProcess, ...newUsers];
            setAllUsers(updatedUsers);
            try {
              localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
            } catch (e) {
              console.warn('Failed to persist users to localStorage (quota exceeded). Continuing without persist.', e);
            }
            console.log(`🔄 Synced ${newUsers.length} new users from backend/firestore`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not sync users from backend:', error);
      }
    };

    // Initial sync
    syncUsers();

    // Sync every 30 seconds
    const syncInterval = setInterval(syncUsers, 30000);

    const savedSession = localStorage.getItem(STORAGE_KEY);
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        // Refresh user data from the latest users list
        const refreshedUser = usersToProcess.find((u: User) => u.id === user.id) || user;
        setCurrentUser(refreshedUser);
        setIsAuthenticated(true);
      } catch (e) { localStorage.removeItem(STORAGE_KEY); }
    }

      const savedPosts = localStorage.getItem(POSTS_KEY);
      const savedAds = localStorage.getItem(ADS_KEY);

    setPosts(savedPosts ? JSON.parse(savedPosts) : INITIAL_POSTS);
    setAds(savedAds ? JSON.parse(savedAds) : INITIAL_ADS);
        setLoading(false);

    return () => {
      clearInterval(syncInterval);
    };
  }, []);

  useEffect(() => {
    syncBirthdays(allUsers);
  }, [allUsers, syncBirthdays]);

  // Sync current user data with backend periodically to ensure persistence
  useEffect(() => {
    if (!currentUser.id) return;

    const syncCurrentUser = async () => {
      try {
        const { UserService } = await import('./services/userService');
        const result = await UserService.getUserById(currentUser.id);
        if (result.success && result.user) {
          // Update current user with latest data from backend
          setCurrentUser(result.user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
        }
      } catch (error) {
        console.warn('⚠️ Could not sync current user from backend:', error);
      }
    };

    // Sync every minute
    const intervalId = setInterval(syncCurrentUser, 60000);

    // Also sync shortly after mount to catch any initial discrepancies
    const timeoutId = setTimeout(syncCurrentUser, 5000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [currentUser.id]);

  // Helper to sync view from current URL path
  const syncViewFromPath = useCallback(() => {
    const path = window.location.pathname || '/';
    if (path === '/login') {
      setView({ type: 'feed' });
        return;
      }

    if (path.startsWith('/post/')) {
      // Deep link to a specific post: keep user on feed view
      setView({ type: 'feed' });
      return;
    }

    if (path.startsWith('/profile/')) {
      const userId = path.split('/')[2];
      setView({ type: 'profile', targetId: userId });
    } else if (path.startsWith('/acquaintances')) {
      setView({ type: 'acquaintances' });
    } else if (path.startsWith('/data-aura')) {
      setView({ type: 'data_aura' });
    } else if (path.startsWith('/chat')) {
      const userId = path.split('/')[2];
      setView({ type: 'chat', targetId: userId });
    } else {
      setView({ type: 'feed' });
    }
  }, []);

  // Initialize view from URL once authenticated
  useEffect(() => {
    if (loading || !isAuthenticated) return;
    syncViewFromPath();
  }, [loading, isAuthenticated, syncViewFromPath]);

  // Handle browser back/forward
  useEffect(() => {
    const handler = () => {
      if (!isAuthenticated) return;
      syncViewFromPath();
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [isAuthenticated, syncViewFromPath]);

  useEffect(() => { if (posts.length > 0) localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); }, [posts]);
  useEffect(() => { if (ads.length > 0) localStorage.setItem(ADS_KEY, JSON.stringify(ads)); }, [ads]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handlePost = (content: string, mediaUrl?: string, mediaType?: any, taggedUserIds?: string[], documentName?: string, energy?: EnergyType) => {
    const newPost: Post = {
      id: `p-${Date.now()}`, author: currentUser, content, mediaUrl, mediaType, energy: energy || EnergyType.NEUTRAL,
      taggedUserIds: taggedUserIds || [],
      radiance: 0, timestamp: Date.now(), reactions: {}, comments: [], userReactions: [], isBoosted: false
    };
    setPosts([newPost, ...posts]);
  };

  const handleTimeCapsule = useCallback((data: any) => {
    const newPost: Post = {
      id: `tc-${Date.now()}`,
      author: currentUser,
      content: data.timeCapsuleTitle ? `${data.timeCapsuleTitle}: ${data.content}` : data.content,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      energy: data.energy || EnergyType.NEUTRAL,
      radiance: 0,
      timestamp: Date.now(),
      reactions: {},
      comments: [],
      userReactions: [],
      isBoosted: false,
      isTimeCapsule: true,
      unlockDate: data.unlockDate,
      isUnlocked: Date.now() >= (data.unlockDate || 0),
      timeCapsuleType: data.timeCapsuleType,
      invitedUsers: data.invitedUsers,
      timeCapsuleTitle: data.timeCapsuleTitle
    };
    setPosts([newPost, ...posts]);
  }, [currentUser, posts]);

  const handleGenerateAIContent = useCallback(async (prompt: string) => {
    return geminiService.generateContent(prompt);
  }, []);

  const handleReaction = useCallback((postId: string, emoji: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newReactions = { ...p.reactions };
        const newUserReactions = [...p.userReactions];

        if (newUserReactions.includes(emoji)) {
          newReactions[emoji] = Math.max(0, (newReactions[emoji] || 0) - 1);
          const index = newUserReactions.indexOf(emoji);
          newUserReactions.splice(index, 1);
        } else {
          newReactions[emoji] = (newReactions[emoji] || 0) + 1;
          newUserReactions.push(emoji);
        }

        return { ...p, reactions: newReactions, userReactions: newUserReactions };
      }
      return p;
    }));
  }, []);

  const handleCommentReaction = useCallback((postId: string, commentId: string, emoji: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newComments = p.comments.map(c => {
          if (c.id === commentId) {
            const newReactions = { ...c.reactions };
            const newUserReactions = [...c.userReactions];

            if (newUserReactions.includes(emoji)) {
              newReactions[emoji] = Math.max(0, (newReactions[emoji] || 0) - 1);
              const index = newUserReactions.indexOf(emoji);
              newUserReactions.splice(index, 1);
            } else {
              newReactions[emoji] = (newReactions[emoji] || 0) + 1;
              newUserReactions.push(emoji);
            }

            return { ...c, reactions: newReactions, userReactions: newUserReactions };
          }
          return c;
        });
        return { ...p, comments: newComments };
      }
      return p;
    }));
  }, []);

  const handleComment = useCallback((postId: string, text: string, parentId?: string) => {
    const newComment: Comment = { id: `c-${Date.now()}`, author: currentUser, text, timestamp: Date.now(), parentId, reactions: {}, userReactions: [] };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
  }, [currentUser]);

  const handleBoost = useCallback((postId: string, creditsToSpend: number) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, radiance: p.radiance + (creditsToSpend * 2), isBoosted: true };
      }
      return p;
    }));

    setCurrentUser(prev => ({
      ...prev,
      auraCredits: (prev.auraCredits || 0) - creditsToSpend
    }));
  }, []);

  const handleUpdateProfile = useCallback((updates: Partial<User>) => {
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

    // Update in all users list
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  }, [currentUser]);

  const handleSendConnectionRequest = useCallback(async (targetUserId: string) => {
    try {
      const { UserService } = await import('./services/userService');
      const result = await UserService.sendConnectionRequest(currentUser.id, targetUserId);

      if (result.success) {
        console.log('✅ Connection request sent successfully');
        // The backend will create the notification for the target user
      } else {
        console.warn('⚠️ Failed to send connection request:', result.error);
      }
    } catch (error) {
      console.error('❌ Error sending connection request:', error);
    }
  }, [currentUser]);

  const handleAcceptAcquaintance = useCallback(async (notification: Notification) => {
    try {
      const { UserService } = await import('./services/userService');
      const result = await UserService.acceptConnectionRequest(notification.fromUser.id, currentUser.id);

      if (result.success) {
        console.log('✅ Connection request accepted successfully');

        // Update current user's acquaintances
    const updatedCurrentUser = {
      ...currentUser,
          acquaintances: Array.from(new Set([...(currentUser.acquaintances || []), notification.fromUser.id]))
    };
    setCurrentUser(updatedCurrentUser);
    
        // Update all users list
        setAllUsers(prev => prev.map(u => {
        if (u.id === currentUser.id) return updatedCurrentUser;
          if (u.id === notification.fromUser.id) {
          return {
            ...u,
            acquaintances: Array.from(new Set([...(u.acquaintances || []), currentUser.id]))
          };
        }
        return u;
        }));

        // Mark notification as read
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));

        // Update localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCurrentUser));

        // Load fresh notifications
        loadNotifications();
      } else {
        console.warn('⚠️ Failed to accept connection request:', result.error);
      }
    } catch (error) {
      console.error('❌ Error accepting connection request:', error);
    }
  }, [currentUser]);

  const handleReadNotification = useCallback(async (notificationId: string) => {
    try {
      const { NotificationService } = await import('./services/notificationService');
      const result = await NotificationService.markAsRead(notificationId);

      if (result.success) {
        // Update local notifications state
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      } else {
        console.warn('⚠️ Failed to mark notification as read:', result.error);
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }, []);

  // Load notifications from backend
  const loadNotifications = useCallback(async () => {
    if (!currentUser.id) return;

    try {
      const { NotificationService } = await import('./services/notificationService');
      const result = await NotificationService.getNotifications(currentUser.id);

      if (result.success && result.data) {
        setNotifications(result.data);
        console.log(`📬 Loaded ${result.data.length} notifications`);
      } else {
        console.warn('⚠️ Failed to load notifications:', result.error);
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    }
  }, [currentUser.id]);

  // Load notifications when user is available
  useEffect(() => {
    if (currentUser.id) {
      loadNotifications();

      // Poll for new notifications every 30 seconds
      const notificationInterval = setInterval(loadNotifications, 30000);

      return () => clearInterval(notificationInterval);
    }
  }, [currentUser.id, loadNotifications]);

  const handleRemoveAcquaintance = useCallback(async (userId: string) => {
    try {
      const { UserService } = await import('./services/userService');
      const result = await UserService.removeAcquaintance(currentUser.id, userId);

      if (result.success) {
    const updatedAcquaintances = (currentUser.acquaintances || []).filter(id => id !== userId);
    const updatedUser = { ...currentUser, acquaintances: updatedAcquaintances };
        setCurrentUser(updatedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

        // Update all users list
        setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      }
    } catch (error) {
      console.error('Error removing acquaintance:', error);
    }
  }, [currentUser]);

  const handleSearchResult = useCallback((result: SearchResult) => {
    if (result.type === 'user') {
      setView({ type: 'profile', targetId: result.id });
      window.history.pushState(null, '', `/profile/${result.id}`);
    } else if (result.type === 'post') {
      setView({ type: 'feed' });
      setSearchQuery('');
      window.history.pushState(null, '', '/');
    }
  }, []);

  const filteredPosts = useMemo(() => {
    const filteredPosts = posts.filter(p => {
      const matchesSearch = p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.author.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEnergy = activeEnergy === 'all' || p.energy === activeEnergy;
      const matchesMedia = activeMediaType === 'all' || p.mediaType === activeMediaType;
      return matchesSearch && matchesEnergy && matchesMedia;
    });

    return filteredPosts.sort((a, b) => {
      if (a.isBoosted && !b.isBoosted) return -1;
      if (!a.isBoosted && b.isBoosted) return 1;
      return b.timestamp - a.timestamp;
    });
  }, [posts, searchQuery, activeEnergy, activeMediaType]);

  const handleLogin = useCallback((userData: any) => {
    if (!userData) return;
    const user = userData as User;
    setCurrentUser(user);
    setIsAuthenticated(true);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to persist session to localStorage', e);
    }

    setAllUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      const updated = exists ? prev.map(u => u.id === user.id ? user : u) : [...prev, user];
      try {
        localStorage.setItem(USERS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist users after login', e);
      }
      return updated;
    });

    window.history.replaceState(null, '', '/');
    setView({ type: 'feed' });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.warn('Logout request failed, continuing client-side logout', error);
    }

    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(CURRENT_USER);
    setIsAuthenticated(false);
    setView({ type: 'feed' });
    window.history.replaceState(null, '', '/login');
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 transition-colors"><Logo size="lg" className="animate-float" /></div>;

  if (!isAuthenticated) {
    if (window.location.pathname !== '/login') {
      window.history.replaceState(null, '', '/login');
    }
    return <Login onLogin={handleLogin} allUsers={allUsers} />;
  }

  return (
    <Layout
      activeView={view.type} searchQuery={searchQuery} onSearchChange={setSearchQuery}
      onLogout={handleLogout}
      currentUser={currentUser} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode}
      onStartCampaign={() => setIsAdManagerOpen(true)} onViewSettings={() => setIsSettingsOpen(true)}
      onViewPrivacy={() => { setView({ type: 'data_aura' }); window.history.pushState(null, '', '/data-aura'); }}
      onGoHome={() => { setView({ type: 'feed' }); window.history.pushState(null, '', '/'); }}
      onViewProfile={(id) => { setView({ type: 'profile', targetId: id }); window.history.pushState(null, '', `/profile/${id}`); }}
      onViewChat={(id) => { setView({ type: 'chat', targetId: id }); window.history.pushState(null, '', id ? `/chat/${id}` : '/chat'); }}
      onViewFriends={() => { setView({ type: 'acquaintances' }); window.history.pushState(null, '', '/acquaintances'); }}
      onOpenCreditStore={() => setIsCreditStoreOpen(true)}
      ads={ads} notifications={notifications} posts={posts} users={allUsers}
      onSearchResult={handleSearchResult}
      onReadNotification={handleReadNotification}
      onAcceptAcquaintance={handleAcceptAcquaintance}
    >
      {view.type === 'feed' && (
        <div className="space-y-8">
          <CreatePost
            currentUser={currentUser}
            onPost={handlePost}
            allUsers={allUsers}
            onTimeCapsule={handleTimeCapsule}
            onGenerateAIContent={handleGenerateAIContent}
          />

          <FeedFilters
            activeMediaType={activeMediaType}
            onMediaTypeChange={setActiveMediaType}
            activeEnergy={activeEnergy}
            onEnergyChange={setActiveEnergy}
            authors={[]}
            activeAuthorId="all"
            onAuthorChange={() => { }}
          />

          {birthdayAnnouncements.map(announcement => (
            <BirthdayPost
              key={announcement.id}
              birthdayUser={announcement.user}
              quirkyWish={announcement.wish}
              birthdayPostId={announcement.id}
              reactions={announcement.reactions}
              userReactions={announcement.userReactions}
              onReact={(postId, reaction) => handleReaction(postId, reaction)}
              onComment={(postId, text) => handleComment(postId, text)}
              currentUser={currentUser}
              onViewProfile={(id) => setView({ type: 'profile', targetId: id })}
            />
          ))}

          {filteredPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onReact={(postId, emoji, targetType, commentId) => {
                if (targetType === 'post') return handleReaction(postId, emoji);
                if (targetType === 'comment' && commentId) return handleCommentReaction(postId, commentId, emoji);
              }}
              onComment={handleComment}
              onBoost={handleBoost}
              onShare={(post) => setSharingContent({ content: post.content, url: `post/${post.id}` })}
              onViewProfile={(id) => setView({ type: 'profile', targetId: id })}
              onSearchTag={setSearchQuery}
              onLike={() => {}}
              onSendConnectionRequest={handleSendConnectionRequest}
              allUsers={allUsers}
            />
          ))}
        </div>
      )}

      {view.type === 'profile' && (
        <ProfileView
          user={allUsers.find(u => u.id === (view.targetId || currentUser.id)) || currentUser}
          posts={posts.filter(p => p.author.id === (view.targetId || currentUser.id))}
          currentUser={currentUser}
          allUsers={allUsers}
          onBack={() => setView({ type: 'feed' })}
          onReact={(postId, emoji, targetType, commentId) => {
            if (targetType === 'post') return handleReaction(postId, emoji);
            if (targetType === 'comment' && commentId) return handleCommentReaction(postId, commentId, emoji);
          }}
          onComment={handleComment}
          onBoost={handleBoost}
          onShare={(post) => setSharingContent({ content: post.content, url: `post/${post.id}` })}
          onSendConnectionRequest={handleSendConnectionRequest}
          onRemoveAcquaintance={handleRemoveAcquaintance}
          onAddAcquaintance={() => {}}
          onSearchTag={setSearchQuery}
          onLike={() => {}}
          onViewProfile={(id) => setView({ type: 'profile', targetId: id })}
        />
      )}

      {view.type === 'chat' && (
        <ChatView
          currentUser={currentUser}
          acquaintances={allUsers.filter(u => currentUser.acquaintances?.includes(u.id))}
          allUsers={allUsers}
          onBack={() => setView({ type: 'feed' })}
        />
      )}

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
      {view.type === 'data_aura' && <DataAuraView currentUser={currentUser} allUsers={allUsers} posts={posts.filter(p => p.author.id === currentUser.id)} onBack={() => setView({ type: 'feed' })} onPurchaseGlow={(glow) => handleUpdateProfile({ activeGlow: glow })} onClearData={() => { }} onViewProfile={(id) => setView({ type: 'profile', targetId: id })} onOpenCreditStore={() => setIsCreditStoreOpen(true)} />}

      {isSettingsOpen && <SettingsModal currentUser={currentUser} onClose={() => setIsSettingsOpen(false)} onUpdate={handleUpdateProfile} />}
      {isAdManagerOpen && <AdManager currentUser={currentUser} ads={ads} onAdCreated={(ad) => setAds([ad, ...ads])} onAdCancelled={(id) => setAds(ads.filter(a => a.id !== id))} onClose={() => setIsAdManagerOpen(false)} />}
      {isCreditStoreOpen && <CreditStoreModal currentUser={currentUser} onClose={() => setIsCreditStoreOpen(false)} onPurchase={(bundle: CreditBundle) => handleUpdateProfile({ auraCredits: (currentUser.auraCredits || 0) + bundle.credits })} bundles={CREDIT_BUNDLES} />}
      {sharingContent && <ShareModal content={sharingContent.content} url={sharingContent.url} onClose={() => setSharingContent(null)} />}
    </Layout>
  );
};

export default App;
