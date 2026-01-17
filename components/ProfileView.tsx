import React, { useState, useEffect, useRef } from 'react';
import { User, Post, Ad, Comment } from '../types';
import PostCard from './PostCard';
import { MediaDisplay, Avatar } from './MediaDisplay';
import OnlineStatus from './OnlineStatus';
import PrivacySettings from './PrivacySettings';
import AdPlansDashboard from './AdPlansDashboard';
import { PrivacyService } from '../services/privacyService';
import { UserService } from '../services/userService';
import { adSubscriptionService, AdSubscription } from '../services/adSubscriptionService';
import { AD_PACKAGES } from '../constants';
import { getTrustBadgeConfig, formatTrustSummary } from '../services/trustService';
import { uploadService } from '../services/upload';

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
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'adplans'>('posts');
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [adSubscriptions, setAdSubscriptions] = useState<AdSubscription[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'Harassment' | 'Spam' | 'FakeAccount' | 'Other'>('Harassment');
  const [reportNotes, setReportNotes] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [blockedList, setBlockedList] = useState<string[]>(currentUser.blockedUsers || []);
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

  useEffect(() => {
    if (!isSelf) {
      PrivacyService.recordProfileView(user.id, currentUser.id);
      PrivacyService.trackPageView(currentUser.id, 'profile', { viewedUserId: user.id });
    }
  }, [user.id, currentUser.id, isSelf]);

  useEffect(() => {
    if (isSelf) {
      loadAdSubscriptions();
    }
  }, [isSelf, currentUser.id]);
  useEffect(() => {
    setLocalAvatar(user.avatar);
    setLocalAvatarType(user.avatarType);
    setLocalCover(user.coverImage);
    setLocalCoverType(user.coverType);
  }, [user.avatar, user.avatarType, user.coverImage, user.coverType]);

  const loadAdSubscriptions = async () => {
    setLoadingSubscriptions(true);
    try {
      console.log('[ProfileView] Loading ad subscriptions for user:', currentUser.id);
      const subscriptions = await adSubscriptionService.getUserSubscriptions(currentUser.id);
      console.log('[ProfileView] Loaded subscriptions:', subscriptions.length);
      setAdSubscriptions(subscriptions);
    } catch (error) {
      console.error('[ProfileView] Failed to load ad subscriptions:', error);
      // Set empty array to prevent UI from getting stuck
      setAdSubscriptions([]);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const getPackageDetails = (packageId: string) => {
    return AD_PACKAGES.find(pkg => pkg.id === packageId);
  };

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
      const result = await uploadService.uploadFile(file);
      const isVideo = file.type.startsWith('video/') || /\.mp4$/i.test(file.name);
      const typeProp = field === 'avatar' ? 'avatarType' : 'coverType';
      const updates: Partial<User> = {
        [field]: result.url,
        [typeProp]: isVideo ? 'video' : 'image'
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mt-4 mb-6 px-4 py-2 bg-white/10 backdrop-blur-md text-slate-900 dark:text-white rounded-lg hover:bg-white/20 transition-all border border-white/20 font-medium text-sm"
        >
          ← Back
        </button>
        <div className="relative h-64 overflow-hidden rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
          <MediaDisplay
            url={isSelf ? (localCover || '') : (user.coverImage || '')}
            type={isSelf ? localCoverType : user.coverType}
            className="w-full h-full"
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700" />
            }
          />
          {isSelf && (
            <>
              <input
                type="file"
                ref={coverInputRef}
                hidden
                accept="image/*,video/*"
                onChange={(e) => handleMediaFile(e, 'coverImage')}
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={isCoverUploading}
                className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-white/95 text-[11px] font-black uppercase tracking-widest text-slate-900 shadow-md hover:bg-white disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCoverUploading ? '⏳ Updating' : 'Update Cover'}
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6 mt-6 items-start">
          <div className="flex justify-center md:justify-start">
            <div className="w-40 h-40 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden">
              <MediaDisplay
                url={isSelf ? (localAvatar || user.avatar || '') : (user.avatar || '')}
                type={isSelf ? localAvatarType : user.avatarType}
                className="w-full h-full object-cover object-center"
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 font-bold text-xl">
                    {user.name ? user.name.charAt(0) : '?'}
                  </div>
                }
              />
            </div>
            {isSelf && (
              <>
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

          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
              {user.isCompany && user.companyName ? user.companyName : user.name}
            </h1>
            <div className="flex items-center flex-wrap gap-3 mb-4">
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                {user.handle}
              </p>
              <OnlineStatus userId={user.id} showText={false} size="md" />
              {user.isPrivate && (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                  <span>🔒</span>
                  <span>Private</span>
                </div>
              )}
              {trustBadge && (
                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${trustBadge.colorClass}`}>
                  <span className={trustBadge.textClass}>
                    <span className="mr-1">{trustBadge.icon}</span>
                    <span>{trustBadge.label}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
