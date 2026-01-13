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
import { UserService } from './services/userService';
import { SearchResult } from './services/searchService';
import { MessageService } from './services/messageService';
import { CommentService } from './services/commentService';
import AIContentGenerator from './components/AIContentGenerator';

const STORAGE_KEY = 'aura_user_session';
const POSTS_KEY = 'aura_posts_data';
const ADS_KEY = 'aura_ads_data';
const USERS_KEY = 'aura_all_users';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://aura-back-s1bw.onrender.com/api';
const SHARE_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

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
  const [isAIContentGeneratorOpen, setIsAIContentGeneratorOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sharingContent, setSharingContent] = useState<{ content: string; url: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [messagePulse, setMessagePulse] = useState(false);
  const prevUnreadRef = React.useRef(0);
  const [aiSetPostContent, setAiSetPostContent] = useState<(content: string) => void>(() => () => {});

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

    const initAuth = async () => {
      // Check for token in URL (from OAuth redirect)
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      
      // Get token from URL or storage
      let token = urlToken || localStorage.getItem('aura_auth_token');
      
      if (urlToken) {
        // Clear token from URL to keep it clean
        window.history.replaceState({}, document.title, window.location.pathname);
        localStorage.setItem('aura_auth_token', urlToken);
      }

      let authenticatedWithToken = false;

      if (token) {
        try {
          const result = await UserService.getMe(token);
          if (result.success && result.user) {
            setCurrentUser(result.user);
            setIsAuthenticated(true);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
            authenticatedWithToken = true;
          } else {
            // Token invalid
            localStorage.removeItem('aura_auth_token');
          }
        } catch (error) {
          console.error('Auth token verification failed:', error);
        }
      }

      if (!authenticatedWithToken) {
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
      }

      const savedPosts = localStorage.getItem(POSTS_KEY);
      const savedAds = localStorage.getItem(ADS_KEY);

      // Load posts from backend so deletes/creates reflect globally
      try {
        const tokenHdr = localStorage.getItem('aura_auth_token') || '';
        const resp = await fetch(`${API_BASE_URL}/posts?page=1&limit=50`, {
          headers: {
            'Content-Type': 'application/json',
            ...(tokenHdr ? { 'Authorization': `Bearer ${tokenHdr}` } : {})
          },
          credentials: 'include' as RequestCredentials
        });
        const result = await resp.json().catch(() => ({} as any));
        if (resp.ok && result?.success && Array.isArray(result.data)) {
          const serverPosts = result.data.map((p: Post) => ({ ...p, comments: p.comments || [] }));
          setPosts(serverPosts);
          try { localStorage.setItem(POSTS_KEY, JSON.stringify(serverPosts)); } catch {}
          
          // Clean up any orphaned session reactions for posts that no longer exist
          const serverPostIds = new Set(serverPosts.map((p: Post) => p.id));
          const keysToRemove: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('reaction_') && key.includes(currentUser.id)) {
              const postId = key.split('_')[1];
              if (postId && !serverPostIds.has(postId)) {
                keysToRemove.push(key);
              }
            }
            if (key && key.startsWith('comment_reaction_') && key.includes(currentUser.id)) {
              keysToRemove.push(key); // Clean up comment reactions too for simplicity
            }
          }
          keysToRemove.forEach(key => sessionStorage.removeItem(key));
          
        } else {
          console.warn('Backend posts fetch failed, falling back to local', { status: resp.status, body: result });
          setPosts(savedPosts ? JSON.parse(savedPosts) : INITIAL_POSTS);
        }
      } catch (e) {
        console.warn('Error fetching posts from backend, falling back to local', e);
        setPosts(savedPosts ? JSON.parse(savedPosts) : INITIAL_POSTS);
      }

      setAds(savedAds ? JSON.parse(savedAds) : INITIAL_ADS);

      // Load ads from backend
      try {
        const tokenHdr = localStorage.getItem('aura_auth_token') || '';
        const adsResp = await fetch(`${API_BASE_URL}/ads?page=1&limit=10`, {
          headers: {
            'Content-Type': 'application/json',
            ...(tokenHdr ? { 'Authorization': `Bearer ${tokenHdr}` } : {})
          },
          credentials: 'include' as RequestCredentials
        });
        const adsResult = await adsResp.json().catch(() => ({} as any));
        if (adsResp.ok && adsResult?.success && Array.isArray(adsResult.data)) {
          setAds(adsResult.data);
          try { localStorage.setItem(ADS_KEY, JSON.stringify(adsResult.data)); } catch {}
        } else {
          console.warn('Backend ads fetch failed, using local/initial ads', { status: adsResp.status, body: adsResult });
        }
      } catch (e) {
        console.warn('Error fetching ads from backend, using local/initial ads', e);
      }

      // Optional eager hydration of comments for first N posts
      try {
        const firstN = 5;
        const targets = (savedPosts ? JSON.parse(savedPosts) : undefined) ? posts.slice(0, firstN) : posts.slice(0, firstN);
        const hydrated = await Promise.allSettled(targets.map(async (p) => {
          const resp = await CommentService.getComments(p.id);
          return resp.success ? { id: p.id, comments: resp.data || [] } : { id: p.id, comments: [] };
        }));
        setPosts(prev => prev.map(p => {
          const found = hydrated.find(r => (r.status === 'fulfilled') && (r as any).value.id === p.id) as any;
          if (found && found.value) {
            return { ...p, comments: found.value.comments };
          }
          return p;
        }));
      } catch {}

      setLoading(false);
    };

    initAuth();

    return () => {
      clearInterval(syncInterval);
    };
  }, []);

  useEffect(() => {
    const handleOpenAI = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setIsAIContentGeneratorOpen(true);
      if (detail.setPostContent) {
        setAiSetPostContent(() => detail.setPostContent);
        (window as any).setPostContent = detail.setPostContent;
      }
    };
    window.addEventListener('openAIContentGenerator', handleOpenAI as EventListener);
    return () => {
      window.removeEventListener('openAIContentGenerator', handleOpenAI as EventListener);
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

  // Live sync reactions and comment counts
  useEffect(() => {
    if (!isAuthenticated) return;
    let intervalId: number | undefined;
    const syncPosts = async () => {
      try {
        const tokenHdr = localStorage.getItem('aura_auth_token') || '';
        const resp = await fetch(`${API_BASE_URL}/posts?page=1&limit=50`, {
          headers: {
            'Content-Type': 'application/json',
            ...(tokenHdr ? { 'Authorization': `Bearer ${tokenHdr}` } : {})
          },
          credentials: 'include' as RequestCredentials
        });
        const result = await resp.json().catch(() => ({} as any));
        if (resp.ok && result?.success && Array.isArray(result.data)) {
          setPosts(prev => prev.map(p => {
            const latest = result.data.find((d: any) => d.id === p.id);
            if (!latest) return p;
            return {
              ...p,
              reactions: latest.reactions || p.reactions,
              userReactions: latest.userReactions || p.userReactions,
              commentCount: typeof latest.commentCount === 'number' ? latest.commentCount : p.commentCount
            };
          }));
        }
      } catch {
        // ignore network errors in background sync
      }
    };
    syncPosts();
    intervalId = window.setInterval(syncPosts, 7000);
    return () => { if (intervalId) window.clearInterval(intervalId); };
  }, [isAuthenticated]);

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

  // Restore session reactions when posts are loaded
  useEffect(() => {
    if (posts.length > 0 && currentUser.id) {
      setPosts(prev => prev.map(post => {
        const sessionKey = `reaction_${post.id}_${currentUser.id}`;
        const sessionReactions = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
        
        // Restore post reactions
        let updatedPost = { ...post };
        if (sessionReactions.length > 0) {
          // Merge session reactions with existing userReactions
          const mergedUserReactions = Array.from(new Set([...(post.userReactions || []), ...sessionReactions]));
          
          // Update reaction counts for session reactions
          const updatedReactions = { ...post.reactions };
          sessionReactions.forEach((emoji: string) => {
            if (!(post.userReactions || []).includes(emoji)) {
              updatedReactions[emoji] = (updatedReactions[emoji] || 0) + 1;
            }
          });
          
          updatedPost = {
            ...post,
            reactions: updatedReactions,
            userReactions: mergedUserReactions
          };
        }
        
        // Restore comment reactions
        if (post.comments && post.comments.length > 0) {
          const updatedComments = post.comments.map(comment => {
            const commentSessionKey = `comment_reaction_${comment.id}_${currentUser.id}`;
            const commentSessionReactions = JSON.parse(sessionStorage.getItem(commentSessionKey) || '[]');
            
            if (commentSessionReactions.length > 0) {
              const mergedCommentUserReactions = Array.from(new Set([...(comment.userReactions || []), ...commentSessionReactions]));
              
              const updatedCommentReactions = { ...comment.reactions };
              commentSessionReactions.forEach((emoji: string) => {
                if (!(comment.userReactions || []).includes(emoji)) {
                  updatedCommentReactions[emoji] = (updatedCommentReactions[emoji] || 0) + 1;
                }
              });
              
              return {
                ...comment,
                reactions: updatedCommentReactions,
                userReactions: mergedCommentUserReactions
              };
            }
            
            return comment;
          });
          
          updatedPost = { ...updatedPost, comments: updatedComments };
        }
        
        return updatedPost;
      }));
    }
  }, [posts.length, currentUser.id]);

  // Restore session reactions for ads
  useEffect(() => {
    if (ads.length > 0 && currentUser.id) {
      setAds(prev => prev.map(ad => {
        const sessionKey = `ad_reaction_${ad.id}_${currentUser.id}`;
        const sessionReactions = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
        
        if (sessionReactions.length > 0) {
          // Merge session reactions with existing userReactions
          const mergedUserReactions = Array.from(new Set([...(ad.userReactions || []), ...sessionReactions]));
          
          // Update reaction counts for session reactions
          const updatedReactions = { ...ad.reactions };
          sessionReactions.forEach((emoji: string) => {
            if (!(ad.userReactions || []).includes(emoji)) {
              updatedReactions[emoji] = (updatedReactions[emoji] || 0) + 1;
            }
          });
          
          return {
            ...ad,
            reactions: updatedReactions,
            userReactions: mergedUserReactions
          };
        }
        
        return ad;
      }));
    }
  }, [ads.length, currentUser.id]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handlePost = async (content: string, mediaUrl?: string, mediaType?: any, taggedUserIds?: string[], documentName?: string, energy?: EnergyType) => {
    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify({ content, mediaUrl, mediaType, energy, authorId: currentUser.id })
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || !data?.success || !data?.data) {
        console.error('Create post failed', { status: res.status, body: data });
        alert('Failed to create post.');
        return;
      }
      const createdPost: Post = data.data;
      setPosts([createdPost, ...posts]);
    } catch (e) {
      console.error('Error creating post:', e);
      alert('Network error while creating post.');
    }
  };

  const handleTimeCapsule = useCallback(async (data: any) => {
    const content = data.timeCapsuleTitle ? `${data.timeCapsuleTitle}: ${data.content}` : data.content;
    
    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify({ 
          content,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          energy: data.energy || EnergyType.NEUTRAL,
          authorId: currentUser.id,
          // Time Capsule specific fields
          isTimeCapsule: true,
          unlockDate: data.unlockDate,
          timeCapsuleType: data.timeCapsuleType,
          invitedUsers: data.invitedUsers,
          timeCapsuleTitle: data.timeCapsuleTitle
        })
      });
      const responseData = await res.json().catch(() => ({} as any));
      if (!res.ok || !responseData?.success || !responseData?.data) {
        console.error('Create Time Capsule failed', { status: res.status, body: responseData });
        alert('Failed to create Time Capsule.');
        return;
      }
      const createdPost: Post = {
        ...responseData.data,
        isTimeCapsule: true,
        unlockDate: data.unlockDate,
        isUnlocked: Date.now() >= (data.unlockDate || 0),
        timeCapsuleType: data.timeCapsuleType,
        invitedUsers: data.invitedUsers,
        timeCapsuleTitle: data.timeCapsuleTitle
      };
      setPosts([createdPost, ...posts]);
    } catch (e) {
      console.error('Error creating Time Capsule:', e);
      alert('Network error while creating Time Capsule.');
    }
  }, [currentUser, posts]);

  const handleGenerateAIContent = useCallback(async (prompt: string) => {
    return geminiService.generateContent(prompt);
  }, []);

  const handleReaction = useCallback(async (postId: string, emoji: string) => {
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newReactions = { ...p.reactions };
        const newUserReactions = [...(p.userReactions || [])];

        if (newUserReactions.includes(emoji)) {
          newReactions[emoji] = Math.max(0, (newReactions[emoji] || 0) - 1);
          const index = newUserReactions.indexOf(emoji);
          newUserReactions.splice(index, 1);
          if (newReactions[emoji] === 0) {
            delete newReactions[emoji];
          }
        } else {
          newReactions[emoji] = (newReactions[emoji] || 0) + 1;
          newUserReactions.push(emoji);
        }

        // Store reaction in session storage for persistence until page refresh
        const sessionKey = `reaction_${postId}_${currentUser.id}`;
        const sessionReactions = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
        if (newUserReactions.includes(emoji)) {
          if (!sessionReactions.includes(emoji)) {
            sessionReactions.push(emoji);
          }
        } else {
          const idx = sessionReactions.indexOf(emoji);
          if (idx > -1) {
            sessionReactions.splice(idx, 1);
          }
        }
        sessionStorage.setItem(sessionKey, JSON.stringify(sessionReactions));

        return { ...p, reactions: newReactions, userReactions: newUserReactions };
      }
      return p;
    }));

    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/posts/${postId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ reaction: emoji, userId: currentUser.id })
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to react');
      }

      // Update with server response to ensure consistency
      if (data.data) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              reactions: data.data.reactions || {},
              userReactions: data.data.userReactions || []
            };
          }
          return p;
        }));
      }
    } catch (e) {
      console.error('Reaction failed, rolling back:', e);
      // Rollback by toggling again
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const newReactions = { ...p.reactions };
          const newUserReactions = [...(p.userReactions || [])];
          
          if (newUserReactions.includes(emoji)) {
            newReactions[emoji] = Math.max(0, (newReactions[emoji] || 0) - 1);
            const index = newUserReactions.indexOf(emoji);
            newUserReactions.splice(index, 1);
            if (newReactions[emoji] === 0) {
              delete newReactions[emoji];
            }
          } else {
            newReactions[emoji] = (newReactions[emoji] || 0) + 1;
            newUserReactions.push(emoji);
          }

          // Rollback session storage too
          const sessionKey = `reaction_${postId}_${currentUser.id}`;
          const sessionReactions = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
          if (newUserReactions.includes(emoji)) {
            if (!sessionReactions.includes(emoji)) {
              sessionReactions.push(emoji);
            }
          } else {
            const idx = sessionReactions.indexOf(emoji);
            if (idx > -1) {
              sessionReactions.splice(idx, 1);
            }
          }
          sessionStorage.setItem(sessionKey, JSON.stringify(sessionReactions));

          return { ...p, reactions: newReactions, userReactions: newUserReactions };
        }
        return p;
      }));
    }
  }, [currentUser.id]);

  const handleCommentReaction = useCallback(async (postId: string, commentId: string, emoji: string) => {
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newComments = p.comments.map(c => {
          if (c.id === commentId) {
            const newReactions = { ...c.reactions };
            const newUserReactions = [...(c.userReactions || [])];

            if (newUserReactions.includes(emoji)) {
              newReactions[emoji] = Math.max(0, (newReactions[emoji] || 0) - 1);
              const index = newUserReactions.indexOf(emoji);
              newUserReactions.splice(index, 1);
              if (newReactions[emoji] === 0) {
                delete newReactions[emoji];
              }
            } else {
              newReactions[emoji] = (newReactions[emoji] || 0) + 1;
              newUserReactions.push(emoji);
            }

            // Store comment reaction in session storage
            const sessionKey = `comment_reaction_${commentId}_${currentUser.id}`;
            const sessionReactions = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
            if (newUserReactions.includes(emoji)) {
              if (!sessionReactions.includes(emoji)) {
                sessionReactions.push(emoji);
              }
            } else {
              const idx = sessionReactions.indexOf(emoji);
              if (idx > -1) {
                sessionReactions.splice(idx, 1);
              }
            }
            sessionStorage.setItem(sessionKey, JSON.stringify(sessionReactions));

            return { ...c, reactions: newReactions, userReactions: newUserReactions };
          }
          return c;
        });
        return { ...p, comments: newComments };
      }
      return p;
    }));

    try {
      // Call backend API for comment reactions
      const { CommentService } = await import('./services/commentService');
      const result = await CommentService.reactToComment(commentId, emoji, currentUser.id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to react to comment');
      }

      // Update with server response if available
      if (result.data) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            const newComments = p.comments.map(c => {
              if (c.id === commentId) {
                return {
                  ...c,
                  reactions: result.data.reactions || {},
                  userReactions: result.data.userReactions || []
                };
              }
              return c;
            });
            return { ...p, comments: newComments };
          }
          return p;
        }));
      }
    } catch (e) {
      console.error('Comment reaction failed, rolling back:', e);
      // Rollback optimistic update
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const newComments = p.comments.map(c => {
            if (c.id === commentId) {
              const newReactions = { ...c.reactions };
              const newUserReactions = [...(c.userReactions || [])];

              if (newUserReactions.includes(emoji)) {
                newReactions[emoji] = Math.max(0, (newReactions[emoji] || 0) - 1);
                const index = newUserReactions.indexOf(emoji);
                newUserReactions.splice(index, 1);
                if (newReactions[emoji] === 0) {
                  delete newReactions[emoji];
                }
              } else {
                newReactions[emoji] = (newReactions[emoji] || 0) + 1;
                newUserReactions.push(emoji);
              }

              // Rollback session storage too
              const sessionKey = `comment_reaction_${commentId}_${currentUser.id}`;
              const sessionReactions = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
              if (newUserReactions.includes(emoji)) {
                if (!sessionReactions.includes(emoji)) {
                  sessionReactions.push(emoji);
                }
              } else {
                const idx = sessionReactions.indexOf(emoji);
                if (idx > -1) {
                  sessionReactions.splice(idx, 1);
                }
              }
              sessionStorage.setItem(sessionKey, JSON.stringify(sessionReactions));

              return { ...c, reactions: newReactions, userReactions: newUserReactions };
            }
            return c;
          });
          return { ...p, comments: newComments };
        }
        return p;
      }));
    }
  }, [currentUser.id]);

  const handleAdReaction = useCallback(async (adId: string, emoji: string) => {
    // Optimistic update
    setAds(prev => prev.map(ad => {
      if (ad.id === adId) {
        const newReactions = { ...ad.reactions };
        const newUserReactions = [...(ad.userReactions || [])];

        if (newUserReactions.includes(emoji)) {
          newReactions[emoji] = Math.max(0, (newReactions[emoji] || 0) - 1);
          const index = newUserReactions.indexOf(emoji);
          newUserReactions.splice(index, 1);
          if (newReactions[emoji] === 0) {
            delete newReactions[emoji];
          }
        } else {
          newReactions[emoji] = (newReactions[emoji] || 0) + 1;
          newUserReactions.push(emoji);
        }

        // Store ad reaction in session storage
        const sessionKey = `ad_reaction_${adId}_${currentUser.id}`;
        const sessionReactions = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
        if (newUserReactions.includes(emoji)) {
          if (!sessionReactions.includes(emoji)) {
            sessionReactions.push(emoji);
          }
        } else {
          const idx = sessionReactions.indexOf(emoji);
          if (idx > -1) {
            sessionReactions.splice(idx, 1);
          }
        }
        sessionStorage.setItem(sessionKey, JSON.stringify(sessionReactions));

        return { ...ad, reactions: newReactions, userReactions: newUserReactions };
      }
      return ad;
    }));

    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/ads/${adId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ reaction: emoji, userId: currentUser.id })
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to react to ad');
      }

      // Update with server response to ensure consistency
      if (data.data) {
        setAds(prev => prev.map(ad => {
          if (ad.id === adId) {
            return {
              ...ad,
              reactions: data.data.reactions || {},
              userReactions: data.data.userReactions || []
            };
          }
          return ad;
        }));
      }
    } catch (e) {
      console.error('Ad reaction failed, rolling back:', e);
      // Rollback optimistic update
      setAds(prev => prev.map(ad => {
        if (ad.id === adId) {
          const newReactions = { ...ad.reactions };
          const newUserReactions = [...(ad.userReactions || [])];
          
          if (newUserReactions.includes(emoji)) {
            newReactions[emoji] = Math.max(0, (newReactions[emoji] || 0) - 1);
            const index = newUserReactions.indexOf(emoji);
            newUserReactions.splice(index, 1);
            if (newReactions[emoji] === 0) {
              delete newReactions[emoji];
            }
          } else {
            newReactions[emoji] = (newReactions[emoji] || 0) + 1;
            newUserReactions.push(emoji);
          }

          // Rollback session storage too
          const sessionKey = `ad_reaction_${adId}_${currentUser.id}`;
          const sessionReactions = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
          if (newUserReactions.includes(emoji)) {
            if (!sessionReactions.includes(emoji)) {
              sessionReactions.push(emoji);
            }
          } else {
            const idx = sessionReactions.indexOf(emoji);
            if (idx > -1) {
              sessionReactions.splice(idx, 1);
            }
          }
          sessionStorage.setItem(sessionKey, JSON.stringify(sessionReactions));

          return { ...ad, reactions: newReactions, userReactions: newUserReactions };
        }
        return ad;
      }));
    }
  }, [currentUser.id]);

  const handleComment = useCallback(async (postId: string, text: string, parentId?: string) => {
    const optimistic: Comment = { id: `c-${Date.now()}`, author: currentUser, text, timestamp: Date.now(), parentId, reactions: {}, userReactions: [] };
    // Optimistic UI
    setPosts(prev => prev.map(p => p.id === postId ? { 
      ...p, 
      comments: [...(p.comments || []), optimistic],
      commentCount: (p.commentCount || (p.comments || []).length) + 1
    } : p));
    try {
      const resp = await CommentService.createComment(postId, text, currentUser.id, parentId);
      if (resp.success && resp.data) {
        // Replace optimistic with server comment (matching on text+timestamp parentId is brittle; append server comment and filter out optimistic by id prefix)
        setPosts(prev => prev.map(p => {
          if (p.id !== postId) return p;
          const comments = (p.comments || []).filter(c => c.id !== optimistic.id);
          return { ...p, comments: [...comments, resp.data as Comment] };
        }));
      } else {
        console.error('Create comment failed', resp.error);
        // Rollback optimistic
        setPosts(prev => prev.map(p => p.id === postId ? { 
          ...p, 
          comments: (p.comments || []).filter(c => c.id !== optimistic.id),
          commentCount: Math.max(0, (p.commentCount || (p.comments || []).length) - 1)
        } : p));
        alert('Failed to add comment.');
      }
    } catch (e) {
      console.error('Error creating comment:', e);
      setPosts(prev => prev.map(p => p.id === postId ? { 
        ...p, 
        comments: (p.comments || []).filter(c => c.id !== optimistic.id),
        commentCount: Math.max(0, (p.commentCount || (p.comments || []).length) - 1)
      } : p));
      alert('Network error while creating comment.');
    }
  }, [currentUser]);

  const handleDeleteComment = useCallback(async (postId: string, commentId: string) => {
    const prev = posts;
    // Optimistically remove
    setPosts(ps => ps.map(p => p.id === postId ? { 
      ...p, 
      comments: (p.comments || []).filter(c => c.id !== commentId),
      commentCount: Math.max(0, (p.commentCount || (p.comments || []).length) - 1)
    } : p));
    try {
      const resp = await CommentService.deleteComment(commentId);
      if (!resp.success) throw new Error(resp.error || 'Delete failed');
    } catch (e) {
      console.error('Delete comment failed', e);
      setPosts(prev); // rollback
      alert('Failed to delete comment.');
    }
  }, [posts]);

  const handleDeletePost = useCallback(async (postId: string) => {
    const target = posts.find(p => p.id === postId);
    if (!target) return;
    if (target.author.id !== currentUser.id) {
      alert('You can only delete your own posts.');
      return;
    }
    
    const prevPosts = posts;
    // Optimistic removal
    setPosts(prev => prev.filter(p => p.id !== postId));
    
    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include' as RequestCredentials
      });
      const data = await res.json().catch(() => ({}));
      
      // If post not found (404), it might be a local-only post (like old Time Capsules)
      // In this case, we consider the deletion successful since it's already removed from local state
      if (res.status === 404) {
        console.log(`Post ${postId} not found on server, removing from local state only`);
        // Also clean up any session storage for this post
        sessionStorage.removeItem(`reaction_${postId}_${currentUser.id}`);
        return; // Don't rollback, deletion is successful
      }
      
      if (!res.ok || (data && data.success === false)) {
        console.error('Delete post failed', { status: res.status, body: data, postId });
        throw new Error((data && data.message) || 'Failed to delete');
      }
      
      // Clean up session storage for successfully deleted posts
      sessionStorage.removeItem(`reaction_${postId}_${currentUser.id}`);
    } catch (e) {
      // Only rollback if it's not a 404 error
      if (e instanceof Error && !e.message.includes('404')) {
        setPosts(prevPosts);
        alert('Failed to delete post. Please try again.');
      }
    }
  }, [posts, currentUser.id]);

  const handleBoost = useCallback(async (postId: string, creditsToSpend: number) => {
    const prevBalance = currentUser.auraCredits || 0;
    if (prevBalance < creditsToSpend) {
      alert('Not enough credits to boost this post.');
      return;
    }

    // Optimistic UI update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, radiance: p.radiance + (creditsToSpend * 2), isBoosted: true };
      }
      return p;
    }));

    const newBalance = prevBalance - creditsToSpend;
    const updatedUser = { ...currentUser, auraCredits: newBalance };
    setCurrentUser(updatedUser);
    try {
      const res = await UserService.updateUser(currentUser.id, { auraCredits: newBalance });
      if (!res.success) throw new Error(res.error || 'Failed to update credits');
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser)); } catch {}
    } catch (e) {
      // Rollback on failure
      setCurrentUser({ ...currentUser, auraCredits: prevBalance });
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, radiance: Math.max(0, p.radiance - (creditsToSpend * 2)), isBoosted: p.isBoosted };
        }
        return p;
      }));
      alert('Failed to deduct credits. Please try again.');
    }
  }, [currentUser, posts]);

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
        
        // Update local state to show request was sent
        const updatedUser = {
          ...currentUser,
          sentAcquaintanceRequests: [...(currentUser.sentAcquaintanceRequests || []), targetUserId]
        };
        setCurrentUser(updatedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        
        // Update all users list
        setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        
        // The backend will create the notification for the target user
      } else {
        console.warn('⚠️ Failed to send connection request:', result.error);
        alert('Failed to send connection request. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error sending connection request:', error);
      alert('Network error while sending connection request.');
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

  const handleRejectAcquaintance = useCallback(async (notification: Notification) => {
    try {
      const { UserService } = await import('./services/userService');
      const result = await UserService.rejectConnectionRequest(notification.fromUser.id, currentUser.id);

      if (result.success) {
        console.log('✅ Connection request rejected successfully');

        // Mark notification as read (rejected)
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));

        // Load fresh notifications to get any rejection notification for the requester
        loadNotifications();
      } else {
        console.warn('⚠️ Failed to reject connection request:', result.error);
      }
    } catch (error) {
      console.error('❌ Error rejecting connection request:', error);
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

  const handleMarkAllNotificationsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      if (unreadNotifications.length === 0) return;

      const { NotificationService } = await import('./services/notificationService');
      
      // Use the more efficient markAllAsRead method
      const result = await NotificationService.markAllAsRead(currentUser.id);
      
      if (result.success) {
        // Update local notifications state
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } else {
        console.warn('⚠️ Failed to mark all notifications as read:', result.error);
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  }, [notifications, currentUser.id]);

  const handleNavigateNotification = useCallback((notification: Notification) => {
    console.log('🧭 Navigating to notification:', notification);
    
    switch (notification.type) {
      case 'reaction':
      case 'comment':
      case 'boost_received':
      case 'like':
        // Navigate to the specific post
        if (notification.postId) {
          setView({ type: 'feed' });
          window.history.pushState(null, '', `/post/${notification.postId}`);
          
          // Scroll to the post after a brief delay to ensure the feed is rendered
          setTimeout(() => {
            const postElement = document.getElementById(`post-${notification.postId}`);
            if (postElement) {
              postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Add a highlight effect based on notification type
              const ringColor = notification.type === 'reaction' || notification.type === 'like' 
                ? 'ring-rose-500' 
                : notification.type === 'comment' 
                ? 'ring-blue-500' 
                : 'ring-emerald-500';
              
              postElement.classList.add('ring-2', ringColor, 'ring-opacity-50', 'transition-all', 'duration-300');
              setTimeout(() => {
                postElement.classList.remove('ring-2', ringColor, 'ring-opacity-50', 'transition-all', 'duration-300');
              }, 3000);
            } else {
              // If post not found in current feed, show a message
              console.warn('⚠️ Post not found in current feed, staying on feed view');
            }
          }, 100);
        } else {
          // If no postId, go to feed
          setView({ type: 'feed' });
          window.history.pushState(null, '', '/');
        }
        break;
        
      case 'connection_request':
      case 'acquaintance_request':
        // For connection requests, don't navigate - let the user handle accept/reject
        console.log('📝 Connection request notification - no navigation needed');
        break;
        
      case 'acquaintance_accepted':
      case 'acquaintance_rejected':
      case 'profile_view':
        // Navigate to the user's profile
        if (notification.fromUser?.id) {
          setView({ type: 'profile', targetId: notification.fromUser.id });
          window.history.pushState(null, '', `/profile/${notification.fromUser.id}`);
        }
        break;
        
      case 'time_capsule_unlocked':
        // Navigate to the specific time capsule post
        if (notification.postId) {
          setView({ type: 'feed' });
          window.history.pushState(null, '', `/post/${notification.postId}`);
          
          setTimeout(() => {
            const postElement = document.getElementById(`post-${notification.postId}`);
            if (postElement) {
              postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              postElement.classList.add('ring-2', 'ring-amber-500', 'ring-opacity-50', 'transition-all', 'duration-300');
              setTimeout(() => {
                postElement.classList.remove('ring-2', 'ring-amber-500', 'ring-opacity-50', 'transition-all', 'duration-300');
              }, 3000);
            }
          }, 100);
        } else {
          setView({ type: 'feed' });
          window.history.pushState(null, '', '/');
        }
        break;
        
      case 'credit_received':
        // Navigate to credit store or data aura view
        setView({ type: 'data_aura' });
        window.history.pushState(null, '', '/data-aura');
        break;
        
      case 'message':
        // Navigate to chat with the user
        if (notification.fromUser?.id) {
          setView({ type: 'chat', targetId: notification.fromUser.id });
          window.history.pushState(null, '', `/chat/${notification.fromUser.id}`);
        }
        break;
        
      case 'share':
        // Navigate to the shared post
        if (notification.postId) {
          setView({ type: 'feed' });
          window.history.pushState(null, '', `/post/${notification.postId}`);
          
          setTimeout(() => {
            const postElement = document.getElementById(`post-${notification.postId}`);
            if (postElement) {
              postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              postElement.classList.add('ring-2', 'ring-purple-500', 'ring-opacity-50', 'transition-all', 'duration-300');
              setTimeout(() => {
                postElement.classList.remove('ring-2', 'ring-purple-500', 'ring-opacity-50', 'transition-all', 'duration-300');
              }, 3000);
            }
          }, 100);
        }
        break;
        
      default:
        // For any other notification types, go to feed
        console.log('🏠 Unknown notification type, navigating to feed');
        setView({ type: 'feed' });
        window.history.pushState(null, '', '/');
        break;
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

  // Poll unread messages count
  useEffect(() => {
    let intervalId: number | undefined;
    const pollUnread = async () => {
      if (!currentUser.id) return;
      try {
        const resp = await MessageService.getConversations(currentUser.id);
        if (resp && resp.success && Array.isArray(resp.data)) {
          const total = resp.data.reduce((sum: number, conv: any) => sum + (conv.unreadCount || conv.unread || 0), 0);
          // trigger pulse if count increased
          if (total > prevUnreadRef.current) {
            setMessagePulse(true);
            window.setTimeout(() => setMessagePulse(false), 2500);
          }
          prevUnreadRef.current = total;
          setUnreadMessageCount(total);
        }
      } catch (e) {
        // ignore errors
      }
    };
    if (isAuthenticated && currentUser.id) {
      pollUnread();
      intervalId = window.setInterval(pollUnread, 5000);
    }
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [isAuthenticated, currentUser.id]);

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
    localStorage.removeItem('aura_auth_token');
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
      onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
      onAcceptAcquaintance={handleAcceptAcquaintance}
      onRejectAcquaintance={handleRejectAcquaintance}
      onNavigateNotification={handleNavigateNotification}
      unreadMessageCount={unreadMessageCount}
      messagePulse={messagePulse}
    >
      {view.type === 'feed' && (
        <div className="space-y-8">
          <CreatePost
            currentUser={currentUser}
            onPost={handlePost}
            allUsers={allUsers}
            onTimeCapsule={handleTimeCapsule}
            onGenerateAIContent={handleGenerateAIContent}
            onCreateAd={() => setIsAdManagerOpen(true)}
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

          {filteredPosts.map((post, index) => (
            <React.Fragment key={post.id}>
              <PostCard
                post={post}
                currentUser={currentUser}
                onReact={(postId, emoji, targetType, commentId) => {
                if (targetType === 'post') return handleReaction(postId, emoji);
                if (targetType === 'comment' && commentId) return handleCommentReaction(postId, commentId, emoji);
                }}
                onComment={handleComment}
                onBoost={handleBoost}
                onShare={(post) => setSharingContent({ content: post.content, url: `${SHARE_BASE_URL}/share/post/${post.id}` })}
                onViewProfile={(id) => setView({ type: 'profile', targetId: id })}
                onSearchTag={setSearchQuery}
                onLike={() => {}}
                onSendConnectionRequest={handleSendConnectionRequest}
                allUsers={allUsers}
                onDeletePost={handleDeletePost}
                onDeleteComment={handleDeleteComment}
                onLoadComments={(postId, comments) => setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments } : p))}
              />
              
              {/* Insert ads every 3 posts */}
              {(index + 1) % 3 === 0 && ads.length > 0 && (
                <AdCard
                  key={`ad-${Math.floor(index / 3) % ads.length}`}
                  ad={ads[Math.floor(index / 3) % ads.length]}
                  onReact={handleAdReaction}
                  onShare={(ad) => setSharingContent({ content: ad.headline, url: `${SHARE_BASE_URL}/share/ad/${ad.id}` })}
                  onSearchTag={setSearchQuery}
                  onViewProfile={(id) => setView({ type: 'profile', targetId: id })}
                />
              )}
            </React.Fragment>
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
          onShare={(post) => setSharingContent({ content: post.content, url: `${SHARE_BASE_URL}/share/post/${post.id}` })}
          onSendConnectionRequest={handleSendConnectionRequest}
          onRemoveAcquaintance={handleRemoveAcquaintance}
          onAddAcquaintance={(user) => handleSendConnectionRequest(user.id)}
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
      {isCreditStoreOpen && <CreditStoreModal currentUser={currentUser} onClose={() => setIsCreditStoreOpen(false)} onPurchase={async (bundle: CreditBundle) => {
        const prev = currentUser.auraCredits || 0;
        const newBal = prev + bundle.credits;
        const updated = { ...currentUser, auraCredits: newBal };
        setCurrentUser(updated);
        try {
          const res = await UserService.updateUser(currentUser.id, { auraCredits: newBal });
          if (!res.success) throw new Error(res.error || 'Failed to update credits');
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
        } catch (e) {
          setCurrentUser({ ...currentUser, auraCredits: prev });
          alert('Failed to apply credit purchase. Please try again.');
        }
      }} bundles={CREDIT_BUNDLES} />}
      {sharingContent && <ShareModal content={sharingContent.content} url={sharingContent.url} onClose={() => setSharingContent(null)} />}
      <AIContentGenerator
        isOpen={isAIContentGeneratorOpen}
        onClose={() => setIsAIContentGeneratorOpen(false)}
        onGenerate={handleGenerateAIContent}
        onUseContent={(content: string) => {
          if (aiSetPostContent) aiSetPostContent(content);
        }}
      />
    </Layout>
  );
};

export default App;
