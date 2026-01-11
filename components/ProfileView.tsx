
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
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, posts, currentUser, allUsers, onBack, onReact, onComment, onShare, onAddAcquaintance, onRemoveAcquaintance, onViewProfile, onSearchTag, onLike, onBoostPost, onBoostUser, onEditProfile, onDeletePost, onDeleteComment, onSerendipityMode
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
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 -mt-16 relative z-10">
            <div className="flex flex-col items-center md:items-start flex-1 min-w-0">
              <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] p-1.5 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden mb-4 ${user.activeGlow !== 'none' ? 'ring-8 ring-emerald-500/20' : ''}`}>
                <div className="w-full h-full rounded-[2rem] overflow-hidden border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                  {renderMedia(user.avatar, user.avatarType, "w-full h-full", true)}
                </div>
              </div>
              <div className="text-center md:text-left px-2">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight break-words">{user.name}</h2>
                <div className="inline-block mt-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                  <p className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px]">{user.handle}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center md:justify-end md:mt-20 flex-shrink-0">
              {!isSelf && (
                <button 
                  onClick={() => onBoostUser && onBoostUser(user.id)}
                  className="px-8 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl text-[11px] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                >
                  🚀 Boost Orbit
                </button>
              )}
              {isSelf ? (
                <>
                  <button onClick={onEditProfile} className="px-8 py-4 bg-slate-900 dark:bg-slate-800 text-white font-black uppercase tracking-widest rounded-2xl text-[11px] shadow-xl hover:brightness-110 active:scale-95 transition-all">Edit Profile</button>
                  <button onClick={onSerendipityMode} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl text-[11px] shadow-xl hover:from-purple-700 hover:to-indigo-700 active:scale-95 transition-all flex items-center gap-2">
                    <span>✨</span> Serendipity
                  </button>
                </>
              ) : (
                <button onClick={() => isAcquaintance ? onRemoveAcquaintance(user.id) : (isRequested ? null : onAddAcquaintance(user))} className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${isAcquaintance ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400' : isRequested ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500' : 'aura-bg-gradient text-white'}`}>{isAcquaintance ? 'Unlink' : isRequested ? 'Requested' : 'Connect'}</button>
              )}
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
