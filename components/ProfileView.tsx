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
        {/* Cover Section */}
        <div className="relative h-80 overflow-hidden">
          <div className={`relative w-full h-full ${isSelf ? 'group cursor-pointer' : ''}`} onClick={() => { if (isSelf) coverInputRef.current?.click(); }}>
            <MediaDisplay 
              url={isSelf ? (localCover || '') : (user.coverImage || '')} 
              type={isSelf ? localCoverType : user.coverType} 
              className="w-full h-full" 
              fallback={<div className="w-full h-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700"></div>}
            />
            {isSelf && (
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black tracking-widest">
                {isCoverUploading ? 'Uploading...' : 'Tap to update cover'}
              </div>
            )}
          </div>
          <input type="file" ref={coverInputRef} hidden accept="image/*,video/*" onChange={(e) => handleMediaFile(e, 'coverImage')} />
          <div className="absolute inset-0 bg-black/20"></div>
          {isSelf && (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isCoverUploading}
              className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-white/95 text-[11px] font-black uppercase tracking-widest text-slate-900 shadow-md hover:bg-white disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isCoverUploading ? '⏳ Updating' : 'Update Cover'}
            </button>
          )}
          
          {/* Back Button */}
          <button 
            onClick={onBack} 
            className="absolute top-6 left-6 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-all border border-white/20 font-medium text-sm"
          >
            ← Back
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 mx-4 -mt-20 relative z-10 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
          {/* Profile Header */}
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Section - Avatar & Info */}
              <div className="flex flex-col lg:flex-row gap-6 flex-1">
                <div className="flex justify-center lg:justify-start">
                  <div className={`relative w-32 h-32 rounded-2xl p-1 shadow-lg ${user.activeGlow !== 'none' ? 'ring-4 ring-emerald-400/30' : ''} bg-white dark:bg-slate-800 ${isSelf ? 'group cursor-pointer' : ''}`} onClick={() => { if (isSelf) avatarInputRef.current?.click(); }}>
                    <Avatar 
                      src={isSelf ? localAvatar : user.avatar} 
                      type={isSelf ? localAvatarType : user.avatarType} 
                      name={user.name} 
                      size="custom"
                      className="w-full h-full rounded-xl"
                    />
                    {isSelf && (
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black tracking-widest rounded-xl">
                        {isAvatarUploading ? 'Uploading...' : 'Update Photo'}
                      </div>
                    )}
                    {isSelf && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          avatarInputRef.current?.click();
                        }}
                        disabled={isAvatarUploading}
                        className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs shadow-lg border border-white/80 group-hover:bg-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isAvatarUploading ? '⏳' : '✎'}
                      </button>
                    )}
                    <input type="file" ref={avatarInputRef} hidden accept="image/*,video/*" onChange={(e) => handleMediaFile(e, 'avatar')} />
                  </div>
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                    {user.isCompany && user.companyName ? user.companyName : user.name}
                  </h1>
                  {user.isCompany && (
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                      <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-widest rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        Business Profile
                      </span>
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
                  )}
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
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
                  </div>
                  <div className="flex items-center justify-center lg:justify-start mt-1 mb-2">
                    {trustBadge && (
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${trustBadge.colorClass}`}>
                        <span className={trustBadge.textClass}>
                          <span className="mr-1">{trustBadge.icon}</span>
                          <span>{trustBadge.label}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons - Moved here from right side */}
                  <div className="flex flex-col gap-3 mb-6 max-w-sm mx-auto lg:mx-0 mt-4">
                    {!isSelf ? (
                      <>
                        {!isBlocked && (
                          <>
                            <button 
                              onClick={() => isAcquaintance ? onRemoveAcquaintance(user.id) : onSendConnectionRequest(user.id)} 
                              className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium shadow-md transition-all flex items-center justify-center gap-2 ${
                                isAcquaintance 
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600' 
                                  : isRequested 
                                    ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700' 
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg'
                              }`}
                            >
                              <span>{isAcquaintance ? '✓' : isRequested ? '⏳' : '+'}</span>
                              <span>{isAcquaintance ? 'Connected' : isRequested ? 'Requested (Tap to cancel)' : 'Connect'}</span>
                            </button>
                            <button 
                              onClick={() => onOpenMessaging && onOpenMessaging(user.id)} 
                              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 font-medium rounded-lg text-sm shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                              <span>✉️</span>
                              <span>Message</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={isBlocked ? handleUnblock : handleBlock}
                          disabled={blockLoading}
                          className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium shadow-md transition-all flex items-center justify-center gap-2 ${
                            isBlocked
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                              : 'bg-rose-600 text-white hover:bg-rose-700'
                          } ${blockLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          <span>{isBlocked ? '🔓' : '⛔'}</span>
                          <span>{isBlocked ? 'Unblock' : 'Block'}</span>
                        </button>
                        <button
                          onClick={() => setReportOpen(true)}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 font-medium rounded-lg text-sm shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <span>🚩</span>
                          <span>Report</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={onEditProfile} 
                          className="w-full px-4 py-2.5 bg-slate-900 dark:bg-slate-700 text-white font-medium rounded-lg text-sm shadow-md hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <span>⚙️</span>
                          <span>Edit Profile</span>
                        </button>
                        <button 
                          onClick={() => setShowPrivacySettings(true)} 
                          className="w-full px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <span>🔒</span>
                          <span>Privacy Settings</span>
                        </button>
                        <button 
                          onClick={onSerendipityMode} 
                          className="w-full px-4 py-2.5 bg-emerald-600 dark:bg-emerald-700 text-white font-medium rounded-lg text-sm shadow-md hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <span>✨</span>
                          <span>Serendipity</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-8 justify-center lg:justify-start">
                    <div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white">{posts.length}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Posts</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white">{user.acquaintances?.length || 0}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Acquaintances</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{user.trustScore}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Trust Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700">
            <div className="flex px-8">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 px-6 text-sm font-medium transition-all relative ${
                  activeTab === 'posts'
                    ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 px-6 text-sm font-medium transition-all relative ${
                  activeTab === 'about'
                    ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                About
              </button>
              {isSelf && (
                <button
                  onClick={() => setActiveTab('adplans')}
                  className={`py-4 px-6 text-sm font-medium transition-all relative flex items-center gap-2 ${
                    activeTab === 'adplans'
                      ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <span>📢</span>
                  Ad Plans
                  {adSubscriptions.filter(s => s.status === 'active').length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold">
                      {adSubscriptions.filter(s => s.status === 'active').length}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 pt-6">
          {activeTab === 'posts' ? (
            <div className="space-y-6">
              {/* Privacy Notice for Private Profiles */}
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
              
              {/* Posts */}
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
          ) : activeTab === 'about' ? (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">About</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
                  {user.bio || "No bio available."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                      <span className="text-xl">📍</span>
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
                              year: 'numeric'
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
          ) : activeTab === 'adplans' && isSelf ? (
            <AdPlansDashboard
              user={currentUser}
              ads={ads}
              onOpenAdManager={() => onOpenAdManager && onOpenAdManager()}
              onCancelAd={(id) => onCancelAd && onCancelAd(id)}
              onUpdateAd={(id, updates) => onUpdateAd ? onUpdateAd(id, updates) : Promise.resolve(false)}
              refreshTrigger={adRefreshTick}
            />
          ) : null}
        </div>
      </div>

      {/* Privacy Settings Modal */}
      {showPrivacySettings && (
        <PrivacySettings
          user={currentUser}
          onClose={() => setShowPrivacySettings(false)}
          onSettingsUpdate={(settings) => {
            console.log('Privacy settings updated:', settings);
          }}
        />
      )}
      
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Report User</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {(['Harassment','Spam','FakeAccount','Other'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setReportReason(r)}
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
