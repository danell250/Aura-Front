import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppContent from './components/AppContent';
import SerendipityModal from './components/SerendipityModal';
import { INITIAL_POSTS, INITIAL_ADS, MOCK_USERS, BACKEND_URL } from './constants';
import { Post, User, Ad, Notification, EnergyType, Comment, CreditBundle, Message } from './types';


import { auth, onAuthStateChanged } from './services/firebase';
import { UserService } from './services/userService';
import { CacheService } from './services/cacheService';
import { geminiService } from './services/gemini';

const STORAGE_KEY = 'aura_user_session';
const POSTS_KEY = 'aura_posts_data';
const ADS_KEY = 'aura_ads_data';
const USERS_KEY = 'aura_all_users';

// Session management utilities
const saveSession = (user: User) => {
  try {
    // Ensure all required fields are present
    const completeUser: User = {
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      handle: user.handle || `@user${Date.now()}`,
      avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      avatarType: user.avatarType || 'image',
      acquaintances: user.acquaintances || [],
      blockedUsers: user.blockedUsers || [],
      trustScore: user.trustScore ?? 10,
      auraCredits: user.auraCredits ?? 100,
      activeGlow: user.activeGlow || 'none',
      email: user.email || '',
      dob: user.dob || '',
      bio: user.bio || '',
      phone: user.phone || '',
      ...user
    };

    const sessionData = {
      user: completeUser,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    console.log('Session saved successfully');
  } catch (error) {
    console.error('Failed to save session:', error);
    // Try to clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear corrupted session:', e);
    }
  }
};

const loadSession = (): { user: User | null; isValid: boolean } => {
  try {
    const sessionData = localStorage.getItem(STORAGE_KEY);
    if (!sessionData) {
      return { user: null, isValid: false };
    }

    const parsed = JSON.parse(sessionData);
    
    // Validate session structure
    if (!parsed.user || !parsed.user.id) {
      console.warn('Invalid session structure, clearing...');
      localStorage.removeItem(STORAGE_KEY);
      return { user: null, isValid: false };
    }
    
    // Check session age (30 days expiration)
    if (parsed.timestamp) {
      const sessionAge = Date.now() - parsed.timestamp;
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      if (sessionAge > maxAge) {
        console.log('Session expired, removing...');
        localStorage.removeItem(STORAGE_KEY);
        return { user: null, isValid: false };
      }
    }

    // Ensure all required fields are present
    const user: User = {
      id: parsed.user.id,
      firstName: parsed.user.firstName || '',
      lastName: parsed.user.lastName || '',
      name: parsed.user.name || `${parsed.user.firstName || ''} ${parsed.user.lastName || ''}`.trim() || 'User',
      handle: parsed.user.handle || `@user${parsed.user.id}`,
      avatar: parsed.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${parsed.user.id}`,
      avatarType: parsed.user.avatarType || 'image',
      acquaintances: parsed.user.acquaintances || [],
      blockedUsers: parsed.user.blockedUsers || [],
      trustScore: parsed.user.trustScore ?? 10,
      auraCredits: parsed.user.auraCredits ?? 100,
      activeGlow: parsed.user.activeGlow || 'none',
      email: parsed.user.email || '',
      dob: parsed.user.dob || '',
      bio: parsed.user.bio || '',
      phone: parsed.user.phone || '',
      ...parsed.user
    };

    return { user, isValid: true };
  } catch (error) {
    console.error('Failed to load session:', error);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear corrupted session:', e);
    }
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
  const [sharingContent, setSharingContent] = useState<{ content: string; url: string; title?: string; image?: string; originalPost?: Post } | null>(null);
  
  const [view, setView] = useState<{type: 'feed' | 'profile' | 'chat' | 'acquaintances' | 'data_aura', targetId?: string}>({ type: 'feed' });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Clear expired cache first
        CacheService.clearExpiredCache();
        
        // Start with valid cached data immediately for faster perceived performance
        const cachedUsers = CacheService.getCachedUsers();
        const cachedPosts = CacheService.getCachedPosts();
        const cachedAds = CacheService.getCachedAds();
        
        console.log('Cache status:', CacheService.getCacheStatus());
        
        // Set cached data immediately if available and valid
        if (cachedUsers && cachedUsers.length > 0) {
          setAllUsers(cachedUsers);
          console.log('✅ Loaded cached users:', cachedUsers.length);
        }
        
        if (cachedPosts && cachedPosts.length > 0) {
          setPosts(cachedPosts);
          console.log('✅ Loaded cached posts:', cachedPosts.length);
        }
        
        if (cachedAds && cachedAds.length > 0) {
          setAds(cachedAds);
          console.log('✅ Loaded cached ads:', cachedAds.length);
        }

        // Load and validate session for current user immediately
        const { user: sessionUser, isValid } = loadSession();
        
        if (isValid && sessionUser) {
          setCurrentUser(sessionUser);
          setIsAuthenticated(true);
          console.log('✅ User authenticated from session');
        }
        
        // Load theme immediately
        if (localStorage.getItem('aura_theme') === 'dark') {
          setIsDarkMode(true);
          document.documentElement.classList.add('dark');
        }

        // Set loading to false immediately if we have valid cached data
        const hasValidCache = (cachedUsers && cachedUsers.length > 0) || 
                             (cachedPosts && cachedPosts.length > 0) || 
                             (cachedAds && cachedAds.length > 0);
        
        if (hasValidCache) {
          setLoading(false);
          console.log('✅ App ready with cached data');
        }

        // Now fetch fresh data in parallel (non-blocking) only if cache is invalid
        const fetchFreshData = async () => {
          try {
            console.log('🔄 Checking for fresh data...');
            
            const promises = [];
            
            // Only fetch users if cache is invalid
            if (!CacheService.isUsersCacheValid()) {
              promises.push(
                fetch(`${BACKEND_URL}/api/users`)
                  .then(res => res.ok ? res.json() : null)
                  .then(data => ({ type: 'users', data }))
                  .catch(() => ({ type: 'users', data: null }))
              );
            }
            
            // Only fetch posts if cache is invalid
            if (!CacheService.isPostsCacheValid()) {
              promises.push(
                fetch(`${BACKEND_URL}/api/posts`)
                  .then(res => res.ok ? res.json() : null)
                  .then(data => ({ type: 'posts', data }))
                  .catch(() => ({ type: 'posts', data: null }))
              );
            }
            
            // Only fetch ads if cache is invalid
            if (!CacheService.isAdsCacheValid()) {
              promises.push(
                fetch(`${BACKEND_URL}/api/ads`)
                  .then(res => res.ok ? res.json() : null)
                  .then(data => ({ type: 'ads', data }))
                  .catch(() => ({ type: 'ads', data: null }))
              );
            }

            if (promises.length === 0) {
              console.log('✅ All data is cached and valid, no fresh fetch needed');
              return;
            }

            const results = await Promise.allSettled(promises);

            results.forEach((result) => {
              if (result.status === 'fulfilled' && result.value.data) {
                const { type, data } = result.value;
                
                switch (type) {
                  case 'users':
                    const backendUsers = data.data || data;
                    if (Array.isArray(backendUsers) && backendUsers.length > 0) {
                      setAllUsers(backendUsers);
                      CacheService.setCachedUsers(backendUsers);
                      console.log('✅ Updated users from backend:', backendUsers.length);
                      
                      // Update current user if found in fresh data
                      if (sessionUser) {
                        const refreshedUser = backendUsers.find((u: User) => u.id === sessionUser.id);
                        if (refreshedUser) {
                          const mergedUser = {
                            ...refreshedUser,
                            auraCredits: refreshedUser.auraCredits ?? sessionUser.auraCredits ?? 100,
                            trustScore: refreshedUser.trustScore ?? sessionUser.trustScore ?? 10,
                            activeGlow: refreshedUser.activeGlow || sessionUser.activeGlow || 'none',
                            acquaintances: refreshedUser.acquaintances || sessionUser.acquaintances || [],
                            blockedUsers: refreshedUser.blockedUsers || sessionUser.blockedUsers || [],
                          };
                          setCurrentUser(mergedUser);
                          saveSession(mergedUser);
                        }
                      }
                    }
                    break;
                    
                  case 'posts':
                    const posts = data.posts || data;
                    if (Array.isArray(posts)) {
                      setPosts(posts);
                      CacheService.setCachedPosts(posts);
                      console.log('✅ Updated posts from backend:', posts.length);
                    }
                    break;
                    
                  case 'ads':
                    if (Array.isArray(data)) {
                      setAds(data);
                      CacheService.setCachedAds(data);
                      console.log('✅ Updated ads from backend:', data.length);
                    }
                    break;
                }
              }
            });

          } catch (error) {
            console.error('❌ Error fetching fresh data:', error);
          }
        };

        // Fetch fresh data in background
        fetchFreshData();

        // Set loading to false with minimal delay if no cached data
        if (!hasValidCache) {
          // Fallback to mock data if no cache
          if (!cachedUsers) setAllUsers(MOCK_USERS);
          if (!cachedPosts) setPosts(INITIAL_POSTS);
          if (!cachedAds) setAds(INITIAL_ADS);
          
          setTimeout(() => setLoading(false), 100);
        }

      } catch (error) {
        console.error('❌ Error during app initialization:', error);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Removed localStorage saving for posts
  
  // Removed localStorage saving for ads
  // Removed localStorage saving for users

  // Sync session whenever currentUser changes
  useEffect(() => {
    if (currentUser && !loading) {
      saveSession(currentUser);
      // Sync notifications from currentUser
      setNotifications(currentUser.notifications || []);
    }
  }, [currentUser, loading]);

  // Listen to Firebase auth state changes for Google login persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && currentUser && firebaseUser.uid === currentUser.id) {
        // Firebase user is still authenticated, ensure session is saved
        if (currentUser) {
          saveSession(currentUser);
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('aura_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const handleLogin = async (userData: any) => {
    try {
      console.log('Login attempt:', userData);
      
      // Normalize email for comparison
      const normalizedEmail = userData.email?.toLowerCase().trim();
      
      // Check if user exists using UserService
      let existingUser = null;
      if (normalizedEmail) {
        const userResult = await UserService.findUserByEmail(normalizedEmail);
        if (userResult.success && userResult.user) {
          existingUser = userResult.user;
        }
      }
      
      // Also check by handle if no email match
      if (!existingUser && userData.handle) {
        const handleResult = await UserService.userExists(undefined, userData.handle);
        if (handleResult.exists && handleResult.user) {
          existingUser = handleResult.user;
        }
      }

      if (existingUser) {
        console.log('Found existing user, logging in...');
        const isSpecialUser = normalizedEmail === 'danelloosthuizen3@gmail.com';
        
        // Update existing user with any new data from login (e.g., updated avatar from Google)
        const updatedUser: User = {
          ...existingUser,
          avatar: userData.avatar || existingUser.avatar,
          avatarType: userData.avatarType || existingUser.avatarType || 'image',
          email: normalizedEmail || existingUser.email,
          firstName: userData.firstName || existingUser.firstName,
          lastName: userData.lastName || existingUser.lastName,
          name: userData.name || existingUser.name || `${existingUser.firstName} ${existingUser.lastName}`.trim(),
          // Special user gets unlimited credits, others keep their existing credits
          auraCredits: isSpecialUser ? 999999 : existingUser.auraCredits,
        };
        
        // Update user in both MongoDB and Firestore
        await UserService.updateUser(existingUser.id, updatedUser);
        
        // Update in allUsers array
        const updatedUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
        setAllUsers(updatedUsers);
        setCurrentUser(updatedUser);
        setIsAuthenticated(true);
        saveSession(updatedUser);
        return;
      }

      // Create new user with all required fields and 100 free credits
      const userId = userData.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const firstName = userData.firstName || 'User';
      const lastName = userData.lastName || '';
      const fullName = userData.name || `${firstName} ${lastName}`.trim() || 'User';
      
      // Generate unique handle if not provided
      let handle = userData.handle;
      if (!handle) {
        const baseHandle = `@${firstName.toLowerCase().replace(/\s+/g, '')}${lastName.toLowerCase().replace(/\s+/g, '')}`;
        let counter = 0;
        handle = baseHandle;
        
        // Check handle uniqueness using UserService
        while (true) {
          const handleCheck = await UserService.userExists(undefined, handle);
          if (!handleCheck.exists) break;
          counter++;
          handle = `${baseHandle}${counter}`;
        }
      }

      const isSpecialUser = normalizedEmail === 'danelloosthuizen3@gmail.com';
      
      const newUser: User = {
        id: userId,
        firstName,
        lastName,
        name: fullName,
        handle,
        avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        avatarType: userData.avatarType || 'image',
        email: normalizedEmail || '',
        dob: userData.dob || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        industry: userData.industry || undefined,
        companyName: userData.companyName || undefined,
        acquaintances: [],
        blockedUsers: [],
        trustScore: 10,
        // New users get 100 free credits, special user gets unlimited
        auraCredits: isSpecialUser ? 999999 : 100,
        activeGlow: 'none'
      };
      
      console.log('Creating new user:', newUser);
      
      // Save user using UserService (saves to both MongoDB and Firestore)
      const saveResult = await UserService.saveUser(newUser);
      
      if (saveResult.success) {
        console.log('✅ New user saved successfully to both MongoDB and Firestore');
      } else {
        console.log('⚠️ Failed to save user to storage, but continuing with local session');
      }
      
      const updatedUsers = [...allUsers, newUser];
      setAllUsers(updatedUsers);
      setCurrentUser(newUser);
      setNotifications([]);
      setIsAuthenticated(true);
      saveSession(newUser);
      console.log('New user created and session saved');
    } catch (error) {
      console.error('Error during login:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, ...updates };
    if (updates.firstName && updates.lastName) updatedUser.name = `${updates.firstName} ${updates.lastName}`;
    setCurrentUser(updatedUser);
    
    // Update using UserService (updates both MongoDB and Firestore)
    try {
      const updateResult = await UserService.updateUser(currentUser.id, updatedUser);
      if (updateResult.success) {
        console.log('✅ User updated in both MongoDB and Firestore successfully');
      } else {
        console.log('⚠️ Failed to update user in storage:', updateResult.error);
      }
    } catch (error) {
      console.log('⚠️ Error updating user in storage:', error);
    }
    
    // Update in allUsers array
    setAllUsers(prev => {
      const updatedUsers = prev.map(u => u.id === currentUser.id ? updatedUser : u);
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

  const handleTimeCapsule = (data: any) => {
    if (!currentUser) return;
    
    const newPost: Post = {
      id: `tc-${Date.now()}`,
      author: currentUser,
      content: data.content,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      energy: data.energy || EnergyType.NEUTRAL,
      radiance: 0,
      timestamp: Date.now(),
      reactions: {},
      comments: [],
      userReactions: [],
      isBoosted: false,
      // Time Capsule specific fields
      isTimeCapsule: true,
      unlockDate: data.unlockDate,
      isUnlocked: false,
      timeCapsuleType: data.timeCapsuleType,
      invitedUsers: data.invitedUsers,
      timeCapsuleTitle: data.timeCapsuleTitle
    };
    
    setPosts([newPost, ...posts]);
    
    // Show success message
    const unlockDateStr = new Date(data.unlockDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    alert(`🎉 Time Capsule "${data.timeCapsuleTitle}" created successfully! It will unlock on ${unlockDateStr}.`);
  };

  const [serendipityModalOpen, setSerendipityModalOpen] = useState(false);
  const [serendipityContent, setSerendipityContent] = useState(null);
  
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  
  // Messaging state
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagingOpen, setMessagingOpen] = useState(false);
  
  // Function to calculate unread message counts
  const getUnreadCounts = useCallback(() => {
    const counts: Record<string, number> = {};
    messages.forEach(msg => {
      if (msg.receiverId === currentUser?.id && !msg.isRead) {
        counts[msg.senderId] = (counts[msg.senderId] || 0) + 1;
      }
    });
    return counts;
  }, [messages, currentUser?.id]);
  
  // Function to mark messages as read
  const handleMarkMessagesAsRead = useCallback((senderId: string) => {
    if (!currentUser) return;
    
    setMessages(prev => 
      prev.map(msg => 
        msg.senderId === senderId && 
        msg.receiverId === currentUser.id && 
        !msg.isRead 
          ? { ...msg, isRead: true } 
          : msg
      )
    );
  }, [currentUser]);

  const handleSerendipityMode = () => {
    if (!currentUser) return;
    
    // Combine all possible content types
    const allContent = [];
    
    // Add all posts from users in network (current user, acquaintances, and friends-of-friends)
    const networkUserIds = new Set([currentUser.id]);
    
    // Add acquaintances
    (currentUser.acquaintances || []).forEach(id => networkUserIds.add(id));
    
    // Add friends-of-friends (acquaintances of acquaintances)
    allUsers.forEach(user => {
      if (currentUser.acquaintances?.includes(user.id)) {
        (user.acquaintances || []).forEach(id => {
          if (!networkUserIds.has(id)) {
            networkUserIds.add(id);
          }
        });
      }
    });
    
    // Filter posts from network users
    const networkPosts = posts.filter(post => networkUserIds.has(post.author.id));
    
    // Add posts to allContent
    networkPosts.forEach(post => {
      allContent.push({
        type: 'post',
        content: post
      });
    });
    
    // Add ads from network users
    ads.forEach(ad => {
      if (networkUserIds.has(ad.ownerId)) {
        allContent.push({
          type: 'ad',
          content: ad
        });
      }
    });
    
    // If we have content, pick a random item
    if (allContent.length > 0) {
      const randomIndex = Math.floor(Math.random() * allContent.length);
      const randomItem = allContent[randomIndex];
      
      // Calculate time ago
      let timeLabel = '';
      if (randomItem.type === 'post') {
        const timeAgo = Math.floor((Date.now() - randomItem.content.timestamp) / (1000 * 60 * 60 * 24));
        timeLabel = `${timeAgo} days ago`;
        if (timeAgo < 1) timeLabel = 'Today';
        else if (timeAgo === 1) timeLabel = 'Yesterday';
        else if (timeAgo < 30) timeLabel = `${timeAgo} days ago`;
        else if (timeAgo < 365) timeLabel = `${Math.floor(timeAgo / 30)} months ago`;
        else timeLabel = `${Math.floor(timeAgo / 365)} years ago`;
      }
      
      // Set content for modal
      setSerendipityContent({
        type: randomItem.type,
        content: randomItem.content,
        timeAgo: timeLabel,
        authorName: randomItem.type === 'post' ? randomItem.content.author.name : randomItem.content.ownerName
      });
      
      // Open the modal
      setSerendipityModalOpen(true);
    } else {
      // Show notification for no content
      setSerendipityContent(null);
      setSerendipityModalOpen(true);
    }
  };
  
  const handleGenerateAIContent = async (prompt: string): Promise<string> => {
    try {
      // Use the existing geminiService from the imports
      const response = await geminiService.generateContent(prompt);
      return response;
    } catch (error) {
      console.error('Error generating AI content:', error);
      throw error;
    }
  };
  
  const handleSendMessage = useCallback((receiverId: string, text: string) => {
    if (!currentUser) return;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      senderId: currentUser.id,
      receiverId,
      text: text,
      timestamp: Date.now(),
      isRead: false
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Create notification for the receiver
    const receiver = allUsers.find(u => u.id === receiverId);
    if (receiver && receiver.id !== currentUser.id) {
      const newNotification: Notification = {
        id: `notif-message-${Date.now()}-${Math.random()}`,
        type: 'message',
        fromUser: currentUser,
        message: 'sent you a message',
        timestamp: Date.now(),
        isRead: false
      };
      
      setAllUsers(prevUsers => {
        return prevUsers.map(u => {
          if (u.id === receiver.id) {
            const updatedUser = {
              ...u,
              notifications: [newNotification, ...(u.notifications || [])]
            };
            // Update current user if they are the receiver
            if (u.id === currentUser.id) {
              setCurrentUser(updatedUser);
              saveSession(updatedUser);
            }
            return updatedUser;
          }
          return u;
        });
      });
    }
  }, [currentUser, allUsers]);
  
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
    if (!currentUser) return;
    
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const isPostInLikedSession = (p as any).sessionLiked || false;
      const isLiking = !isPostInLikedSession;
      
      // Create notification for post author when liking (not when unliking)
      if (isLiking && p.author.id !== currentUser.id) {
        const newNotification: Notification = {
          id: `notif-like-${Date.now()}-${Math.random()}`,
          type: 'like',
          fromUser: currentUser,
          message: 'liked your post',
          timestamp: Date.now(),
          isRead: false,
          postId: postId
        };
        
        setAllUsers(prevUsers => {
          const updatedUsers = prevUsers.map(u => {
            if (u.id === p.author.id) {
              const updatedUser = {
                ...u,
                notifications: [newNotification, ...(u.notifications || [])]
              };
              // Update currentUser if it's the post author (receiving notification)
              if (u.id === currentUser.id) {
                setCurrentUser(updatedUser);
                saveSession(updatedUser);
              }
              return updatedUser;
            }
            return u;
          });
          // Removed localStorage saving - relying on backend only
          return updatedUsers;
        });
      }
      
      return { ...p, radiance: isPostInLikedSession ? Math.max(0, p.radiance - 1) : p.radiance + 1, sessionLiked: !isPostInLikedSession } as any;
    }));
  }, [currentUser]);

  const handleBoostPost = useCallback(async (postId: string, credits: number = 50) => {
    if (!currentUser) return;
    
    const isSpecialUser = currentUser.email?.toLowerCase() === 'danelloosthuizen3@gmail.com';
    
    if (!isSpecialUser && (currentUser.auraCredits || 0) < credits) {
      setIsCreditStoreOpen(true);
      return;
    }
    
    // Always deduct credits first to show the deduction
    const newCredits = (currentUser.auraCredits || 0) - credits;
    handleUpdateProfile({ auraCredits: newCredits });
    
    // Also update the current user state immediately to reflect the deduction
    setCurrentUser(prev => prev ? { ...prev, auraCredits: newCredits } : prev);
    
    // Call backend API to persist the credit deduction
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${currentUser.id}/spend-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: credits,
          reason: 'post_boost'
        })
      });
      
      if (!response.ok) {
        console.log('Backend credit spending failed, but proceeding with local update');
      }
    } catch (error) {
      console.log('Backend not available for credit spending, using local update:', error);
    }
    
    // For special users, restore credits after a delay
    if (isSpecialUser) {
      setTimeout(() => {
        setCurrentUser(prev => prev ? { ...prev, auraCredits: 999999 } : prev);
        setAllUsers(prevUsers => {
          const updatedUsers = prevUsers.map(u => 
            u.id === currentUser.id ? { ...u, auraCredits: 999999 } : u
          );
          // Removed localStorage saving - relying on backend only
          return updatedUsers;
        });
      }, 2000);
    }
    
    // Calculate radiance boost based on credits spent (2x multiplier)
    const radianceBoost = credits * 2;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, radiance: p.radiance + radianceBoost, isBoosted: true } : p));
  }, [currentUser?.auraCredits, currentUser?.email, currentUser?.id, handleUpdateProfile, setAllUsers]);

  const handleBoostUser = useCallback(async (userId: string) => {
    if (!currentUser) return;
    
    const boostCost = 200;
    const isSpecialUser = currentUser.email?.toLowerCase() === 'danelloosthuizen3@gmail.com';
    
    if (!isSpecialUser && (currentUser.auraCredits || 0) < boostCost) {
      setIsCreditStoreOpen(true);
      return;
    }
    
    // Always deduct credits for both regular and special users
    const newCredits = (currentUser.auraCredits || 0) - boostCost;
    handleUpdateProfile({ auraCredits: newCredits });
    
    // Also update the current user state immediately to reflect the deduction
    setCurrentUser(prev => prev ? { ...prev, auraCredits: newCredits } : prev);
    
    // Call backend API to persist the credit deduction
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${currentUser.id}/spend-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: boostCost,
          reason: 'user_boost'
        })
      });
      
      if (!response.ok) {
        console.log('Backend credit spending failed, but proceeding with local update');
      }
    } catch (error) {
      console.log('Backend not available for credit spending, using local update:', error);
    }
    
    // For special users, restore credits after a delay
    if (isSpecialUser) {
      setTimeout(() => {
        setCurrentUser(prev => prev ? { ...prev, auraCredits: 999999 } : prev);
        setAllUsers(prevUsers => {
          const updatedUsers = prevUsers.map(u => 
            u.id === currentUser.id ? { ...u, auraCredits: 999999 } : u
          );
          // Removed localStorage saving - relying on backend only
          return updatedUsers;
        });
      }, 2000);
    }
    
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, trustScore: Math.min(100, u.trustScore + 10), auraCredits: u.auraCredits + 50 } : u));
  }, [currentUser?.auraCredits, currentUser?.email, handleUpdateProfile]);

  const handleAuraShare = useCallback((sharedPost: any, originalPost?: Post) => {
    if (!currentUser) return;
    
    // Add the shared post to the feed
    setPosts(prev => [sharedPost, ...prev]);
    
    // Create notification for original post author when sharing
    if (originalPost && originalPost.author.id !== currentUser.id) {
      const newNotification: Notification = {
        id: `notif-share-${Date.now()}-${Math.random()}`,
        type: 'share',
        fromUser: currentUser,
        message: 'shared your post',
        timestamp: Date.now(),
        isRead: false,
        postId: originalPost.id
      };
      
      setAllUsers(prevUsers => {
        const updatedUsers = prevUsers.map(u => {
          if (u.id === originalPost.author.id) {
            const updatedUser = {
              ...u,
              notifications: [newNotification, ...(u.notifications || [])]
            };
            // Update currentUser if it's the post author (receiving notification)
            if (u.id === currentUser.id) {
              setCurrentUser(updatedUser);
              saveSession(updatedUser);
            }
            return updatedUser;
          }
          return u;
        });
        // Removed localStorage saving - relying on backend only
        return updatedUsers;
      });
    }
    
    // Show success message
    alert('Post shared to Aura feed successfully!');
  }, [currentUser, setPosts]);

  const handlePurchaseCredits = async (bundle: CreditBundle) => {
    if (!currentUser) {
      console.error('No current user found for credit purchase');
      return;
    }
    
    console.log('Processing credit purchase:', {
      bundle: bundle.name,
      credits: bundle.credits,
      price: bundle.price,
      currentCredits: currentUser.auraCredits || 0
    });
    
    const currentCredits = currentUser.auraCredits || 0;
    const newCredits = currentCredits + bundle.credits;
    
    console.log('Credit allocation:', {
      before: currentCredits,
      adding: bundle.credits,
      after: newCredits
    });
    
    // Try to update credits via backend API first
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${currentUser.id}/purchase-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credits: bundle.credits,
          bundleName: bundle.name,
          transactionId: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          paymentMethod: 'paypal'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Backend credit purchase successful:', result);
      } else {
        console.log('Backend credit purchase failed, using local update');
      }
    } catch (error) {
      console.log('Backend not available, using local credit update:', error);
    }
    
    // Update user credits locally (this ensures it works even if backend is down)
    handleUpdateProfile({ auraCredits: newCredits });
    
    // Also update the current user state immediately to reflect the addition
    setCurrentUser(prev => prev ? { ...prev, auraCredits: newCredits } : prev);
    
    // Show success notification
    setTimeout(() => {
      alert(`Success! ${bundle.credits} credits have been added to your account. New balance: ${newCredits.toLocaleString()} credits.`);
    }, 500);
    
    console.log('Credit purchase completed successfully');
  };

  const handleComment = useCallback((postId: string, text: string, parentId?: string) => {
    if (!currentUser) return;
    
    const newComment: Comment = { id: `c-${Date.now()}`, author: currentUser, text, timestamp: Date.now(), parentId, reactions: {}, userReactions: [] };
    
    setPosts(prev => {
      const post = prev.find(p => p.id === postId);
      if (!post) return prev;
      
      // Create notification for post author when commenting (not for replies to comments)
      if (!parentId && post.author.id !== currentUser.id) {
        const newNotification: Notification = {
          id: `notif-comment-${Date.now()}-${Math.random()}`,
          type: 'comment',
          fromUser: currentUser,
          message: 'commented on your post',
          timestamp: Date.now(),
          isRead: false,
          postId: postId
        };
        
        setAllUsers(prevUsers => {
          const updatedUsers = prevUsers.map(u => {
            if (u.id === post.author.id) {
              const updatedUser = {
                ...u,
                notifications: [newNotification, ...(u.notifications || [])]
              };
              // Update currentUser if it's the post author (receiving notification)
              if (u.id === currentUser.id) {
                setCurrentUser(updatedUser);
                saveSession(updatedUser);
              }
              return updatedUser;
            }
            return u;
          });
          // Removed localStorage saving - relying on backend only
          return updatedUsers;
        });
      }
      
      return prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p);
    });
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
    saveSession(updatedCurrentUser);

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
      // Removed localStorage saving - relying on backend only
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
      // Removed localStorage saving - relying on backend only
      return updatedUsers;
    });

    saveSession(updatedCurrentUser);
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
    
    // Removed localStorage saving - relying on backend only
  }, [currentUser, allUsers]);

  useEffect(() => {
    (window as any).handleRemoveAcquaintance = handleRemoveAcquaintance;
    return () => { delete (window as any).handleRemoveAcquaintance; };
  }, [handleRemoveAcquaintance]);

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
            handleTimeCapsule={handleTimeCapsule}
            handleSerendipityMode={handleSerendipityMode}
            serendipityModalOpen={serendipityModalOpen}
            setSerendipityModalOpen={setSerendipityModalOpen}
            serendipityContent={serendipityContent}
            aiGeneratorOpen={aiGeneratorOpen}
            setAiGeneratorOpen={setAiGeneratorOpen}
            onGenerateAIContent={handleGenerateAIContent}
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
            // Messaging props
            messagingOpen={messagingOpen}
            setMessagingOpen={setMessagingOpen}
            messages={messages}
            getUnreadCounts={getUnreadCounts}
            handleSendMessage={handleSendMessage}
            handleMarkMessagesAsRead={handleMarkMessagesAsRead}
          />
        } />
      </Routes>

  </Router>
  );
}

export default App;
