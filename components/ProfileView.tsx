
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
    <div className="animate-in fade-in duration-700 space-y-8 pb-24 max-w-4xl mx-auto px-4">
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
        <div className="h-48 sm:h-64 relative bg-slate-200 dark:bg-slate-950 overflow-hidden">
           {user.coverImage ? renderMedia(user.coverImage, user.coverType, "w-full h-full") : <div className="w-full h-full aura-bg-gradient opacity-20"></div>}
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
           <button onClick={onBack} className="absolute top-6 left-6 px-4 py-2 bg-black/30 backdrop-blur-xl text-white text-[10px] font-black rounded-xl hover:bg-black/60 transition-all uppercase tracking-widest border border-white/20 z-20">← Back</button>
        </div>

        <div className="px-8 sm:px-12 pb-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 -mt-16 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6 flex-1 min-w-0">
              {/* Avatar Section */}
              <div className="flex flex-col items-center lg:items-start flex-shrink-0">
                <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] p-1.5 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden mb-4 ${user.activeGlow !== 'none' ? 'ring-8 ring-emerald-500/20' : ''}`}>
                  <div className="w-full h-full rounded-[2rem] overflow-hidden border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    {renderMedia(user.avatar, user.avatarType, "w-full h-full", true)}
                  </div>
                </div>
              </div>

              {/* User Info Section */}
              <div className="flex-1 text-center lg:text-left lg:pb-4">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight break-words mb-3">{user.name}</h2>
                <div className="inline-block mb-4 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                  <p className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px]">{user.handle}</p>
                </div>
                
                {/* Bio Preview */}
                {user.bio && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-md mx-auto lg:mx-0 line-clamp-2">
                    {user.bio}
                  </p>
                )}
                
                {/* Quick Stats for Mobile */}
                <div className="flex gap-6 justify-center lg:justify-start mt-4 lg:hidden">
                  <div className="text-center">
                    <div className="text-lg font-black text-slate-900 dark:text-white">{posts.length}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-slate-900 dark:text-white">{user.acquaintances?.length || 0}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Connections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{user.trustScore}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Trust Score</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Section */}
            <div className="flex flex-col gap-4 justify-center lg:justify-end flex-shrink-0 min-w-[280px]">
              {/* Primary Action Buttons Row */}
              <div className="flex gap-3 justify-center lg:justify-end">
                {!isSelf && (
                  <>
                    <button 
                      onClick={() => onBoostUser && onBoostUser(user.id)}
                      className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold uppercase tracking-wider rounded-xl text-[10px] shadow-lg hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2 min-w-[120px]"
                    >
                      <span>🚀</span>
                      <span>Boost Orbit</span>
                    </button>
                    <button 
                      onClick={() => isAcquaintance ? onRemoveAcquaintance(user.id) : (isRequested ? null : onAddAcquaintance(user))} 
                      className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[120px] ${
                        isAcquaintance 
                          ? 'bg-rose-50 text-rose-600 border-2 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30' 
                          : isRequested 
                            ? 'bg-slate-100 text-slate-500 border-2 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' 
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'
                      }`}
                      disabled={isRequested}
                    >
                      <span>{isAcquaintance ? '🔗' : isRequested ? '⏳' : '🤝'}</span>
                      <span>{isAcquaintance ? 'Connected' : isRequested ? 'Requested' : 'Connect'}</span>
                    </button>
                  </>
                )}
                {isSelf && (
                  <button 
                    onClick={onEditProfile} 
                    className="flex-1 lg:flex-none px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white font-bold uppercase tracking-wider rounded-xl text-[10px] shadow-lg hover:bg-slate-800 dark:hover:bg-slate-600 active:scale-95 transition-all flex items-center justify-center gap-2 min-w-[140px]"
                  >
                    <span>⚙️</span>
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {/* Secondary Action Buttons Row */}
              <div className="flex gap-3 justify-center lg:justify-end">
                {!isSelf && (
                  <button 
                    onClick={() => onOpenMessaging && onOpenMessaging(user.id)} 
                    className="flex-1 lg:flex-none px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-600 font-bold uppercase tracking-wider rounded-xl text-[10px] shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 active:scale-95 transition-all flex items-center justify-center gap-2 min-w-[120px]"
                  >
                    <span>✉️</span>
                    <span>Message</span>
                  </button>
                )}
                {isSelf && (
                  <button 
                    onClick={onSerendipityMode} 
                    className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold uppercase tracking-wider rounded-xl text-[10px] shadow-lg hover:from-purple-600 hover:to-pink-600 active:scale-95 transition-all flex items-center justify-center gap-2 min-w-[140px]"
                  >
                    <span>✨</span>
                    <span>Serendipity</span>
                  </button>
                )}
              </div>

              {/* User Stats Row - Desktop Only */}
              <div className="hidden lg:flex gap-4 justify-center lg:justify-end mt-2">
                <div className="text-center">
                  <div className="text-lg font-black text-slate-900 dark:text-white">{posts.length}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-slate-900 dark:text-white">{user.acquaintances?.length || 0}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Connections</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{user.trustScore}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Trust Score</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <div className="flex border-b border-slate-100 dark:border-slate-800 gap-8 mb-8">
              <button onClick={() => setActiveTab('posts')} className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'posts' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Timeline {activeTab === 'posts' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-full"></div>}</button>
              <button onClick={() => setActiveTab('about')} className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'about' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>About {activeTab === 'about' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-full"></div>}</button>
            </div>
            
            {activeTab === 'posts' ? (
              <div className="space-y-8">
                {posts.length === 0 ? (
                  <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No posts yet.</p>
                  </div>
                ) : (
                  posts.map(post => (
                    <PostCard key={post.id} post={post} currentUser={currentUser} allUsers={allUsers} onLike={handleLike} onComment={handleComment} onReact={handleReact} onShare={onShare} onViewProfile={onViewProfile} onSearchTag={onSearchTag} onBoost={onBoostPost} onDeletePost={onDeletePost} onDeleteComment={onDeleteComment} />
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-10 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 text-center italic text-slate-700 dark:text-slate-300">"{user.bio || "No bio available."}"</div>
                {user.dob && (
                  <div className="flex flex-wrap justify-center gap-4">
                    <div className="px-6 py-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                      <span className="text-xl">🎂</span>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Birthday</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{new Date(user.dob).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    {user.zodiacSign && (
                      <div className="px-6 py-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                        <span className="text-xl">✨</span>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Star Sign</p>
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{user.zodiacSign}</p>
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
