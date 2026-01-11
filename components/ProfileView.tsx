
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
    <div className="animate-in fade-in duration-700 pb-24 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
        {/* Cover Image Section */}
        <div className="h-56 sm:h-72 relative bg-slate-100 dark:bg-slate-950 overflow-hidden group">
           {user.coverImage ? renderMedia(user.coverImage, user.coverType, "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105") : <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900"></div>}
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
           <button onClick={onBack} className="absolute top-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-md text-white text-xs font-bold rounded-lg hover:bg-black/60 transition-all border border-white/10 z-20 flex items-center gap-2">
             <span className="text-lg">←</span> BACK
           </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 sm:px-10 pb-10 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 -mt-16 sm:-mt-20">
            {/* Avatar */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-2xl p-1 bg-white dark:bg-slate-900 shadow-xl overflow-hidden ${user.activeGlow !== 'none' ? 'ring-4 ring-emerald-500/20' : 'ring-1 ring-slate-200 dark:ring-slate-700'}`}>
                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 relative">
                  {renderMedia(user.avatar, user.avatarType, "w-full h-full", true)}
                </div>
              </div>
            </div>

            {/* Info & Actions */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 pt-2 sm:pt-20 lg:pt-4">
              {/* User Details */}
              <div className="flex-1 text-center lg:text-left space-y-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    {user.name}
                  </h1>
                  <div className="flex items-center justify-center lg:justify-start gap-2 mt-1">
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">@{user.handle.replace('@', '')}</p>
                    {user.trustScore > 90 && (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider rounded-full">Trusted</span>
                    )}
                  </div>
                </div>
                
                {user.bio && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-xl mx-auto lg:mx-0 border-l-2 border-slate-200 dark:border-slate-700 pl-4 italic">
                    {user.bio}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="flex items-center justify-center lg:justify-start gap-8 pt-2">
                  <div className="text-center lg:text-left">
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{posts.length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Posts</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
                  <div className="text-center lg:text-left">
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{user.acquaintances?.length || 0}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Connections</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
                  <div className="text-center lg:text-left">
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{user.trustScore}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Trust Score</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 min-w-[240px] pt-2">
                {!isSelf ? (
                  <>
                    <button 
                      onClick={() => onBoostUser && onBoostUser(user.id)}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span>🚀</span> Boost Orbit
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => isAcquaintance ? onRemoveAcquaintance(user.id) : (isRequested ? null : onAddAcquaintance(user))} 
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all active:scale-95 flex items-center justify-center gap-2 ${
                          isAcquaintance 
                            ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400' 
                            : isRequested 
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700' 
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                        disabled={isRequested}
                      >
                        {isAcquaintance ? 'Unlink' : isRequested ? 'Pending' : 'Connect'}
                      </button>
                      <button 
                        onClick={() => onOpenMessaging && onOpenMessaging(user.id)} 
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                        title="Message"
                      >
                        ✉️
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={onEditProfile} 
                      className="w-full px-4 py-2.5 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-md hover:bg-slate-800 dark:hover:bg-slate-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span>⚙️</span> Edit Profile
                    </button>
                    <button 
                      onClick={onSerendipityMode} 
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-md hover:from-amber-500 hover:to-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span>✨</span> Serendipity
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-10 border-b border-slate-200 dark:border-slate-800">
            <div className="flex gap-8">
              <button 
                onClick={() => setActiveTab('posts')} 
                className={`pb-3 px-1 text-xs font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'posts' 
                    ? 'text-slate-900 dark:text-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-slate-900 dark:after:bg-white' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Timeline
              </button>
              <button 
                onClick={() => setActiveTab('about')} 
                className={`pb-3 px-1 text-xs font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'about' 
                    ? 'text-slate-900 dark:text-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-slate-900 dark:after:bg-white' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                About
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
