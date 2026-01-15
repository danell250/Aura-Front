
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import PostCard from './components/PostCard';
import CreatePost from './components/CreatePost';
import BirthdayPost from './components/BirthdayPost';
import AdCard from './components/AdCard';
import Login from './components/Login';
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
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import SerendipityModal from './components/SerendipityModal';
import { INITIAL_POSTS, CURRENT_USER, INITIAL_ADS, MOCK_USERS, CREDIT_BUNDLES } from './constants';
import { Post, User, Ad, Notification, EnergyType, Comment, CreditBundle, MediaItem } from './types';
import { UserService } from './services/userService';
import { AdService } from './services/adService';
import { PostService } from './services/postService';
import { NotificationService } from './services/notificationService';
import { CommentService } from './services/commentService';
import { SearchResult } from './services/searchService';
import { MessageService } from './services/messageService';
import { soundService } from './services/soundService';
import { getSerendipityMatches, SerendipityMatch, trackSerendipitySkip, recalculateTrustForUser } from './services/trustService';
import { getApiBaseUrl } from './constants';

const STORAGE_KEY = 'aura_user_session';
const POSTS_KEY = 'aura_posts_data';
const ADS_KEY = 'aura_ads_data';
const USERS_KEY = 'aura_all_users';
const API_BASE_URL = getApiBaseUrl();
const AURA_SUPPORT_EMAIL = 'aurasocialradiate@gmail.com';

const isProfileComplete = (user: User | null | undefined) => {
  if (!user) return false;
  const hasDob = !!user.dob;
  const hasBio = !!user.bio && user.bio.trim().length > 0;
  const hasIndustry = !!user.industry && user.industry.trim().length > 0;
  const hasCountry = !!user.country && user.country.trim().length > 0;
  const baseComplete = hasDob && hasBio && hasIndustry && hasCountry;

  if (!user.isCompany) {
    return baseComplete;
  }

  const hasCompanyName = !!user.companyName && user.companyName.trim().length > 0;
  const hasCompanyWebsite = !!user.companyWebsite && user.companyWebsite.trim().length > 0;
  return baseComplete && hasCompanyName && hasCompanyWebsite;
};

interface BirthdayAnnouncement {
  id: string;
  user: User;
  wish: string;
  reactions: Record<string, number>;
  userReactions: string[];
}

const App: React.FC = () => {
  useEffect(() => {
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      const httpsUrl = `https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(httpsUrl);
    }
  }, []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [posts, setPosts] = useState<Post[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [birthdayAnnouncements, setBirthdayAnnouncements] = useState<BirthdayAnnouncement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEnergy, setActiveEnergy] = useState<EnergyType | 'all'>('all');
  const [activeMediaType, setActiveMediaType] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdManagerOpen, setIsAdManagerOpen] = useState(false);
  const [adSubsRefreshTick, setAdSubsRefreshTick] = useState(0);
  const [isCreditStoreOpen, setIsCreditStoreOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sharingContent, setSharingContent] = useState<{ content: string; url: string } | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [messagePulse, setMessagePulse] = useState(false);
  const [isSerendipityOpen, setIsSerendipityOpen] = useState(false);
  const [serendipityMatches, setSerendipityMatches] = useState<SerendipityMatch[]>([]);
  const [isSerendipityLoading, setIsSerendipityLoading] = useState(false);
  const [isProfileCompletionRequired, setIsProfileCompletionRequired] = useState(false);
  
  const [view, setView] = useState<{type: 'feed' | 'profile' | 'chat' | 'acquaintances' | 'data_aura' | 'terms' | 'privacy', targetId?: string}>({ type: 'feed' });

  const syncViewFromLocation = useCallback(() => {
    const path = window.location.pathname || '/feed';
    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0 || segments[0] === 'feed') {
      setView({ type: 'feed' });
      return;
    }

    if (segments[0] === 'login') {
      return;
    }

    if (segments[0] === 'terms') {
      setView({ type: 'terms' });
      return;
    }

    if (segments[0] === 'privacy') {
      setView({ type: 'privacy' });
      return;
    }

    if (segments[0] === 'acquaintances') {
      setView({ type: 'acquaintances' });
      return;
    }

    if (segments[0] === 'data-aura' || segments[0] === 'data_aura') {
      setView({ type: 'data_aura' });
      return;
    }

    if (segments[0] === 'profile' && segments[1]) {
      setView({ type: 'profile', targetId: segments[1] });
      return;
    }

    if (segments[0] === 'chat') {
      setView({ type: 'chat', targetId: segments[1] || '' });
      return;
    }

    const fallbackPath = '/feed';
    if (window.location.pathname !== fallbackPath) {
      const newUrl = fallbackPath + window.location.search + window.location.hash;
      window.history.replaceState({ view: { type: 'feed' } }, '', newUrl);
    }
    setView({ type: 'feed' });
  }, []);

  const buildPathFromView = useCallback((nextView: { type: 'feed' | 'profile' | 'chat' | 'acquaintances' | 'data_aura' | 'terms' | 'privacy'; targetId?: string }) => {
    if (nextView.type === 'feed') return '/feed';
    if (nextView.type === 'acquaintances') return '/acquaintances';
    if (nextView.type === 'data_aura') return '/data-aura';
    if (nextView.type === 'terms') return '/terms';
    if (nextView.type === 'privacy') return '/privacy';
    if (nextView.type === 'profile' && nextView.targetId) return `/profile/${nextView.targetId}`;
    if (nextView.type === 'chat' && nextView.targetId) return `/chat/${nextView.targetId}`;
    if (nextView.type === 'chat') return '/chat';
    return '/feed';
  }, []);

  const ensureProfileCompletion = useCallback((user: User) => {
    if (!isProfileComplete(user)) {
      setIsProfileCompletionRequired(true);
      setIsSettingsOpen(true);
    } else {
      setIsProfileCompletionRequired(false);
    }
  }, []);

  const navigateToView = useCallback((nextView: { type: 'feed' | 'profile' | 'chat' | 'acquaintances' | 'data_aura' | 'terms' | 'privacy'; targetId?: string }) => {
    setView(nextView);
    const path = buildPathFromView(nextView);
    const newUrl = path + window.location.search + window.location.hash;
    window.history.pushState({ view: nextView }, '', newUrl);
  }, [buildPathFromView]);

  const ensureAuraSupportUser = useCallback((users: User[]): User[] => {
    const exists = users.some(u => (u.email || '').toLowerCase() === AURA_SUPPORT_EMAIL);
    if (exists) return users;
    const supportUser: User = {
      id: `support-${AURA_SUPPORT_EMAIL}`,
      firstName: 'Aura',
      lastName: 'Support',
      name: 'Aura Support',
      handle: '@aurasupport',
      avatar: '/og-image.svg',
      avatarType: 'image',
      bio: 'Aura Support',
      email: AURA_SUPPORT_EMAIL,
      trustScore: 100,
      auraCredits: 0,
      activeGlow: 'emerald'
    };
    return [supportUser, ...users];
  }, []);

  const handleUnauthorized = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(CURRENT_USER);
    setNotifications([]);
    setUnreadNotificationCount(0);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('aura_credits');
    localStorage.removeItem('aura_auth_token');
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const token = localStorage.getItem('aura_auth_token');
      let result;
      if (token) {
        result = await UserService.getMe(token);
        if (!result.success || !result.user) {
          handleUnauthorized();
          return;
        }
      } else {
        result = await UserService.getUserById(currentUser.id);
      }
      
      if (result.success && result.user) {
        setCurrentUser(result.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  }, [currentUser?.id, handleUnauthorized]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser();
    }
  }, [isAuthenticated, fetchCurrentUser]);

  const notificationInitRef = useRef(false);
  const prevNotificationIdsRef = useRef<Set<string> | null>(null);
  const messageInitRef = useRef(false);
  const prevUnreadCountRef = useRef(0);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const result = await NotificationService.getNotifications(currentUser.id);
      if (result.success && result.data) {
        setUnreadNotificationCount(result.unreadCount ?? result.data.filter((n: Notification) => !n.isRead).length);
        setNotifications(prev => {
          const previousIds = prev.map(n => n.id);
          const previousSet = new Set(previousIds);
          const currentSet = new Set(result.data.map((n: Notification) => n.id));
          const hasPrevious = prev.length > 0 || notificationInitRef.current;
          notificationInitRef.current = true;
          const hasNew = result.data.some((n: Notification) => !previousSet.has(n.id));
          if (hasPrevious && hasNew) {
            soundService.playNotification();
          }
          prevNotificationIdsRef.current = currentSet;
          return result.data;
        });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;
    let cancelled = false;

    const loop = async () => {
      if (cancelled) return;
      await fetchNotifications();
      if (cancelled) return;
      setTimeout(loop, 2000);
    };

    loop();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, currentUser?.id, fetchNotifications]);

  const fetchUnreadMessages = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const result = await MessageService.getConversations(currentUser.id);
      if (result.success && Array.isArray(result.data)) {
        const totalUnread = result.data.reduce(
          (sum: number, conv: any) => sum + (typeof conv.unreadCount === 'number' ? conv.unreadCount : 0),
          0
        );
        setUnreadMessageCount(prev => {
          const previous = messageInitRef.current ? prev : totalUnread;
          const next = totalUnread;
          const hasPrevious = messageInitRef.current;
          messageInitRef.current = true;
          if (hasPrevious && next > previous) {
            soundService.playMessage();
          }
          prevUnreadCountRef.current = next;
          return next;
        });
        setMessagePulse(totalUnread > 0);
      }
    } catch (error) {
      console.error('Failed to fetch message conversations:', error);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;
    let cancelled = false;

    const loop = async () => {
      if (cancelled) return;
      await fetchUnreadMessages();
      if (cancelled) return;
      setTimeout(loop, 2000);
    };

    loop();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, currentUser?.id, fetchUnreadMessages]);

  const syncBirthdays = useCallback(async () => {
    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const response = await fetch(`${API_BASE_URL}/birthdays/today`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      if (!response.ok) {
        setBirthdayAnnouncements([]);
        return;
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setBirthdayAnnouncements(result.data);
      } else {
        setBirthdayAnnouncements([]);
      }
    } catch (error) {
      console.error('Error syncing birthdays from backend:', error);
      setBirthdayAnnouncements([]);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    const savedUsers = localStorage.getItem(USERS_KEY);
    const usersToProcess = savedUsers ? JSON.parse(savedUsers) : MOCK_USERS;
    setAllUsers(ensureAuraSupportUser(usersToProcess));

    const urlParams = new URLSearchParams(window.location.search);
    const hasTokenParam = urlParams.has('token');

    let wasAuthenticated = false;

    (async () => {
      const isOAuthRedirect = (() => {
        try {
          return sessionStorage.getItem('oauth_in_progress') === 'true';
        } catch {
          return false;
        }
      })();

      if (isOAuthRedirect) {
        try {
          try {
            sessionStorage.removeItem('oauth_in_progress');
          } catch {
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch {
        }
      }

      try {
        const tokenFromStorage = localStorage.getItem('aura_auth_token');
        const result = await UserService.getMe(tokenFromStorage);

        if (result.success && result.user) {
          const user = result.user;
          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

          const filteredUsers = usersToProcess.filter((u: User) => u.id !== user.id);
          const updatedUsers = [...filteredUsers, user];
          setAllUsers(updatedUsers);
          localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

          wasAuthenticated = true;
          ensureProfileCompletion(user);
          navigateToView({ type: 'feed' });
        } else {
          const savedSession = localStorage.getItem(STORAGE_KEY);
          const savedToken = localStorage.getItem('aura_auth_token');
          if (savedSession && savedToken) {
            try {
              const user = JSON.parse(savedSession);
              const refreshedUser = usersToProcess.find((u: User) => u.id === user.id) || user;
              setCurrentUser(refreshedUser);
              setIsAuthenticated(true);
              wasAuthenticated = true;
              ensureProfileCompletion(refreshedUser);
            } catch (e) {
              localStorage.removeItem(STORAGE_KEY);
            }
          } else if (savedSession && !savedToken) {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('[App] Error during initial auth load:', error);
      } finally {
        if (hasTokenParam) {
          const cleanedSearch = new URLSearchParams(window.location.search);
          cleanedSearch.delete('token');
          const newSearch = cleanedSearch.toString();
          const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
          window.history.replaceState({}, document.title, newUrl);
        }
      }

      const savedPosts = localStorage.getItem(POSTS_KEY);
      setPosts(savedPosts ? JSON.parse(savedPosts) : INITIAL_POSTS);
      const savedAds = localStorage.getItem(ADS_KEY);
      setAds(savedAds ? JSON.parse(savedAds) : INITIAL_ADS);
      if (wasAuthenticated) {
        syncBirthdays();
      }

      if (localStorage.getItem('aura_theme') === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }
      syncViewFromLocation();
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    })();
  }, [syncViewFromLocation, navigateToView, syncBirthdays, ensureAuraSupportUser]);

  useEffect(() => {
    const handlePopState = () => {
      syncViewFromLocation();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [syncViewFromLocation]);

  useEffect(() => {
    if (isAuthenticated) {
      syncBirthdays();
    }
  }, [isAuthenticated, syncBirthdays]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const result = await UserService.getAllUsers();
        if (result.success && result.users) {
          setAllUsers(ensureAuraSupportUser(result.users));
        }
      } catch (error) {
        console.error('Failed to load users from backend:', error);
      }
    })();
  }, [isAuthenticated, ensureAuraSupportUser]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const result = await PostService.getAllPosts(1, 100);
        if (result.success && result.posts) {
          setPosts(result.posts);
        }
      } catch (error) {
        console.error('Failed to load posts from backend:', error);
      }
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    const updateTimeCapsules = () => {
      const now = Date.now();
      setPosts(prev =>
        prev.map(post => {
          if (!post.isTimeCapsule || !post.unlockDate) return post;
          const nextUnlocked = now >= post.unlockDate;
          if (post.isUnlocked === nextUnlocked) return post;
          return { ...post, isUnlocked: nextUnlocked };
        })
      );
    };

    updateTimeCapsules();
    const interval = setInterval(updateTimeCapsules, 60000);
    return () => clearInterval(interval);
  }, [ensureAuraSupportUser]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (window.location.pathname === '/login') {
      navigateToView({ type: 'feed' });
    }
  }, [isAuthenticated, navigateToView]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (view.type === 'chat') {
      fetchUnreadMessages();
    }
  }, [view, isAuthenticated, fetchUnreadMessages]);

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
    const existingUser = allUsers.find(u => 
      (userData.email && u.email.toLowerCase() === userData.email.toLowerCase()) || 
      (userData.handle && u.handle.toLowerCase() === userData.handle.toLowerCase()) || 
      (userData.id && u.id === userData.id)
    );

    if (existingUser) {
      setCurrentUser(existingUser);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingUser));
      syncBirthdays();
      ensureProfileCompletion(existingUser);
      navigateToView({ type: 'feed' });
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
      auraCredits: 0,
      activeGlow: 'none'
    };
    
    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    syncBirthdays();
    ensureProfileCompletion(newUser);
    navigateToView({ type: 'feed' });
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    const optimisticUser = { ...currentUser, ...updates };
    if (updates.firstName && updates.lastName) {
      optimisticUser.name = `${updates.firstName} ${updates.lastName}`;
    }
    setCurrentUser(optimisticUser);
    setAllUsers(prev => prev.map(u => (u.id === currentUser.id ? optimisticUser : u)));

    try {
      const updateResult = await UserService.updateUser(currentUser.id, updates);
      let persistedUser: User | null = null;
      if (updateResult.success && updateResult.user) {
        persistedUser = updateResult.user as User;
      } else {
        await fetchCurrentUser();
        return;
      }

      try {
        const breakdown = await recalculateTrustForUser(persistedUser.id);
        if (breakdown) {
          persistedUser = { ...persistedUser, trustScore: breakdown.total };
        }
      } catch (e) {
      }

      setCurrentUser(persistedUser);
      setAllUsers(prev => prev.map(u => (u.id === currentUser.id ? persistedUser as User : u)));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedUser));
      if (isProfileComplete(persistedUser)) {
        setIsProfileCompletionRequired(false);
      }
    } catch (error) {
      await fetchCurrentUser();
    }
  };

  const handlePost = async (
    content: string,
    mediaUrl?: string,
    mediaType?: any,
    taggedUserIds?: string[],
    documentName?: string,
    energy?: EnergyType,
    mediaItems?: MediaItem[]
  ) => {
    const optimisticId = `temp-${Date.now()}`;
    const optimisticPost: Post = {
      id: optimisticId,
      author: currentUser,
      content,
      mediaUrl,
      mediaType,
      mediaItems,
      energy: energy || EnergyType.NEUTRAL,
      radiance: 0,
      timestamp: Date.now(),
      reactions: {},
      comments: [],
      userReactions: [],
      isBoosted: false
    };

    setPosts(prev => [optimisticPost, ...prev]);

    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          content,
          mediaUrl,
          mediaType,
          mediaItems,
          energy,
          authorId: currentUser.id,
          taggedUserIds
        })
      });

      const result = await response.json().catch(() => null);
      if (response.ok && result && result.success && result.data) {
        const createdPost: Post = result.data;
        setPosts(prev => {
          const withoutOptimistic = prev.filter(p => p.id !== optimisticId);
          return [createdPost, ...withoutOptimistic];
        });
        return;
      }

      setPosts(prev => prev.filter(p => p.id !== optimisticId));

      const message =
        (result && result.message) ||
        (response.status === 401 ? 'You must be signed in to post.' : 'Failed to create post.');
      console.error('Failed to create post in backend:', response.status, result);
      alert(message);
    } catch (error) {
      console.error('Failed to create post in backend:', error);
      setPosts(prev => prev.filter(p => p.id !== optimisticId));
      alert('Failed to create post. Please check your connection and try again.');
    }
  };

  const handleDeletePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  const handleDeleteComment = useCallback((postId: string, commentId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const filteredComments = p.comments.filter(c => c.id !== commentId);
      const currentCount = p.commentCount ?? p.comments.length;
      return {
        ...p,
        comments: filteredComments,
        commentCount: Math.max(0, currentCount - 1)
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

  const handleBoostPost = useCallback(async (postId: string, credits: number = 50) => {
    const boostCost = credits;
    const isSpecialUser = currentUser.email?.toLowerCase() === 'danelloosthuizen3@gmail.com';
    
    if (!isSpecialUser && currentUser.auraCredits < boostCost) {
      setIsCreditStoreOpen(true);
      return;
    }
    
    try {
      const token = localStorage.getItem('aura_auth_token');
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/boost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: currentUser.id, credits: boostCost })
      });
      
      const result = await response.json();
      if (result.success) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, radiance: p.radiance + (boostCost * 2), isBoosted: true } : p));
        fetchCurrentUser();
      } else {
        console.error('Boost failed:', result.error);
        fetchCurrentUser(); // Revert/Sync
      }
    } catch (e) {
      console.error('Boost error:', e);
      fetchCurrentUser(); // Revert/Sync
    }
  }, [currentUser, fetchCurrentUser]);

  const handleBoostUser = useCallback(async (userId: string) => {
    const boostCost = 200;
    const isSpecialUser = currentUser.email?.toLowerCase() === 'danelloosthuizen3@gmail.com';

    if (!isSpecialUser && currentUser.auraCredits < boostCost) {
      setIsCreditStoreOpen(true);
      return;
    }
    
    if (!isSpecialUser) {
      try {
        const token = localStorage.getItem('aura_auth_token');
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/spend-credits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ credits: boostCost, reason: `Boosted user ${userId}` })
        });
        
        const result = await response.json();
        if (result.success) {
          fetchCurrentUser();
        } else {
          console.error("Failed to spend credits:", result.error);
          fetchCurrentUser();
          return;
        }
      } catch (e) {
        console.error("Error spending credits:", e);
        fetchCurrentUser();
        return;
      }
    }
    
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, trustScore: Math.min(100, u.trustScore + 10) } : u));
  }, [currentUser, fetchCurrentUser]);

  const handlePurchaseGlow = useCallback(async (glow: 'emerald' | 'cyan' | 'amber') => {
    const glowCosts: Record<'emerald' | 'cyan' | 'amber', number> = {
      emerald: 100,
      cyan: 250,
      amber: 500
    };

    const cost = glowCosts[glow];
    const currentCredits = currentUser.auraCredits || 0;
    const isSpecialUser = currentUser.email?.toLowerCase() === 'danelloosthuizen3@gmail.com';

    if (!isSpecialUser && currentCredits < cost) {
      setIsCreditStoreOpen(true);
      return;
    }

    if (!isSpecialUser) {
      try {
        const token = localStorage.getItem('aura_auth_token');
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/spend-credits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            credits: cost,
            reason: `Purchased ${glow} glow`
          })
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          console.error('Failed to spend credits for glow:', result.error);
          await fetchCurrentUser();
          return;
        }
      } catch (error) {
        console.error('Error spending credits for glow:', error);
        await fetchCurrentUser();
        return;
      }
    }

    try {
      const updateResult = await UserService.updateUser(currentUser.id, { activeGlow: glow });
      if (updateResult.success && updateResult.user) {
        setCurrentUser(updateResult.user);
        setAllUsers(prev => prev.map(u => (u.id === currentUser.id ? updateResult.user as User : u)));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updateResult.user));
      } else {
        console.error('Failed to update glow on user:', updateResult.error);
        await fetchCurrentUser();
      }
    } catch (error) {
      console.error('Error updating glow on user:', error);
      await fetchCurrentUser();
    }
  }, [currentUser, fetchCurrentUser]);

  const handleTimeCapsule = useCallback(async (data: any) => {
    const now = Date.now();
    const unlockDate = data.unlockDate;
    const isUnlocked = typeof unlockDate === 'number' ? now >= unlockDate : true;

    const optimisticPost: Post = {
      id: `tc-${Date.now()}`,
      author: currentUser,
      content: data.content,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      energy: data.energy || EnergyType.NEUTRAL,
      radiance: 0,
      timestamp: now,
      reactions: {},
      comments: [],
      userReactions: [],
      isBoosted: false,
      isTimeCapsule: true,
      unlockDate,
      isUnlocked,
      timeCapsuleType: data.timeCapsuleType,
      invitedUsers: data.invitedUsers,
      timeCapsuleTitle: data.timeCapsuleTitle
    };

    setPosts(prev => [optimisticPost, ...prev]);

    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          content: data.content,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          energy: data.energy,
          authorId: currentUser.id,
          isTimeCapsule: true,
          unlockDate,
          timeCapsuleType: data.timeCapsuleType,
          invitedUsers: data.invitedUsers,
          timeCapsuleTitle: data.timeCapsuleTitle
        })
      });

      const result = await response.json().catch(() => null);
      if (response.ok && result && result.success && result.data) {
        const createdPost: Post = result.data;
        setPosts(prev => {
          const withoutOptimistic = prev.filter(p => p.id !== optimisticPost.id);
          return [createdPost, ...withoutOptimistic];
        });
      }
    } catch (error) {
      console.error('Failed to create time capsule in backend:', error);
    }
  }, [currentUser]);

  const handleSendConnectionRequest = useCallback((targetUserId: string) => {
    // Handle sending connection request
    setAllUsers(prev => prev.map(u => 
      u.id === currentUser.id 
        ? { ...u, sentAcquaintanceRequests: [...(u.sentAcquaintanceRequests || []), targetUserId] }
        : u
    ));
  }, [currentUser.id]);

  const handleAdCreated = useCallback(async (ad: Ad) => {
    // Ensure ad is active immediately so it shows in feed
    const newAd = { ...ad, status: 'active' as const };

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
        setAdSubsRefreshTick(prev => prev + 1);
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
    (async () => {
      if (!currentUser?.id) return;
      try {
        const result = await UserService.purchaseCredits(currentUser.id, {
          credits: bundle.credits,
          bundleName: bundle.name,
          paymentMethod: 'paypal'
        });
        if (!result.success) {
          console.error('Failed to purchase credits:', result.error);
          return;
        }
        await fetchCurrentUser();
      } catch (error) {
        console.error('Error purchasing credits:', error);
      }
    })();
  };

  const handleComment = useCallback(async (postId: string, text: string, parentId?: string) => {
    const handleMatches: string[] = text.match(/@\w+/g) || [];
    const uniqueHandles = Array.from(new Set(handleMatches.map(h => h.toLowerCase())));
    const potentialTaggedUsers = allUsers.filter(u => u.handle && uniqueHandles.includes(u.handle.toLowerCase()));
    const permissionResults = await Promise.all(
      potentialTaggedUsers.map(async (user) => {
        const canTag = await PrivacyService.canTagUser(user.id);
        return canTag ? user.id : null;
      })
    );
    const taggedUserIds = permissionResults.filter((id): id is string => id !== null);

    const optimisticComment: Comment = {
      id: `c-${Date.now()}`,
      author: currentUser,
      text,
      timestamp: Date.now(),
      parentId,
      reactions: {},
      userReactions: [],
      taggedUserIds
    };
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const currentCount = p.commentCount ?? p.comments.length;
      return { ...p, comments: [...p.comments, optimisticComment], commentCount: currentCount + 1 };
    }));

    try {
      const result = await CommentService.createComment(postId, text, currentUser.id, parentId, taggedUserIds);
      if (result.success && result.data) {
        const created = result.data;
        setPosts(prev => prev.map(p => {
          if (p.id !== postId) return p;
          const filtered = p.comments.filter(c => c.id !== optimisticComment.id);
          const updatedComments = [...filtered, created];
          const currentCount = p.commentCount ?? updatedComments.length;
          return { ...p, comments: updatedComments, commentCount: currentCount };
        }));
      }
    } catch (error) {
      console.error('Failed to create comment in backend:', error);
    }
  }, [currentUser]);

  const handleLoadComments = useCallback((postId: string, comments: Comment[]) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments,
        commentCount: comments.length
      };
    }));
  }, []);

  const handleSyncPost = useCallback((updatedPost: Post) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== updatedPost.id) return p;
      const sessionLiked = (p as any).sessionLiked;
      const radiance = p.radiance;
      return {
        ...p,
        ...updatedPost,
        radiance,
        sessionLiked
      } as Post;
    }));
  }, []);

  const handleReact = useCallback(async (postId: string, reaction: string, targetType: 'post' | 'comment', commentId?: string) => {
    if (targetType === 'post') {
      let previousPost: Post | undefined;

      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        previousPost = p;

        const reactions = { ...p.reactions };
        const userReactions = [...(p.userReactions || [])];
        const hasReacted = userReactions.includes(reaction);

        if (hasReacted) {
          const nextCount = (reactions[reaction] || 0) - 1;
          if (nextCount <= 0) {
            delete reactions[reaction];
          } else {
            reactions[reaction] = nextCount;
          }
          const nextUserReactions = userReactions.filter(r => r !== reaction);
          return { ...p, reactions, userReactions: nextUserReactions };
        } else {
          const nextCount = (reactions[reaction] || 0) + 1;
          reactions[reaction] = nextCount;
          const nextUserReactions = userReactions.includes(reaction) ? userReactions : [...userReactions, reaction];
          return { ...p, reactions, userReactions: nextUserReactions };
        }
      }));

      try {
        const token = localStorage.getItem('aura_auth_token') || '';
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/react`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ reaction, userId: currentUser.id })
        });
        const result = await response.json().catch(() => null);
        if (response.ok && result && result.success && result.data) {
          const updatedPost: Post = result.data;
          setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
        } else {
          if (previousPost) {
            setPosts(prev => prev.map(p => p.id === postId ? previousPost! : p));
          }
          console.error('Failed to react to post:', result?.error);
        }
      } catch (error) {
        if (previousPost) {
          setPosts(prev => prev.map(p => p.id === postId ? previousPost! : p));
        }
        console.error('Error reacting to post:', error);
      }
      return;
    }

    if (targetType === 'comment' && commentId) {
      let previousComments: Comment[] | undefined;

      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        previousComments = p.comments;

        const comments = p.comments.map(c => {
          if (c.id !== commentId) return c;

          const reactions = { ...(c.reactions || {}) };
          const userReactions = [...(c.userReactions || [])];
          const hasReacted = userReactions.includes(reaction);

          if (hasReacted) {
            const nextCount = (reactions[reaction] || 0) - 1;
            if (nextCount <= 0) {
              delete reactions[reaction];
            } else {
              reactions[reaction] = nextCount;
            }
            const nextUserReactions = userReactions.filter(r => r !== reaction);
            return { ...c, reactions, userReactions: nextUserReactions };
          } else {
            const nextCount = (reactions[reaction] || 0) + 1;
            reactions[reaction] = nextCount;
            const nextUserReactions = userReactions.includes(reaction) ? userReactions : [...userReactions, reaction];
            return { ...c, reactions, userReactions: nextUserReactions };
          }
        });

        return { ...p, comments };
      }));

      try {
        const result = await CommentService.reactToComment(commentId, reaction, currentUser.id);
        if (result.success && result.data) {
          const updatedComment = result.data;
          setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;
            const comments = p.comments.map(c => c.id === updatedComment.id ? updatedComment : c);
            return { ...p, comments };
          }));
        } else {
          if (previousComments) {
            setPosts(prev => prev.map(p => {
              if (p.id !== postId) return p;
              return { ...p, comments: previousComments! };
            }));
          }
          console.error('Failed to react to comment:', result.error);
        }
      } catch (error) {
        if (previousComments) {
          setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;
            return { ...p, comments: previousComments! };
          }));
        }
        console.error('Error reacting to comment:', error);
      }
    }
  }, [currentUser.id]);

  const handleAddAcquaintance = useCallback(async (targetUser: User) => {
    if (currentUser.id === targetUser.id) return;

    if (currentUser.acquaintances?.includes(targetUser.id)) return;

    if (currentUser.sentAcquaintanceRequests?.includes(targetUser.id)) {
      const previousUser = currentUser;
      const updatedUser: User = {
        ...currentUser,
        sentAcquaintanceRequests: (currentUser.sentAcquaintanceRequests || []).filter(id => id !== targetUser.id)
      };

      setCurrentUser(updatedUser);
      setAllUsers(prev => prev.map(u => (u.id === currentUser.id ? updatedUser : u)));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

      try {
        const result = await UserService.cancelConnectionRequest(currentUser.id, targetUser.id);
        if (!result.success) {
          setCurrentUser(previousUser);
          setAllUsers(prev => prev.map(u => (u.id === currentUser.id ? previousUser : u)));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(previousUser));
          console.error('Failed to cancel connection request:', result.error);
        }
      } catch (error) {
        setCurrentUser(previousUser);
        setAllUsers(prev => prev.map(u => (u.id === currentUser.id ? previousUser : u)));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(previousUser));
        console.error('Error cancelling connection request:', error);
      }

      return;
    }

    const previousUser = currentUser;
    const updatedUser: User = {
      ...currentUser,
      sentAcquaintanceRequests: [...(currentUser.sentAcquaintanceRequests || []), targetUser.id]
    };

    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => (u.id === currentUser.id ? updatedUser : u)));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

    try {
      const result = await UserService.sendConnectionRequest(currentUser.id, targetUser.id);
      if (!result.success) {
        setCurrentUser(previousUser);
        setAllUsers(prev => prev.map(u => (u.id === currentUser.id ? previousUser : u)));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(previousUser));
        console.error('Failed to send connection request:', result.error);
      }
    } catch (error) {
      setCurrentUser(previousUser);
      setAllUsers(prev => prev.map(u => (u.id === currentUser.id ? previousUser : u)));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(previousUser));
      console.error('Error sending connection request:', error);
    }
  }, [currentUser]);

  const handleAcceptConnection = useCallback(async (notification: Notification) => {
    const requesterId = notification.fromUser.id;

    try {
      const result = await UserService.acceptConnectionRequest(requesterId, currentUser.id);
      if (!result.success) {
        console.error('Failed to accept connection request:', result.error);
        return;
      }
    } catch (error) {
      console.error('Error accepting connection request:', error);
      return;
    }

    const updatedCurrentUser = {
      ...currentUser,
      acquaintances: Array.from(new Set([...(currentUser.acquaintances || []), requesterId]))
    };

    setCurrentUser(updatedCurrentUser);
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
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCurrentUser));
  }, [currentUser]);

  const handleRejectConnection = useCallback(async (notification: Notification) => {
    const requesterId = notification.fromUser.id;

    try {
      const result = await UserService.rejectConnectionRequest(requesterId, currentUser.id);
      if (!result.success) {
        console.error('Failed to reject connection request:', result.error);
        return;
      }
    } catch (error) {
      console.error('Error rejecting connection request:', error);
      return;
    }

    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
  }, [currentUser.id]);

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

  const handleSearchResult = useCallback((result: SearchResult) => {
    if (result.type === 'user') {
      const data = result.data as User;
      const userId = data.id || result.id;
      navigateToView({ type: 'profile', targetId: userId });
      return;
    }

    if (result.type === 'post') {
      const data = result.data as Post;
      const authorId = data.author?.id;
      if (authorId) {
        navigateToView({ type: 'profile', targetId: authorId });
      } else {
        navigateToView({ type: 'feed' });
      }
      return;
    }

    if (result.type === 'ad') {
      setIsAdManagerOpen(true);
      return;
    }

    if (result.type === 'hashtag') {
      const data = result.data as { tag: string; count: number };
      const tag = data.tag.startsWith('#') ? data.tag : `#${data.tag}`;
      setSearchQuery(tag);
      navigateToView({ type: 'feed' });
    }
  }, [navigateToView]);

  const handleReadNotification = useCallback(async (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      setUnreadNotificationCount(updated.filter(n => !n.isRead).length);
      return updated;
    });
    try {
      const result = await NotificationService.markAsRead(id);
      if (!result.success) {
        console.error('Failed to mark notification as read:', result.error);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    if (!currentUser?.id) return;
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      setUnreadNotificationCount(0);
      return updated;
    });
    try {
      const result = await NotificationService.markAllAsRead(currentUser.id);
      if (!result.success) {
        console.error('Failed to mark all notifications as read:', result.error);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [currentUser?.id]);

  const handleNavigateNotification = useCallback((notification: Notification) => {
    console.log('[Feed] Navigation handler called with notification:', notification);

    if (
      notification.type === 'profile_view' ||
      notification.type === 'connection_request' ||
      notification.type === 'acquaintance_request' ||
      notification.type === 'acquaintance_accepted'
    ) {
      const targetId = notification.fromUser?.id;
      console.log('[Feed] Navigating to profile from notification:', notification.type, targetId);
      if (targetId) {
        navigateToView({ type: 'profile', targetId });
      }
      return;
    }

    if (
      (notification.type === 'like' ||
        notification.type === 'reaction' ||
        notification.type === 'comment' ||
        notification.type === 'share' ||
        notification.type === 'boost_received' ||
        notification.type === 'time_capsule_unlocked') &&
      notification.postId
    ) {
      const postId = notification.postId;
      console.log('[Feed] Navigating to post from notification:', notification.type, postId);
      navigateToView({ type: 'feed' });
      setTimeout(() => {
        const el = document.getElementById(`post-${postId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
      return;
    }

    if (notification.type === 'message') {
      const targetId = notification.fromUser?.id;
      console.log('[Feed] Navigating to chat from notification:', targetId);
      if (targetId) {
        navigateToView({ type: 'chat', targetId });
      }
      return;
    }

    console.log('[Feed] Falling back to feed for notification:', notification.type);
    navigateToView({ type: 'feed' });
  }, [navigateToView]);

  const handleRefreshSerendipity = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsSerendipityLoading(true);
    try {
      const matches = await getSerendipityMatches(currentUser.id, 20);
      setSerendipityMatches(matches);
    } catch (error) {
      console.error('Failed to load Serendipity matches:', error);
      setSerendipityMatches([]);
    } finally {
      setIsSerendipityLoading(false);
    }
  }, [currentUser?.id]);

  const handleOpenSerendipity = useCallback(() => {
    if (!currentUser?.id) return;
    setIsSerendipityOpen(true);
    handleRefreshSerendipity();
  }, [currentUser?.id, handleRefreshSerendipity]);

  const handleNavigateFromSerendipity = useCallback(
    (userId: string) => {
      navigateToView({ type: 'profile', targetId: userId });
    },
    [navigateToView]
  );

  const handleSerendipityMessage = useCallback(
    (userId: string) => {
      setIsSerendipityOpen(false);
      navigateToView({ type: 'chat', targetId: userId });
    },
    [navigateToView]
  );

  const handleSerendipityConnect = useCallback(
    (user: User) => {
      handleAddAcquaintance(user);
      navigateToView({ type: 'profile', targetId: user.id });
    },
    [handleAddAcquaintance, navigateToView]
  );

  const handleSerendipitySkip = useCallback(
    (targetUserId: string) => {
      if (!currentUser?.id) return;
      trackSerendipitySkip(currentUser.id, targetUserId);
    },
    [currentUser?.id]
  );

  const processedFeedItems = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    const hashtagTerm = searchLower.startsWith('#') ? searchLower.slice(1) : searchLower;

    const filteredPosts = posts.filter(p => {
      const contentMatches = p.content.toLowerCase().includes(searchLower) || 
                             p.author.name.toLowerCase().includes(searchLower);
      const hashtagMatches = hashtagTerm && p.hashtags
        ? p.hashtags.some(tag => tag.toLowerCase().includes(hashtagTerm))
        : false;
      const matchesSearch = contentMatches || hashtagMatches;
      const matchesEnergy = activeEnergy === 'all' || p.energy === activeEnergy;
      const matchesMedia = activeMediaType === 'all' || p.mediaType === activeMediaType;
      return matchesSearch && matchesEnergy && matchesMedia;
    });

    const activeAds = ads.filter(a => {
      if (a.status !== 'active') return false;

      if (!searchLower) return true;

      const textMatches =
        (a.headline || '').toLowerCase().includes(searchLower) ||
        (a.description || '').toLowerCase().includes(searchLower) ||
        (a.ownerName || '').toLowerCase().includes(searchLower);

      const hashtagMatches = hashtagTerm && a.hashtags
        ? a.hashtags.some(tag => tag.toLowerCase().includes(hashtagTerm))
        : false;

      return textMatches || hashtagMatches;
    });
    
    const sortedPosts = [...filteredPosts].sort((a, b) => {
        if (b.timestamp !== a.timestamp) {
          return b.timestamp - a.timestamp;
        }
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return 0;
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

    return combined;
  }, [posts, ads, birthdayAnnouncements, view, searchQuery, activeEnergy, activeMediaType]);

  useEffect(() => {
    (window as any).handleAcceptConnection = handleAcceptConnection;
    return () => { delete (window as any).handleAcceptConnection; };
  }, [handleAcceptConnection]);

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 transition-colors"><Logo size="lg" className="animate-float" /></div>;
  if (!isAuthenticated) {
    const path = typeof window !== 'undefined' ? window.location.pathname : '/login';
    const segments = path.split('/').filter(Boolean);

    if (segments[0] === 'terms') {
      return (
        <div className="min-h-screen bg-[#FDFDFF] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <TermsAndConditions onClose={() => { window.history.back(); }} />
        </div>
      );
    }

    if (segments[0] === 'privacy') {
      return (
        <div className="min-h-screen bg-[#FDFDFF] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <PrivacyPolicy onClose={() => { window.history.back(); }} />
        </div>
      );
    }

    if (typeof window !== 'undefined' && path !== '/login') {
      const newUrl = '/login' + window.location.search + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
    return <Login onLogin={handleLogin} allUsers={allUsers} />;
  }

  return (
    <Layout 
      activeView={view.type} searchQuery={searchQuery} onSearchChange={setSearchQuery} 
      onLogout={() => { 
        setIsAuthenticated(false); 
        localStorage.removeItem(STORAGE_KEY); 
        localStorage.removeItem('aura_credits'); 
        localStorage.removeItem('aura_auth_token');
        const newUrl = '/login' + window.location.search + window.location.hash;
        window.history.pushState({}, '', newUrl);
      }}
      currentUser={currentUser} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode}
      onStartCampaign={() => setIsAdManagerOpen(true)} onViewSettings={() => setIsSettingsOpen(true)} 
      onOpenCreditStore={() => setIsCreditStoreOpen(true)}
      posts={posts} users={allUsers} ads={ads} notifications={notifications}
      onGoHome={() => navigateToView({ type: 'feed' })} 
      onViewChat={(userId) => navigateToView({ type: 'chat', targetId: userId || '' })}
      onViewFriends={() => navigateToView({ type: 'acquaintances' })}
      onViewPrivacy={() => navigateToView({ type: 'data_aura' })} 
      onViewProfile={(userId) => navigateToView({ type: 'profile', targetId: userId })}
      onSearchResult={handleSearchResult}
      onReadNotification={handleReadNotification}
      onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
      onAcceptAcquaintance={handleAcceptConnection}
      onRejectAcquaintance={handleRejectConnection}
      onNavigateNotification={handleNavigateNotification}
      unreadMessageCount={unreadMessageCount}
      messagePulse={messagePulse}
      unreadNotificationCount={unreadNotificationCount}
      onSearchTag={setSearchQuery}
    >
      {view.type === 'feed' && (
        <div className="space-y-6">
          <CreatePost allUsers={allUsers} currentUser={currentUser} onPost={handlePost} onTimeCapsule={handleTimeCapsule} />
          
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
                  ? <PostCard key={item.id} post={item as Post} currentUser={currentUser} allUsers={allUsers} onLike={handleLike} onComment={handleComment} onReact={handleReact} onShare={(p) => setSharingContent({content: p.content, url: `p/${p.id}`})} onViewProfile={(id) => setView({ type: 'profile', targetId: id })} onSearchTag={setSearchQuery} onBoost={handleBoostPost} onDeletePost={handleDeletePost} onDeleteComment={handleDeleteComment} onLoadComments={handleLoadComments} onSyncPost={handleSyncPost} />
                  : <AdCard key={(item as Ad).id} ad={item as Ad} onReact={(id, react) => {}} onShare={(ad) => setSharingContent({content: ad.headline, url: `ad/${ad.id}`})} onSearchTag={setSearchQuery} />
              })
            )}
          </div>
        </div>
      )}
      {view.type === 'profile' && (
        <ProfileView
          user={allUsers.find(u => u.id === (view.targetId || currentUser.id)) || currentUser}
          posts={posts.filter(p => p.author.id === (view.targetId || currentUser.id))}
          ads={ads}
          adRefreshTick={adSubsRefreshTick}
          currentUser={currentUser}
          allUsers={allUsers}
          onBack={() => navigateToView({ type: 'feed' })}
          onLike={handleLike}
          onComment={handleComment}
          onLoadComments={handleLoadComments}
          onSendConnectionRequest={handleSendConnectionRequest}
          onReact={handleReact}
          onViewProfile={(id) => navigateToView({ type: 'profile', targetId: id })}
          onShare={() => {}}
          onAddAcquaintance={handleAddAcquaintance}
          onRemoveAcquaintance={handleRemoveAcquaintance}
          onSearchTag={setSearchQuery}
          onBoostPost={handleBoostPost}
          onBoostUser={handleBoostUser}
          onEditProfile={() => setIsSettingsOpen(true)}
          onDeletePost={handleDeletePost}
          onDeleteComment={handleDeleteComment}
          onSerendipityMode={handleOpenSerendipity}
          onOpenMessaging={(userId) => navigateToView({ type: 'chat', targetId: userId || '' })}
          onCancelAd={async (id) => {
            // Optimistic update
            setAds(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a));
            
            try {
              const token = localStorage.getItem('aura_auth_token') || '';
              const response = await fetch(`${API_BASE_URL}/ads/${id}/status`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'cancelled' })
              });
              
              if (response.status === 404) {
                // Ad doesn't exist on server, consider it successfully cancelled/removed
                console.log(`[AdManager] Ad ${id} not found on server, keeping local cancellation.`);
                return;
              }

              const result = await response.json();
              if (result.success && result.data) {
                setAds(prev => prev.map(a => a.id === id ? { ...a, ...result.data } : a));
              }
            } catch (e) {
              // Keep the optimistic update or revert if critical
              console.error('Failed to cancel ad remotely:', e);
            } finally {
              setAdSubsRefreshTick(prev => prev + 1);
            }
          }}
          onUpdateAd={async (adId, updates) => {
            try {
              const token = localStorage.getItem('aura_auth_token') || '';
              const response = await fetch(`${API_BASE_URL}/ads/${adId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
              });
              const result = await response.json();
              if (result.success && result.data) {
                setAds(prev => prev.map(a => a.id === adId ? { ...a, ...result.data } : a));
                setAdSubsRefreshTick(prev => prev + 1);
                return true;
              }
              return false;
            } catch (e) {
              console.error('Failed to update ad:', e);
              return false;
            }
          }}
          onOpenAdManager={() => setIsAdManagerOpen(true)}
        />
      )}
      {view.type === 'chat' && <ChatView currentUser={currentUser} allUsers={allUsers} acquaintances={allUsers.filter(u => currentUser.acquaintances?.includes(u.id))} onBack={() => navigateToView({ type: 'feed' })} initialContactId={view.targetId} />}
      {view.type === 'acquaintances' && (
        <AcquaintancesView 
          currentUser={currentUser} 
          acquaintances={allUsers.filter(u => currentUser.acquaintances?.includes(u.id))} 
          onViewProfile={(id) => navigateToView({ type: 'profile', targetId: id })} 
          onViewChat={(id) => navigateToView({ type: 'chat', targetId: id })} 
          onRemoveAcquaintance={handleRemoveAcquaintance} 
          onBack={() => navigateToView({ type: 'feed' })} 
        />
      )}
      {view.type === 'data_aura' && <DataAuraView currentUser={currentUser} allUsers={allUsers} posts={posts.filter(p => p.author.id === currentUser.id)} onBack={() => navigateToView({ type: 'feed' })} onPurchaseGlow={handlePurchaseGlow} onClearData={() => {}} onViewProfile={(id) => navigateToView({ type: 'profile', targetId: id })} onOpenCreditStore={() => setIsCreditStoreOpen(true)} />}
      {isSettingsOpen && (
        <SettingsModal
          currentUser={currentUser}
          onClose={() => setIsSettingsOpen(false)}
          onUpdate={handleUpdateProfile}
          requireCompletion={isProfileCompletionRequired}
        />
      )}
      {isAdManagerOpen && (
        <AdManager
          currentUser={currentUser}
          ads={ads}
          onAdCreated={handleAdCreated}
          onAdCancelled={(id) => setAds(ads.filter(a => a.id !== id))}
          onAdUpdated={async (adId, updates) => {
            try {
              const token = localStorage.getItem('aura_auth_token') || '';
              const response = await fetch(`${API_BASE_URL}/ads/${adId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
              });
              const result = await response.json();
              if (result.success && result.data) {
                setAds(prev => prev.map(a => a.id === adId ? { ...a, ...result.data } : a));
                setAdSubsRefreshTick(prev => prev + 1);
                return true;
              }
              return false;
            } catch (e) {
              console.error('Failed to update ad:', e);
              return false;
            }
          }}
          onClose={() => {
            setIsAdManagerOpen(false);
            setAdSubsRefreshTick(prev => prev + 1);
          }}
          onGoToAdPlans={() => {
            setIsAdManagerOpen(false);
            setAdSubsRefreshTick(prev => prev + 1);
            navigateToView({ type: 'profile', targetId: currentUser.id });
          }}
        />
      )}
      {isCreditStoreOpen && <CreditStoreModal currentUser={currentUser} bundles={CREDIT_BUNDLES} onPurchase={handlePurchaseCredits} onClose={() => setIsCreditStoreOpen(false)} />}
      {sharingContent && <ShareModal content={sharingContent.content} url={sharingContent.url} onClose={() => setSharingContent(null)} />}
      <SerendipityModal
        isOpen={isSerendipityOpen}
        onClose={() => setIsSerendipityOpen(false)}
        onNavigateToProfile={handleNavigateFromSerendipity}
        onMessage={handleSerendipityMessage}
        onRefresh={handleRefreshSerendipity}
        onConnect={handleSerendipityConnect}
        onSkip={handleSerendipitySkip}
        matches={serendipityMatches}
        isLoading={isSerendipityLoading}
      />
    </Layout>
  );
};

export default App;
