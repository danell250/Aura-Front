import React, { useState, useEffect } from 'react';
import { User, Post } from '../types';
import PostCard from './PostCard';
import { MediaDisplay, Avatar } from './MediaDisplay';
import OnlineStatus from './OnlineStatus';
import PrivacySettings from './PrivacySettings';
import { PrivacyService } from '../services/privacyService';

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
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
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
          ) : (
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
          )}
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