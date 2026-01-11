
import React, { useState } from 'react';
import { User, Post } from '../types';
import PostCard from './PostCard';

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
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, posts, currentUser, allUsers, onBack, onReact, onComment, onShare, onAddAcquaintance, onRemoveAcquaintance, onViewProfile, onSearchTag, onLike, onBoostPost, onBoostUser, onEditProfile, onDeletePost, onDeleteComment, onSerendipityMode, onOpenMessaging
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const isSelf = currentUser.id === user.id;
  const isAcquaintance = currentUser.acquaintances?.includes(user.id);
  const isRequested = currentUser.sentConnectionRequests?.includes(user.id);

  const renderMedia = (url: string, type: 'image' | 'video' | undefined, className: string, isAvatar: boolean = false) => {
    if (!url) return <div className={`${className} bg-slate-100 dark:bg-slate-800`}></div>;
    const isVideo = type === 'video' || url.toLowerCase().match(/\.(mp4|webm|ogg|mov|gifv)$/) !== null;
    const isGif = url.toLowerCase().match(/\.gif$/) !== null;
    const objectClass = isAvatar ? 'object-contain bg-slate-50 dark:bg-slate-800' : 'object-cover';
    if (isVideo) {
      return (
        <video key={`profile-video-${url}`} src={url} className={`${className} ${objectClass} w-full h-full`} autoPlay loop muted playsInline preload="auto" />
      );
    }
    return (
      <img key={`profile-img-${url}`} src={url} className={`${className} ${objectClass} w-full h-full`} alt="" loading="eager" unoptimized={isGif ? "true" : undefined} />
    );
  };

  const handleLike = (postId: string) => onLike(postId);
  const handleComment = (postId: string, text: string, parentId?: string) => onComment(postId, text, parentId);
  const handleReact = (postId: string, reaction: string, targetType: 'post' | 'comment', commentId?: string) => onReact(postId, reaction, targetType, commentId);

  return (
    <div className="animate-in fade-in duration-700 space-y-8 pb-24 max-w-5xl mx-auto px-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
        {/* Cover Image Section */}
        <div className="h-48 sm:h-64 relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
           {user.coverImage ? renderMedia(user.coverImage, user.coverType, "w-full h-full") : <div className="w-full h-full bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"></div>}
           <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
           <button onClick={onBack} className="absolute top-6 left-6 px-4 py-2 bg-black/20 backdrop-blur-md text-white text-xs font-semibold rounded-lg hover:bg-black/40 transition-all border border-white/20 z-20">
             ← BACK
           </button>
        </div>

        {/* Profile Content */}
        <div className="px-8 sm:px-12 pb-8 -mt-20 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Left Section - Avatar & Info */}
            <div className="flex flex-col lg:flex-row lg:items-start gap-6 flex-1">
              {/* Avatar */}
              <div className="flex justify-center lg:justify-start">
                <div className={`w-36 h-36 rounded-3xl p-1 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden ${user.activeGlow !== 'none' ? 'ring-4 ring-emerald-400/30' : ''}`}>
                  <div className="w-full h-full rounded-[1.4rem] overflow-hidden bg-slate-50 dark:bg-slate-800">
                    {renderMedia(user.avatar, user.avatarType, "w-full h-full", true)}
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center lg:text-left lg:pt-4">
                <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
                  {user.name}
                </h1>
                <div className="inline-block mb-4 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">{user.handle}</p>
                </div>
                
                {/* Bio */}
                {user.bio && (
                  <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed max-w-lg mx-auto lg:mx-0 mb-6">
                    {user.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="flex gap-8 justify-center lg:justify-start">
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{posts.length}</div>
                    <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Posts</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{user.acquaintances?.length || 0}</div>
                    <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Connections</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{user.trustScore}</div>
                    <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Trust Score</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex flex-col gap-3 lg:pt-4 min-w-[280px]">
              {!isSelf ? (
                <>
                  {/* Primary Actions */}
                  <div className="flex gap-3">
                    <button 
                      onClick={() => onBoostUser && onBoostUser(user.id)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl text-sm shadow-lg hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span>🚀</span>
                      <span>BOOST ORBIT</span>
                    </button>
                    <button 
                      onClick={() => isAcquaintance ? onRemoveAcquaintance(user.id) : (isRequested ? null : onAddAcquaintance(user))} 
                      className={`flex-1 px-6 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                        isAcquaintance 
                          ? 'bg-white text-rose-600 border-2 border-rose-200 hover:bg-rose-50 dark:bg-slate-800 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/20' 
                          : isRequested 
                            ? 'bg-slate-100 text-slate-500 border-2 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' 
                            : 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700'
                      }`}
                      disabled={isRequested}
                    >
                      <span>{isAcquaintance ? '✓' : isRequested ? '⏳' : '+'}</span>
                      <span>{isAcquaintance ? 'CONNECTED' : isRequested ? 'REQUESTED' : 'CONNECT'}</span>
                    </button>
                  </div>
                  
                  {/* Secondary Action */}
                  <button 
                    onClick={() => onOpenMessaging && onOpenMessaging(user.id)} 
                    className="w-full px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-600 font-semibold rounded-xl text-sm shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>✉️</span>
                    <span>MESSAGE</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={onEditProfile} 
                    className="w-full px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white font-semibold rounded-xl text-sm shadow-lg hover:bg-slate-800 dark:hover:bg-slate-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>⚙️</span>
                    <span>EDIT PROFILE</span>
                  </button>
                  <button 
                    onClick={onSerendipityMode} 
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl text-sm shadow-lg hover:from-purple-600 hover:to-pink-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>✨</span>
                    <span>SERENDIPITY</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-12 border-b border-slate-200 dark:border-slate-700">
            <div className="flex gap-8">
              <button 
                onClick={() => setActiveTab('posts')} 
                className={`pb-4 px-1 text-sm font-semibold uppercase tracking-wider transition-all relative ${
                  activeTab === 'posts' 
                    ? 'text-slate-900 dark:text-white border-b-2 border-emerald-500' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                TIMELINE
              </button>
              <button 
                onClick={() => setActiveTab('about')} 
                className={`pb-4 px-1 text-sm font-semibold uppercase tracking-wider transition-all relative ${
                  activeTab === 'about' 
                    ? 'text-slate-900 dark:text-white border-b-2 border-emerald-500' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                ABOUT
              </button>
            </div>
          </div>
            
          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === 'posts' ? (
              <div className="space-y-6">
                {posts.length === 0 ? (
                  <div className="py-16 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <div className="text-4xl mb-4 opacity-30">📝</div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No posts yet</p>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Posts will appear here when they're shared</p>
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
              </div>
            ) : (
              <div className="space-y-6">
                {/* Bio Section */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">About</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {user.bio || "No bio available."}
                  </p>
                </div>

                {/* Additional Info */}
                {(user.dob || user.zodiacSign) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.dob && (
                      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <span className="text-lg">🎂</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Birthday</p>
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
                      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                            <span className="text-lg">✨</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Zodiac Sign</p>
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
      </div>
    </div>
  );
};

export default ProfileView;
