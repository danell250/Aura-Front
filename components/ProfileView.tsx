import React, { useState, useEffect, useRef } from 'react';
import { User, Post, Ad, Comment } from '../types';
import PostCard from './PostCard';
import { MediaDisplay, Avatar } from './MediaDisplay';
import OnlineStatus from './OnlineStatus';
import { PrivacyService } from '../services/privacyService';
import { UserService } from '../services/userService';
import { getTrustBadgeConfig, formatTrustSummary } from '../services/trustService';
import { uploadService } from '../services/upload';
import { PostService } from '../services/postService';
import { getApiBaseUrl } from '../constants';
import { io } from 'socket.io-client';

const getZodiacSign = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries ♈';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus ♉';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini ♊';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer ♋';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo ♌';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo ♍';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra ♎';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio ♏';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius ♐';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn ♑';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius ♒';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces ♓';
  return '';
};

const getCountryFlag = (countryName: string): string => {
  if (!countryName) return '📍';

  const countryFlags: Record<string, string> = {
    algeria: '🇩🇿',
    angola: '🇦🇴',
    benin: '🇧🇯',
    botswana: '🇧🇼',
    'burkina faso': '🇧🇫',
    burundi: '🇧🇮',
    cameroon: '🇨🇲',
    'cape verde': '🇨🇻',
    'central african republic': '🇨🇫',
    chad: '🇹🇩',
    comoros: '🇰🇲',
    congo: '🇨🇬',
    'democratic republic of the congo': '🇨🇩',
    djibouti: '🇩🇯',
    egypt: '🇪🇬',
    'equatorial guinea': '🇬🇶',
    eritrea: '🇪🇷',
    eswatini: '🇸🇿',
    ethiopia: '🇪🇹',
    gabon: '🇬🇦',
    gambia: '🇬🇲',
    ghana: '🇬🇭',
    guinea: '🇬🇳',
    'guinea-bissau': '🇬🇼',
    'ivory coast': '🇨🇮',
    kenya: '🇰🇪',
    lesotho: '🇱🇸',
    liberia: '🇱🇷',
    libya: '🇱🇾',
    madagascar: '🇲🇬',
    malawi: '🇲🇼',
    mali: '🇲🇱',
    mauritania: '🇲🇷',
    mauritius: '🇲🇺',
    morocco: '🇲🇦',
    mozambique: '🇲🇿',
    namibia: '🇳🇦',
    niger: '🇳🇪',
    nigeria: '🇳🇬',
    rwanda: '🇷🇼',
    'sao tome and principe': '🇸🇹',
    senegal: '🇸🇳',
    seychelles: '🇸🇨',
    'sierra leone': '🇸🇱',
    somalia: '🇸🇴',
    'south africa': '🇿🇦',
    'south sudan': '🇸🇸',
    sudan: '🇸🇩',
    tanzania: '🇹🇿',
    togo: '🇹🇬',
    tunisia: '🇹🇳',
    uganda: '🇺🇬',
    zambia: '🇿🇲',
    zimbabwe: '🇿🇼',
    'antigua and barbuda': '🇦🇬',
    argentina: '🇦🇷',
    bahamas: '🇧🇸',
    barbados: '🇧🇧',
    belize: '🇧🇿',
    bolivia: '🇧🇴',
    brazil: '🇧🇷',
    canada: '🇨🇦',
    chile: '🇨🇱',
    colombia: '🇨🇴',
    'costa rica': '🇨🇷',
    cuba: '🇨🇺',
    dominica: '🇩🇲',
    'dominican republic': '🇩🇴',
    ecuador: '🇪🇨',
    'el salvador': '🇸🇻',
    grenada: '🇬🇩',
    guatemala: '🇬🇹',
    guyana: '🇬🇾',
    haiti: '🇭🇹',
    honduras: '🇭🇳',
    jamaica: '🇯🇲',
    mexico: '🇲🇽',
    nicaragua: '🇳🇮',
    panama: '🇵🇦',
    paraguay: '🇵🇾',
    peru: '🇵🇪',
    'saint kitts and nevis': '🇰🇳',
    'saint lucia': '🇱🇨',
    'saint vincent and the grenadines': '🇻🇨',
    suriname: '🇸🇷',
    'trinidad and tobago': '🇹🇹',
    'united states': '🇺🇸',
    usa: '🇺🇸',
    uruguay: '🇺🇾',
    venezuela: '🇻🇪',
    afghanistan: '🇦🇫',
    armenia: '🇦🇲',
    azerbaijan: '🇦🇿',
    bahrain: '🇧🇭',
    bangladesh: '🇧🇩',
    bhutan: '🇧🇹',
    brunei: '🇧🇳',
    cambodia: '🇰🇭',
    china: '🇨🇳',
    cyprus: '🇨🇾',
    'east timor': '🇹🇱',
    georgia: '🇬🇪',
    india: '🇮🇳',
    indonesia: '🇮🇩',
    iran: '🇮🇷',
    iraq: '🇮🇶',
    israel: '🇮🇱',
    japan: '🇯🇵',
    jordan: '🇯🇴',
    kazakhstan: '🇰🇿',
    kuwait: '🇰🇼',
    kyrgyzstan: '🇰🇬',
    laos: '🇱🇦',
    lebanon: '🇱🇧',
    malaysia: '🇲🇾',
    maldives: '🇲🇻',
    mongolia: '🇲🇳',
    myanmar: '🇲🇲',
    nepal: '🇳🇵',
    'north korea': '🇰🇵',
    oman: '🇴🇲',
    pakistan: '🇵🇰',
    palestine: '🇵🇸',
    philippines: '🇵🇭',
    qatar: '🇶🇦',
    'saudi arabia': '🇸🇦',
    singapore: '🇸🇬',
    'south korea': '🇰🇷',
    'sri lanka': '🇱🇰',
    syria: '🇸🇾',
    taiwan: '🇹🇼',
    tajikistan: '🇹🇯',
    thailand: '🇹🇭',
    turkey: '🇹🇷',
    turkmenistan: '🇹🇲',
    uae: '🇦🇪',
    'united arab emirates': '🇦🇪',
    uzbekistan: '🇺🇿',
    vietnam: '🇻🇳',
    yemen: '🇾🇪',
    albania: '🇦🇱',
    andorra: '🇦🇩',
    austria: '🇦🇹',
    belarus: '🇧🇾',
    belgium: '🇧🇪',
    'bosnia and herzegovina': '🇧🇦',
    bulgaria: '🇧🇬',
    croatia: '🇭🇷',
    'czech republic': '🇨🇿',
    denmark: '🇩🇰',
    estonia: '🇪🇪',
    finland: '🇫🇮',
    france: '🇫🇷',
    germany: '🇩🇪',
    greece: '🇬🇷',
    hungary: '🇭🇺',
    iceland: '🇮🇸',
    ireland: '🇮🇪',
    italy: '🇮🇹',
    kosovo: '🇽🇰',
    latvia: '🇱🇻',
    liechtenstein: '🇱🇮',
    lithuania: '🇱🇹',
    luxembourg: '🇱🇺',
    malta: '🇲🇹',
    moldova: '🇲🇩',
    monaco: '🇲🇨',
    montenegro: '🇲🇪',
    netherlands: '🇳🇱',
    'north macedonia': '🇲🇰',
    norway: '🇳🇴',
    poland: '🇵🇱',
    portugal: '🇵🇹',
    romania: '🇷🇴',
    russia: '🇷🇺',
    'san marino': '🇸🇲',
    serbia: '🇷🇸',
    slovakia: '🇸🇰',
    slovenia: '🇸🇮',
    spain: '🇪🇸',
    sweden: '🇸🇪',
    switzerland: '🇨🇭',
    ukraine: '🇺🇦',
    'united kingdom': '🇬🇧',
    uk: '🇬🇧',
    'vatican city': '🇻🇦',
    australia: '🇦🇺',
    fiji: '🇫🇯',
    kiribati: '🇰🇮',
    'marshall islands': '🇲🇭',
    micronesia: '🇫🇲',
    nauru: '🇳🇷',
    'new zealand': '🇳🇿',
    palau: '🇵🇼',
    'papua new guinea': '🇵🇬',
    samoa: '🇼🇸',
    'solomon islands': '🇸🇧',
    tonga: '🇹🇴',
    tuvalu: '🇹🇻',
    vanuatu: '🇻🇺',
  };

  const normalized = countryName.toLowerCase().trim();
  return countryFlags[normalized] || '📍';
};

interface ProfileInsightsTotals {
  totalPosts: number;
  totalViews: number;
  boostedPosts: number;
  totalRadiance: number;
}

interface ProfileInsightsCredits {
  balance: number;
  spent: number;
}

interface ProfileInsightsTopPost {
  id: string;
  preview: string;
  views: number;
  timestamp: number;
  isBoosted: boolean;
  radiance: number;
}

interface ProfileInsights {
  totals: ProfileInsightsTotals;
  credits: ProfileInsightsCredits;
  topPosts: ProfileInsightsTopPost[];
}

const API_BASE_URL = getApiBaseUrl();
const SOCKET_BASE_URL = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL.replace(/\/api$/, '')
  : API_BASE_URL;

interface ProfileViewProps {
   user: User;
   posts: Post[];
  ads: Ad[];
  adRefreshTick?: number;
  currentUser: User;
  allUsers: User[];
  onBack: () => void;
  onReact: (postId: string, reaction: string, targetType: 'post' | 'comment', commentId?: string) => void;
  onComment: (postId: string, text: string, parentId?: string) => void;
   onLoadComments: (postId: string, comments: Comment[]) => void;
   onShare: (post: Post) => void;
   onAddAcquaintance: (user: User) => void;
   onRemoveAcquaintance: (userId: string) => void;
   onViewProfile: (userId: string) => void;
   onSearchTag: (tag: string) => void;
   onLike: (postId: string) => void;
   onBoostPost?: (postId: string) => void;
   onBoostUser?: (userId: string) => void;
   onEditProfile?: () => void;
   onUpdateProfileMedia?: (updates: Partial<User>) => Promise<void> | void;
   onDeletePost?: (postId: string) => void;
   onDeleteComment?: (postId: string, commentId: string) => void;
   onSerendipityMode?: () => void;
   onOpenMessaging?: (userId?: string) => void;
   onBoost?: (postId: string, credits: number) => void;
   onSendConnectionRequest: (targetUserId: string) => void;
   onOpenAdManager?: () => void;
   onCancelAd?: (adId: string) => void;
   onUpdateAd?: (adId: string, updates: Partial<Ad>) => Promise<boolean>;
}

const ProfileView: React.FC<ProfileViewProps> = ({
   user, posts, ads, adRefreshTick, currentUser, allUsers, onBack, onReact, onComment, onLoadComments, onShare, onAddAcquaintance, onRemoveAcquaintance, onSendConnectionRequest, onViewProfile, onSearchTag, onLike, onBoostPost, onBoostUser, onEditProfile, onUpdateProfileMedia, onDeletePost, onDeleteComment, onSerendipityMode, onOpenMessaging, onOpenAdManager, onCancelAd, onUpdateAd
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'insights'>('posts');
  const [blockLoading, setBlockLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'Harassment' | 'Spam' | 'FakeAccount' | 'Other'>('Harassment');
  const [reportNotes, setReportNotes] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [blockedList, setBlockedList] = useState<string[]>(currentUser.blockedUsers || []);
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [insights, setInsights] = useState<ProfileInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const isSelf = currentUser.id === user.id;
  const isAcquaintance = currentUser.acquaintances?.includes(user.id);
  const isRequested = currentUser.sentAcquaintanceRequests?.includes(user.id);
  const isBlocked = blockedList.includes(user.id);
  const trustBadge = getTrustBadgeConfig(user.trustScore ?? 0);
  const zodiacSign = user.zodiacSign || (user.dob ? getZodiacSign(user.dob) : '');
  const [localAvatar, setLocalAvatar] = useState<string>(user.avatar);
  const [localAvatarType, setLocalAvatarType] = useState<'image' | 'video' | undefined>(user.avatarType);
  const [localCover, setLocalCover] = useState<string | undefined>(user.coverImage);
  const [localCoverType, setLocalCoverType] = useState<'image' | 'video' | undefined>(user.coverType);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const analyticsSocketRef = useRef<any | null>(null);

  useEffect(() => {
    if (!isSelf) {
      PrivacyService.recordProfileView(user.id, currentUser.id);
      PrivacyService.trackPageView(currentUser.id, 'profile', { viewedUserId: user.id });
    }
  }, [user.id, currentUser.id, isSelf]);

  useEffect(() => {
    if (!isSelf) return;
    if (activeTab !== 'insights') return;

    let cancelled = false;

    const fetchInsights = async () => {
      setInsightsLoading(true);
      setInsightsError(null);
      try {
        console.log('🔍 Fetching insights for user:', currentUser.id);
        const resp = await PostService.getMyInsights();
        console.log('📊 Insights response:', resp);

        if (cancelled) return;

        if (resp.success && resp.data) {
          setInsights(resp.data as ProfileInsights);
          console.log('✅ Insights loaded successfully');
        } else {
          console.error('❌ Insights fetch failed:', resp.error);
          setInsightsError(resp.error || 'Failed to load insights');
        }
      } catch (e: any) {
        console.error('❌ Insights fetch error:', e);
        if (!cancelled) {
          setInsightsError(e?.message || 'Failed to load insights');
        }
      } finally {
        if (!cancelled) {
          setInsightsLoading(false);
        }
      }
    };

    fetchInsights();

    return () => {
      cancelled = true;
    };
  }, [isSelf, activeTab, currentUser.id]);

  useEffect(() => {
    if (!isSelf) return;
    if (activeTab !== 'insights') return;

    const socket = io(SOCKET_BASE_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    analyticsSocketRef.current = socket;

    const handleAnalyticsUpdate = (payload: { userId: string; stats: ProfileInsights }) => {
      if (!payload || payload.userId !== currentUser.id) return;
      setInsights(payload.stats);
    };

    socket.emit('join_user_room', currentUser.id);
    socket.on('analytics_update', handleAnalyticsUpdate);

    return () => {
      socket.emit('leave_user_room', currentUser.id);
      socket.off('analytics_update', handleAnalyticsUpdate);
      socket.close();
      analyticsSocketRef.current = null;
    };
  }, [isSelf, activeTab, currentUser.id]);

  useEffect(() => {
    setLocalAvatar(user.avatar);
    setLocalAvatarType(user.avatarType);
    setLocalCover(user.coverImage);
    setLocalCoverType(user.coverType);
  }, [user.avatar, user.avatarType, user.coverImage, user.coverType]);

  const handleLike = (postId: string) => {
    onLike(postId);
    PrivacyService.trackInteraction(currentUser.id, 'like', 'post', { postId });
  };
  
  const handleComment = (postId: string, text: string, parentId?: string) => {
    onComment(postId, text, parentId);
    PrivacyService.trackInteraction(currentUser.id, 'comment', 'post', { postId, hasParent: !!parentId });
  };
  
  const handleReact = (postId: string, reaction: string, targetType: 'post' | 'comment', commentId?: string) => {
    onReact(postId, reaction, targetType, commentId);
    PrivacyService.trackInteraction(currentUser.id, 'react', targetType, { postId, reaction, commentId });
  };
  const handleMediaFile = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file || !isSelf) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      e.target.value = '';
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Allowed: JPG, PNG, WEBP, GIF, MP4');
      e.target.value = '';
      return;
    }
    try {
      if (field === 'avatar') {
        setIsAvatarUploading(true);
      } else {
        setIsCoverUploading(true);
      }
      const result = await uploadService.uploadFile(file, 'avatars');
      const isVideo = file.type.startsWith('video/') || /\.mp4$/i.test(file.name);
      const typeProp = field === 'avatar' ? 'avatarType' : 'coverType';
      const keyProp = field === 'avatar' ? 'avatarKey' : 'coverKey';
      const updates: Partial<User> = {
        [field]: result.url,
        [typeProp]: isVideo ? 'video' : 'image',
        [keyProp]: result.filename
      } as any;

      if (field === 'avatar') {
        setLocalAvatar(result.url);
        setLocalAvatarType(isVideo ? 'video' : 'image');
      } else {
        setLocalCover(result.url);
        setLocalCoverType(isVideo ? 'video' : 'image');
      }

      if (onUpdateProfileMedia) {
        await onUpdateProfileMedia(updates);
      } else {
        const updateResp = await UserService.updateUser(currentUser.id, updates);
        if (!updateResp.success) {
          alert(updateResp.error || 'Failed to update profile media');
        }
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      if (field === 'avatar') {
        setIsAvatarUploading(false);
      } else {
        setIsCoverUploading(false);
      }
      e.target.value = '';
    }
  };
  
  const handleBlock = async () => {
    if (blockedList.includes(user.id) || blockLoading) return;
    setBlockLoading(true);
    try {
      const result = await UserService.blockUser(currentUser.id, user.id);
      if (result.success) {
        setBlockedList(prev => (prev.includes(user.id) ? prev : [...prev, user.id]));
        setActionMessage('User blocked');
      } else {
        setActionMessage(result.error || 'Failed to block user');
      }
    } catch {
      setActionMessage('Failed to block user');
    } finally {
      setBlockLoading(false);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };
  
  const handleUnblock = async () => {
    if (!blockedList.includes(user.id) || blockLoading) return;
    setBlockLoading(true);
    try {
      const result = await UserService.unblockUser(currentUser.id, user.id);
      if (result.success) {
        setBlockedList(prev => prev.filter(id => id !== user.id));
        setActionMessage('User unblocked');
      } else {
        setActionMessage(result.error || 'Failed to unblock user');
      }
    } catch {
      setActionMessage('Failed to unblock user');
    } finally {
      setBlockLoading(false);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };
  
  const submitReport = async () => {
    try {
      const result = await UserService.reportUser(currentUser.id, user.id, reportReason, reportNotes);
      if (result.success) {
        setActionMessage('Report submitted');
        setReportOpen(false);
        setReportNotes('');
      } else {
        setActionMessage(result.error || 'Failed to submit report');
      }
    } catch {
      setActionMessage('Failed to submit report');
    } finally {
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="relative h-[400px] overflow-hidden">
          <div
            className={`relative w-full h-full ${isSelf ? 'group cursor-pointer' : ''}`}
            onClick={() => {
              if (isSelf) coverInputRef.current?.click();
            }}
          >
            <MediaDisplay
              url={isSelf ? (localCover || '') : (user.coverImage || '')}
              type={isSelf ? localCoverType : user.coverType}
              className="w-full h-full object-cover"
              fallback={
                <div className="w-full h-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700" />
              }
            />
            {isSelf && (
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium">
                {isCoverUploading ? 'Uploading...' : '📷 Edit cover photo'}
              </div>
            )}
          </div>
          <input
            type="file"
            ref={coverInputRef}
            hidden
            accept="image/*,video/*"
            onChange={(e) => handleMediaFile(e, 'coverImage')}
          />
          <button
            onClick={onBack}
            className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-sm text-slate-700 rounded-lg hover:bg-white transition-all font-medium text-sm flex items-center gap-2 shadow-md"
          >
            <span>←</span> Back
          </button>
          {isSelf && (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isCoverUploading}
              className="absolute bottom-4 right-4 px-4 py-2 rounded-lg bg-white text-slate-700 hover:bg-slate-100 font-medium text-sm shadow-md flex items-center gap-2 disabled:opacity-70"
            >
              <span>📷</span>
              {isCoverUploading ? 'Updating...' : 'Edit cover photo'}
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between -mt-20 pb-4">
              {/* Left side - Avatar and Name */}
              <div className="flex items-end gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-40 h-40 rounded-full border-4 border-white dark:border-slate-900 bg-white shadow-xl overflow-hidden">
                    <MediaDisplay
                      url={isSelf ? (localAvatar || user.avatar || '') : (user.avatar || '')}
                      type={isSelf ? localAvatarType : user.avatarType}
                      className="w-full h-full object-cover"
                      fallback={
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 font-bold text-3xl">
                          {user.name ? user.name.charAt(0) : '?'}
                        </div>
                      }
                    />
                  </div>
                  {isSelf && (
                    <>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isAvatarUploading}
                        className="absolute bottom-2 right-2 bg-slate-100 rounded-full p-2 shadow-lg hover:bg-slate-200 border-2 border-white disabled:opacity-70"
                      >
                        <span className="text-lg">{isAvatarUploading ? '⏳' : '📷'}</span>
                      </button>
                      <input
                        type="file"
                        ref={avatarInputRef}
                        hidden
                        accept="image/*,video/*"
                        onChange={(e) => handleMediaFile(e, 'avatar')}
                      />
                    </>
                  )}
                </div>

                {/* Name and Stats */}
                {/* Name and Stats */}
                <div className="mb-2 mt-24">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                    {user.isCompany && user.companyName ? user.companyName : user.name}
                  </h1>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                      {user.handle}
                    </p>
                    <OnlineStatus userId={user.id} showText={false} size="sm" />
                    {!isSelf && isAcquaintance && (
                      <span className="text-xs text-slate-500">• Connected</span>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">{posts.length}</span>
                      <span className="text-slate-500 dark:text-slate-400 ml-1">posts</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">{user.acquaintances?.length || 0}</span>
                      <span className="text-slate-500 dark:text-slate-400 ml-1">acquaintances</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Action Buttons */}
              <div className="flex items-center gap-2 mb-2">
                {isSelf ? (
                  <>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowOwnerMenu((open) => !open)}
                        className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 font-medium text-sm"
                      >
                        ⚙️
                      </button>
                      {showOwnerMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 py-1">
                          {onEditProfile && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowOwnerMenu(false);
                                onEditProfile();
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <span>✏️</span>
                              <span>Edit profile</span>
                            </button>
                          )}
                          {onSerendipityMode && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowOwnerMenu(false);
                                onSerendipityMode();
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <span>🎲</span>
                              <span>Serendipity mode</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setShowOwnerMenu(false);
                              setReportOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <span>🚩</span>
                            <span>Report user</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {!isBlocked && !isAcquaintance && (
                      <button
                        onClick={() => onSendConnectionRequest(user.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm shadow-sm flex items-center gap-2 ${isRequested
                            ? 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        disabled={isRequested}
                      >
                        <span>{isRequested ? '⏳' : '➕'}</span>
                        <span>{isRequested ? 'Requested' : 'Add friend'}</span>
                      </button>
                    )}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowOwnerMenu((open) => !open)}
                        className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 font-medium text-sm"
                      >
                        ⚙️
                      </button>
                      {showOwnerMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 py-1">
                          {onOpenMessaging && !isBlocked && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowOwnerMenu(false);
                                onOpenMessaging(user.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <span>💬</span>
                              <span>Message</span>
                            </button>
                          )}
                          {onSerendipityMode && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowOwnerMenu(false);
                                onSerendipityMode();
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <span>🎲</span>
                              <span>Serendipity mode</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setShowOwnerMenu(false);
                              if (isBlocked) {
                                handleUnblock();
                              } else {
                                handleBlock();
                              }
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <span>{isBlocked ? '🔓' : '⛔'}</span>
                            <span>{isBlocked ? 'Unblock user' : 'Block user'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowOwnerMenu(false);
                              setReportOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <span>🚩</span>
                            <span>Report user</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Badges Row */}
            {(user.isCompany || user.isPrivate || trustBadge) && (
              <div className="flex items-center gap-2 pb-3 flex-wrap">
                {user.isCompany && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    Business Profile
                  </span>
                )}
                {user.isPrivate && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    🔒 Private
                  </span>
                )}
                {trustBadge && (
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${trustBadge.colorClass}`}>
                    <span className={trustBadge.textClass}>
                      {trustBadge.icon} {trustBadge.label}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 px-6 text-sm font-medium transition-all relative ${activeTab === 'posts'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 px-6 text-sm font-medium transition-all relative ${activeTab === 'about'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                About
              </button>
              {isSelf && (
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`py-4 px-6 text-sm font-medium transition-all relative ${activeTab === 'insights'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  Dashboard
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 pt-6">
          {activeTab === 'posts' && (
            <div className="space-y-6">
              {user.isPrivate && !isSelf && !isAcquaintance && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">Private Profile</h3>
                  <p className="text-amber-700 dark:text-amber-300 mb-4">
                    This user's posts are private. Connect with them to see their content.
                  </p>
                  <button
                    onClick={() => !isRequested && onSendConnectionRequest(user.id)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      isRequested
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg'
                    }`}
                    disabled={isRequested}
                  >
                    {isRequested ? 'Connection Requested' : 'Send Connection Request'}
                  </button>
                </div>
              )}

              {(!user.isPrivate || isSelf || isAcquaintance) && (
                <>
                  {posts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                      <div className="text-4xl mb-4 opacity-30">📝</div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No posts yet</h3>
                      <p className="text-slate-500 dark:text-slate-400">Posts will appear here when they're shared</p>
                    </div>
                  ) : (
                    posts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        allUsers={allUsers}
                        onLike={handleLike}
                        onComment={handleComment}
                        onReact={handleReact}
                        onShare={onShare}
                        onViewProfile={onViewProfile}
                        onSearchTag={onSearchTag}
                        onBoost={onBoostPost}
                        onDeletePost={onDeletePost}
                        onDeleteComment={onDeleteComment}
                        onLoadComments={onLoadComments}
                      />
                    ))
                  )}
                </>
              )}
            </div>
          )}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">About</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
                  {user.bio || 'No bio available.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">{getCountryFlag(user.country || '')}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Location</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {user.country || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🏢</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Industry</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {user.industry || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                {user.companyName && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                        <span className="text-xl">🏬</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Company</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {user.companyName}
                        </p>
                        {user.companyWebsite && (
                          <a
                            href={user.companyWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 underline underline-offset-4 decoration-emerald-400/60"
                          >
                            {user.companyWebsite}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(user.dob || zodiacSign) && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <span className="text-xl">🎂</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Birthday</p>
                        {user.dob && (
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {new Date(user.dob).toLocaleDateString(undefined, {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                        {zodiacSign && (
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                            {zodiacSign}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'insights' && isSelf && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Dashboard</h3>
                  {insightsLoading && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Loading insights…
                      </span>
                    </div>
                  )}
                </div>

                {insightsError && (
                  <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
                    <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
                      {insightsError}
                    </p>
                    <button
                      onClick={() => {
                        setInsights(null);
                        setInsightsError(null);
                      }}
                      className="mt-2 text-xs text-rose-600 dark:text-rose-400 underline hover:no-underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {insightsLoading && !insights && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">Loading your dashboard...</p>
                    </div>
                  </div>
                )}

                {!insightsLoading && !insights && !insightsError && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
                    No insights available yet. Start posting and boosting to see your stats.
                  </p>
                )}

                {insights && !insightsLoading && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Total Posts
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                          {insights.totals.totalPosts.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Total Views
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                          {insights.totals.totalViews.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Boosted Posts
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                          {insights.totals.boostedPosts.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Total Radiance
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                          {insights.totals.totalRadiance.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-5">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Credits
                        </p>
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                          Balance:{' '}
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {insights.credits.balance.toLocaleString()} credits
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          Spent on boosts:{' '}
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {insights.credits.spent.toLocaleString()} credits
                          </span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-5">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                          Top Posts
                        </p>
                        {insights.topPosts.length === 0 ? (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Your top-performing posts will appear here.
                          </p>
                        ) : (
                          <ul className="space-y-3">
                            {insights.topPosts.map(post => (
                              <li
                                key={post.id}
                                className="flex items-start justify-between gap-3 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 px-3 py-2.5"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                    {post.preview || 'Untitled post'}
                                  </p>
                                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    {new Date(post.timestamp).toLocaleDateString()} ·{' '}
                                    {post.isBoosted ? 'Boosted' : 'Organic'}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Views
                                  </span>
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {post.views.toLocaleString()}
                                  </span>
                                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                                    ✨ {post.radiance.toLocaleString()}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Report User</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {['Harassment', 'Spam', 'FakeAccount', 'Other'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setReportReason(r as any)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                      reportReason === r
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <textarea
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Additional details (optional)"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                rows={4}
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setReportOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg text-sm hover:bg-emerald-700 transition-all"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {actionMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm shadow-lg">
            {actionMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
