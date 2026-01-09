import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppContent from './components/AppContent';
import { INITIAL_POSTS, INITIAL_ADS, MOCK_USERS } from './constants';
import { Post, User, Ad, Notification, EnergyType, Comment, CreditBundle } from './types';

const STORAGE_KEY = 'aura_user_session';
const POSTS_KEY = 'aura_posts_data';
const ADS_KEY = 'aura_ads_data';
const USERS_KEY = 'aura_all_users';

// Session management utilities
const saveSession = (user: User) => {
  try {
    const sessionData = {
      user,
      timestamp: Date.now(),
      version: '1.0'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    console.log('Session saved successfully:', sessionData);
  } catch (error) {
    console.error('Failed to save session:', error);
  }
};

const loadSession = (): { user: User | null; isValid: boolean } => {
  try {
    const sessionData = localStorage.getItem(STORAGE_KEY);
    if (!sessionData) {
      console.log('No session found in localStorage');
      return { user: null, isValid: false };
    }

    const parsed = JSON.parse(sessionData);
    
    // Check session age (30 days expiration)
    const sessionAge = Date.now() - parsed.timestamp;
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    if (sessionAge > maxAge) {
      console.log('Session expired, removing...');
      localStorage.removeItem(STORAGE_KEY);
      return { user: null, isValid: false };
    }

    console.log('Valid session loaded:', parsed.user);
    return { user: parsed.user, isValid: true };
  } catch (error) {
    console.error('Failed to load session:', error);
    localStorage.removeItem(STORAGE_KEY);
    return { user: null, isValid: false };
  }
};

interface BirthdayAnnouncement {
  id: string;
  user: User;
  wish: string;
  reactions: Record<string, number>;
  userReactions: string[];
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
  const [sharingContent, setSharingContent] = useState<{ content: string; url: string; title?: string; image?: string } | null>(null);
  
  const [view, setView] = useState<{type: 'feed' | 'profile' | 'chat' | 'acquaintances' | 'data_aura', targetId?: string}>({ type: 'feed' });

  useEffect(() => {
    const savedUsers = localStorage.getItem(USERS_KEY);
    const usersToProcess = savedUsers ? JSON.parse(savedUsers) : MOCK_USERS;
    setAllUsers(usersToProcess);

    // Load and validate session
    const { user: sessionUser, isValid } = loadSession();
    
    if (isValid && sessionUser) {
      // Find user by ID in latest users list to get fresh profile data
      let refreshedUser = usersToProcess.find((u: User) => u.id === sessionUser.id);
      
      if (refreshedUser) {
        // Merge persistent data from session with refreshed user data
        refreshedUser = {
          ...refreshedUser,
          // Preserve avatar and coverImage from session if they exist and are data URLs or custom uploaded ones
          avatar: (sessionUser.avatar && !sessionUser.avatar.includes('dicebear.com')) ? sessionUser.avatar : refreshedUser.avatar,
          avatarType: (sessionUser.avatar && !sessionUser.avatar.includes('dicebear.com')) ? sessionUser.avatarType : refreshedUser.avatarType,
          coverImage: sessionUser.coverImage ? sessionUser.coverImage : refreshedUser.coverImage,
          coverType: sessionUser.coverType ? sessionUser.coverType : refreshedUser.coverType,
          // Preserve user-specific data that might have changed
          auraCredits: sessionUser.auraCredits || refreshedUser.auraCredits,
          trustScore: sessionUser.trustScore || refreshedUser.trustScore,
          activeGlow: sessionUser.activeGlow || refreshedUser.activeGlow,
          acquaintances: sessionUser.acquaintances || refreshedUser.acquaintances || [],
          blockedUsers: sessionUser.blockedUsers || refreshedUser.blockedUsers || [],
        };
      } else {
        // If user not found in usersToProcess, use the session user as-is but ensure required fields exist
        refreshedUser = {
          ...sessionUser,
          acquaintances: sessionUser.acquaintances || [],
          blockedUsers: sessionUser.blockedUsers || [],
        };
      }
      
      setCurrentUser(refreshedUser);
      setIsAuthenticated(true);
      console.log('User authenticated successfully on app load');
    } else {
      console.log('No valid session found - user needs to login');
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
    if (!loading) {
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); 
    }
  }, [posts, loading]);
  
  useEffect(() => { 
    if (!loading) {
      localStorage.setItem(ADS_KEY, JSON.stringify(ads)); 
    }
  }, [ads, loading]);
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
    console.log('Login attempt:', userData);
    
    const existingUser = allUsers.find(u => 
      (userData.email && u.email.toLowerCase() === userData.email.toLowerCase()) || 
      (userData.handle && u.handle.toLowerCase() === userData.handle.toLowerCase()) || 
      (userData.id && u.id === userData.id)
    );

    if (existingUser) {
      console.log('Found existing user:', existingUser);
      setCurrentUser(existingUser);
      setIsAuthenticated(true);
      saveSession(existingUser);
      return;
    }

    const newUser: User = {
      id: userData.id || `user-${Date.now()}`, 
      ...userData,
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.firstName}${userData.lastName}${Date.now()}`,
      avatarType: 'image', 
      handle: userData.handle || ('@' + userData.firstName.toLowerCase().replace(/\s+/g, '') + userData.lastName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 100)),
      name: userData.name || `${userData.firstName} ${userData.lastName}`,
      acquaintances: [], 
      blockedUsers: [], 
      trustScore: 10, 
      auraCredits: 50, 
      activeGlow: 'none'
    };
    
    console.log('Creating new user:', newUser);
    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    setCurrentUser(newUser);
    setNotifications([]);
    setIsAuthenticated(true);
    saveSession(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    console.log('New user created and session saved');
  };

  const handleUpdateProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, ...updates };
    if (updates.firstName && updates.lastName) updatedUser.name = `${updates.firstName} ${updates.lastName}`;
    setCurrentUser(updatedUser);
    
    // Update in allUsers array with quota error handling
    setAllUsers(prev => {
      const updatedUsers = prev.map(u => u.id === currentUser.id ? updatedUser : u);
      try {
        localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      } catch (error) {
        console.error('Failed to save users to localStorage:', error);
        // Try to save with reduced data if quota exceeded
        const reducedUsers = updatedUsers.map(u => ({
          ...u,
          avatar: u.avatar?.includes('data:') ? undefined : u.avatar,
          coverImage: u.coverImage?.includes('data:') ? undefined : u.coverImage
        }));
        localStorage.setItem(USERS_KEY, JSON.stringify(reducedUsers));
      }
      return updatedUsers;
    });
    
    // Save updated session
    saveSession(updatedUser);
  };

  const handlePost = (content: string, mediaUrl?: string, mediaType?: any, taggedUserIds?: string[], documentName?: string, energy?: EnergyType) => {
    if (!currentUser) return;
    
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
    if (!currentUser) return;
    
    const boostCost = 50;
    const isSpecialUser = currentUser.email?.toLowerCase() === 'danelloosthuizen3@gmail.com';
    
    if (!isSpecialUser && (currentUser.auraCredits || 0) < boostCost) {
      setIsCreditStoreOpen(true);
      return;
    }
    
    if (!isSpecialUser) {
      handleUpdateProfile({ auraCredits: (currentUser.auraCredits || 0) - boostCost });
    }
    
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, radiance: p.radiance + 100, isBoosted: true } : p));
  }, [currentUser?.auraCredits, currentUser?.email, handleUpdateProfile]);

  const handleBoostUser = useCallback((userId: string) => {
    if (!currentUser) return;
    
    const boostCost = 200;
    const isSpecialUser = currentUser.email?.toLowerCase() === 'danelloosthuizen3@gmail.com';
    
    if (!isSpecialUser && (currentUser.auraCredits || 0) < boostCost) {
      setIsCreditStoreOpen(true);
      return;
    }
    
    if (!isSpecialUser) {
      handleUpdateProfile({ auraCredits: (currentUser.auraCredits || 0) - boostCost });
    }
    
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, trustScore: Math.min(100, u.trustScore + 10), auraCredits: u.auraCredits + 50 } : u));
  }, [currentUser?.auraCredits, currentUser?.email, handleUpdateProfile]);

  const handleAuraShare = useCallback((sharedPost: any) => {
    // Add the shared post to the feed
    setPosts(prev => [sharedPost, ...prev]);
    
    // Show success message
    alert('Post shared to Aura feed successfully!');
  }, [setPosts]);

  const handlePurchaseCredits = (bundle: CreditBundle) => {
    if (!currentUser) return;
    
    const updatedCredits = (currentUser.auraCredits || 0) + bundle.credits;
    handleUpdateProfile({ auraCredits: updatedCredits });
  };

  const handleComment = useCallback((postId: string, text: string, parentId?: string) => {
    if (!currentUser) return;
    
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
    if (!currentUser) return;
    
    if (currentUser.id === targetUser.id) return;
    
    const acquaintances = currentUser.acquaintances || [];
    const sentConnectionRequests = currentUser.sentConnectionRequests || [];
    
    if (acquaintances.includes(targetUser.id)) return;
    if (sentConnectionRequests.includes(targetUser.id)) return;

    const newNotification: Notification = {
      id: `notif-conn-${Date.now()}`,
      type: 'connection_request',
      fromUser: currentUser,
      message: 'wants to connect with you',
      timestamp: Date.now(),
      isRead: false
    };

    const updatedCurrentUser = {
      ...currentUser,
      acquaintances: acquaintances,
      sentConnectionRequests: [...sentConnectionRequests, targetUser.id]
    };
    setCurrentUser(updatedCurrentUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCurrentUser));

    setAllUsers(prev => {
      const updatedUsers = prev.map(u => {
        if (u.id === currentUser.id) return updatedCurrentUser;
        if (u.id === targetUser.id) {
          return {
            ...u,
            notifications: [newNotification, ...(u.notifications || [])]
          };
        }
        return u;
      });
      localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      return updatedUsers;
    });
  }, [currentUser]);

  const handleAcceptConnection = useCallback((notification: Notification) => {
    if (!currentUser) return;
    
    const requesterId = notification.fromUser.id;
    
    const updatedCurrentUser = {
      ...currentUser,
      acquaintances: Array.from(new Set([...(currentUser.acquaintances || []), requesterId])),
      notifications: (currentUser.notifications || []).map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    };
    
    setCurrentUser(updatedCurrentUser);
    setNotifications(updatedCurrentUser.notifications || []);
    
    setAllUsers(prev => {
      const updatedUsers = prev.map(u => {
        if (u.id === currentUser.id) return updatedCurrentUser;
        if (u.id === requesterId) {
          return {
            ...u,
            sentConnectionRequests: (u.sentConnectionRequests || []).filter(id => id !== currentUser.id),
            acquaintances: Array.from(new Set([...(u.acquaintances || []), currentUser.id]))
          };
        }
        return u;
      });
      localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      return updatedUsers;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCurrentUser));
  }, [currentUser]);

  const handleRemoveAcquaintance = useCallback((userId: string) => {
    if (!currentUser) return;
    
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

  useEffect(() => {
    (window as any).handleAcceptConnection = handleAcceptConnection;
    return () => { delete (window as any).handleAcceptConnection; };
  }, [handleAcceptConnection]);

  return (
    <Router>
      <Routes>
        <Route path="/*" element={
          <AppContent
            isAuthenticated={isAuthenticated}
            currentUser={currentUser}
            allUsers={allUsers}
            posts={posts}
            ads={ads}
            birthdayAnnouncements={birthdayAnnouncements}
            notifications={notifications}
            loading={loading}
            searchQuery={searchQuery}
            activeEnergy={activeEnergy}
            activeMediaType={activeMediaType}
            isSettingsOpen={isSettingsOpen}
            isAdManagerOpen={isAdManagerOpen}
            isCreditStoreOpen={isCreditStoreOpen}
            isDarkMode={isDarkMode}
            sharingContent={sharingContent}
            view={view}
            setIsAuthenticated={setIsAuthenticated}
            setCurrentUser={setCurrentUser}
            setAllUsers={setAllUsers}
            setPosts={setPosts}
            setAds={setAds}
            setBirthdayAnnouncements={setBirthdayAnnouncements}
            setNotifications={setNotifications}
            setLoading={setLoading}
            setSearchQuery={setSearchQuery}
            setActiveEnergy={setActiveEnergy}
            setActiveMediaType={setActiveMediaType}
            setIsSettingsOpen={setIsSettingsOpen}
            setIsAdManagerOpen={setIsAdManagerOpen}
            setIsCreditStoreOpen={setIsCreditStoreOpen}
            setIsDarkMode={setIsDarkMode}
            setSharingContent={setSharingContent}
            setView={setView}
            handleLogin={handleLogin}
            handleUpdateProfile={handleUpdateProfile}
            handlePost={handlePost}
            handleDeletePost={handleDeletePost}
            handleDeleteComment={handleDeleteComment}
            handleLike={handleLike}
            handleBoostPost={handleBoostPost}
            handleBoostUser={handleBoostUser}
            handleComment={handleComment}
            handleReact={handleReact}
            handleAddAcquaintance={handleAddAcquaintance}
            handleAcceptConnection={handleAcceptConnection}
            handleRemoveAcquaintance={handleRemoveAcquaintance}
            handlePurchaseCredits={handlePurchaseCredits}
            handleAuraShare={handleAuraShare}
            toggleDarkMode={toggleDarkMode}
          />
        } />
      </Routes>
    </Router>
  );
};

export default App;
