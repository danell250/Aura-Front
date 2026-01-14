import React, { useState, useEffect } from 'react';
import { User, Post } from '../types';
import PostCard from './PostCard';
import { MediaDisplay, Avatar } from './MediaDisplay';
import OnlineStatus from './OnlineStatus';
import PrivacySettings from './PrivacySettings';
import { PrivacyService } from '../services/privacyService';
import { adSubscriptionService, AdSubscription } from '../services/adSubscriptionService';
import { AD_PACKAGES } from '../constants';

interface ProfileViewProps {
  user: User;
  posts: Post[];
  currentUser: User;
  allUsers: User[];
  onBack: () => void;
  onReact: (postId: string, reaction: string, targetType: 'post' | 'comment', commentId?: string) => void;
  onComment: (postId: string, text: string, parentId?: string) => void;
  onShare: (post: Post) => void;
  onAddAcquaintance: (user: User) => void;
  onRemoveAcquaintance: (userId: string) => void;
  onViewProfile: (userId: string) => void;
  onSearchTag: (tag: string) => void;
  onLike: (postId: string) => void;
  onBoostPost?: (postId: string) => void;
  onBoostUser?: (userId: string) => void;
  onEditProfile?: () => void;
  onDeletePost?: (postId: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onSerendipityMode?: () => void;
  onOpenMessaging?: (userId?: string) => void;
  onBoost?: (postId: string, credits: number) => void;
  onSendConnectionRequest: (targetUserId: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({
  user, posts, currentUser, allUsers, onBack, onReact, onComment, onShare, onAddAcquaintance, onRemoveAcquaintance, onViewProfile, onSearchTag, onLike, onBoostPost, onBoostUser, onEditProfile, onDeletePost, onDeleteComment, onSerendipityMode, onOpenMessaging
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'adplans'>('posts');
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [adSubscriptions, setAdSubscriptions] = useState<AdSubscription[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const isSelf = currentUser.id === user.id;
  const isAcquaintance = currentUser.acquaintances?.includes(user.id);
  const isRequested = currentUser.sentAcquaintanceRequests?.includes(user.id);

  // Record profile view when component mounts (if not viewing own profile)
  useEffect(() => {
    if (!isSelf) {
      PrivacyService.recordProfileView(user.id, currentUser.id);
      // Track analytics event
      PrivacyService.trackPageView(currentUser.id, 'profile', { viewedUserId: user.id });
    }
  }, [user.id, currentUser.id, isSelf]);

  // Load ad subscriptions for the user's own profile
  useEffect(() => {
    if (isSelf) {
      loadAdSubscriptions();
    }
  }, [isSelf, currentUser.id]);

  const loadAdSubscriptions = async () => {
    setLoadingSubscriptions(true);
    try {
      const subscriptions = await adSubscriptionService.getUserSubscriptions(currentUser.id);
      setAdSubscriptions(subscriptions);
    } catch (error) {
      console.error('Failed to load ad subscriptions:', error);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  // Get package details for a subscription
  const getPackageDetails = (packageId: string) => {
    return AD_PACKAGES.find(pkg => pkg.id === packageId);
  };

  const handleLike = (postId: string) => {
    onLike(postId);
    // Track interaction
    PrivacyService.trackInteraction(currentUser.id, 'like', 'post', { postId });
  };
  
  const handleComment = (postId: string, text: string, parentId?: string) => {
    onComment(postId, text, parentId);
    // Track interaction
    PrivacyService.trackInteraction(currentUser.id, 'comment', 'post', { postId, hasParent: !!parentId });
  };
  
  const handleReact = (postId: string, reaction: string, targetType: 'post' | 'comment', commentId?: string) => {
    onReact(postId, reaction, targetType, commentId);
    // Track interaction
    PrivacyService.trackInteraction(currentUser.id, 'react', targetType, { postId, reaction, commentId });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Cover Section */}
        <div className="relative h-80 overflow-hidden">
          <MediaDisplay 
            url={user.coverImage} 
            type={user.coverType} 
            className="w-full h-full" 
            fallback={<div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500"></div>}
          />
          <div className="absolute inset-0 bg-black/20"></div>
          
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
                {/* Avatar */}
                <div className="flex justify-center lg:justify-start">
                  <div className={`w-32 h-32 rounded-2xl p-1 shadow-lg ${user.activeGlow !== 'none' ? 'ring-4 ring-emerald-400/30' : ''} bg-white dark:bg-slate-800`}>
                    <Avatar 
                      src={user.avatar} 
                      type={user.avatarType} 
                      name={user.name} 
                      size="custom"
                      className="w-full h-full rounded-xl"
                    />
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center lg:text-left">
                  <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                    {user.name}
                  </h1>
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
                  
                  {/* Action Buttons - Moved here from right side */}
                  <div className="flex flex-col gap-3 mb-6 max-w-sm mx-auto lg:mx-0 mt-4">
                    {!isSelf ? (
                      <>
                        {/* Primary Actions Row */}
                        <div className="flex gap-3">
                          <button 
                            onClick={() => onBoostUser && onBoostUser(user.id)}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg text-sm shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                          >
                            <span>🚀</span>
                            <span>Boost</span>
                          </button>
                          <button 
                            onClick={() => isAcquaintance ? onRemoveAcquaintance(user.id) : (isRequested ? null : onAddAcquaintance(user))} 
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium shadow-md transition-all flex items-center justify-center gap-2 ${
                              isAcquaintance 
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600' 
                                : isRequested 
                                  ? 'bg-slate-100 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-400' 
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg'
                            }`}
                            disabled={isRequested}
                          >
                            <span>{isAcquaintance ? '✓' : isRequested ? '⏳' : '+'}</span>
                            <span>{isAcquaintance ? 'Connected' : isRequested ? 'Requested' : 'Connect'}</span>
                          </button>
                        </div>
                        
                        {/* Message Button */}
                        <button 
                          onClick={() => onOpenMessaging && onOpenMessaging(user.id)} 
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 font-medium rounded-lg text-sm shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <span>✉️</span>
                          <span>Message</span>
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
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg text-sm shadow-md hover:shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
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

          {/* Navigation Tabs */}
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
                    onClick={() => !isRequested && onAddAcquaintance(user)} 
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
                      />
                    ))
                  )}
                </>
              )}
            </div>
          ) : activeTab === 'about' ? (
            <div className="space-y-6">
              {/* Bio Section */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">About</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
                  {user.bio || "No bio available."}
                </p>
              </div>

              {/* Additional Info */}
              {(user.dob || user.zodiacSign) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.dob && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                          <span className="text-xl">🎂</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Birthday</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {new Date(user.dob).toLocaleDateString(undefined, {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {user.zodiacSign && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                          <span className="text-xl">✨</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Zodiac Sign</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.zodiacSign}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'adplans' && isSelf ? (
            <div className="space-y-6">
              {/* Ad Plans Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Your Ad Plans</h3>
                    <p className="text-emerald-100 text-sm">
                      Manage your advertising subscriptions and track your ad usage
                    </p>
                  </div>
                  <div className="text-6xl opacity-30">📢</div>
                </div>
              </div>

              {/* Loading State */}
              {loadingSubscriptions ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500 dark:text-slate-400">Loading your ad plans...</p>
                </div>
              ) : adSubscriptions.length === 0 ? (
                /* No Subscriptions */
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                  <div className="text-6xl mb-6 opacity-30">📣</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">No Active Ad Plans</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                    You don't have any ad plans yet. Purchase a plan to start promoting your content across the Aura network.
                  </p>
                  <button
                    onClick={() => {
                      // This would typically open the AdManager modal
                      // For now, we'll just show a message
                      alert('Open the Ad Manager from the main navigation to purchase a plan.');
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:brightness-110 transition-all"
                  >
                    Browse Ad Plans
                  </button>
                </div>
              ) : (
                /* Subscriptions List */
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">✅</span>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {adSubscriptions.filter(s => s.status === 'active').length}
                          </p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Active Plans</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">📊</span>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {adSubscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.adLimit - s.adsUsed), 0)}
                          </p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ads Available</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">🎯</span>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {adSubscriptions.reduce((sum, s) => sum + s.adsUsed, 0)}
                          </p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ads Created</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Subscriptions */}
                  {adSubscriptions.filter(s => s.status === 'active').length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                        Active Plans
                      </h4>
                      <div className="grid gap-4">
                        {adSubscriptions.filter(s => s.status === 'active').map(subscription => {
                          const pkg = getPackageDetails(subscription.packageId);
                          const adsRemaining = subscription.adLimit - subscription.adsUsed;
                          const usagePercent = (adsRemaining / subscription.adLimit) * 100;
                          
                          return (
                            <div
                              key={subscription.id}
                              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                            >
                              {/* Plan Header with Gradient */}
                              <div className={`h-2 bg-gradient-to-r ${pkg?.gradient || 'from-emerald-500 to-teal-600'}`}></div>
                              
                              <div className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                                  <div>
                                    <div className="flex items-center gap-3 mb-2">
                                      <h5 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {subscription.packageName}
                                      </h5>
                                      <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold uppercase">
                                        Active
                                      </span>
                                      {pkg?.paymentType === 'subscription' && (
                                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold uppercase">
                                          Monthly
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                      {pkg?.subtitle || 'Ad subscription plan'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                      {pkg?.price || `$${pkg?.numericPrice || 0}`}
                                    </p>
                                  </div>
                                </div>

                                {/* Usage Stats */}
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 mb-6">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Ad Slots Usage</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                      {adsRemaining} of {subscription.adLimit} remaining
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                                    <div
                                      className={`h-4 rounded-full transition-all duration-500 ${
                                        usagePercent > 50 ? 'bg-emerald-500' :
                                        usagePercent > 20 ? 'bg-amber-500' : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${usagePercent}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span>{subscription.adsUsed} used</span>
                                    <span>{adsRemaining} available</span>
                                  </div>
                                </div>

                                {/* Plan Details Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Started</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                      {new Date(subscription.startDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {subscription.endDate && (
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Expires</p>
                                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {new Date(subscription.endDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                  )}
                                  {subscription.nextBillingDate && (
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Next Billing</p>
                                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {new Date(subscription.nextBillingDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                  )}
                                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ad Limit</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                      {subscription.adLimit} ads
                                    </p>
                                  </div>
                                </div>

                                {/* Features List */}
                                {pkg?.features && (
                                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Plan Features</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {pkg.features.slice(0, 6).map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                          {feature}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Expired/Cancelled Subscriptions */}
                  {adSubscriptions.filter(s => s.status !== 'active').length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-slate-400 rounded-full"></span>
                        Past Plans
                      </h4>
                      <div className="grid gap-4">
                        {adSubscriptions.filter(s => s.status !== 'active').map(subscription => {
                          const pkg = getPackageDetails(subscription.packageId);
                          
                          return (
                            <div
                              key={subscription.id}
                              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 opacity-70"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <h5 className="text-lg font-bold text-slate-900 dark:text-white">
                                      {subscription.packageName}
                                    </h5>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                      subscription.status === 'expired'
                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                        : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                                    }`}>
                                      {subscription.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Used {subscription.adsUsed} of {subscription.adLimit} ads •
                                    Ended {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-slate-400">
                                    {pkg?.price || `$${pkg?.numericPrice || 0}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
            // You could update the user object here if needed
          }}
        />
      )}
    </div>
  );
};

export default ProfileView;