import React, { useState, useEffect } from 'react';
import { Post, User } from '../types';

interface TimeCapsuleCardProps {
  post: Post;
  currentUser: User;
  onViewProfile: (userId: string) => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string, text: string) => void;
  onShare?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
}

const TimeCapsuleCard: React.FC<TimeCapsuleCardProps> = ({
  post,
  currentUser,
  onViewProfile,
  onLike,
  onComment,
  onShare,
  onDeletePost
}) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (!post.unlockDate) return;

    const updateTimeRemaining = () => {
      const now = Date.now();
      const unlockTime = post.unlockDate!;
      
      if (now >= unlockTime) {
        setIsUnlocked(true);
        setTimeRemaining('');
        return;
      }

      const diff = unlockTime - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m ${Math.floor((diff % (1000 * 60)) / 1000)}s`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${Math.floor((diff % (1000 * 60)) / 1000)}s`);
      } else {
        setTimeRemaining(`${minutes}m ${Math.floor((diff % (1000 * 60)) / 1000)}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000); // Update every second

    return () => clearInterval(interval);
  }, [post.unlockDate]);

  const formatUnlockDate = () => {
    if (!post.unlockDate) return '';
    return new Date(post.unlockDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOwner = post.author.id === currentUser.id;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Time Capsule Header */}
      <div className={`p-6 ${isUnlocked ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-slate-600 to-slate-700'} text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${isUnlocked ? 'bg-white/20' : 'bg-white/10'} rounded-2xl flex items-center justify-center backdrop-blur-sm`}>
                <span className="text-2xl">{isUnlocked ? '📖' : '🔒'}</span>
              </div>
              <div>
                <h3 className="font-black text-lg uppercase tracking-tight">
                  {isUnlocked ? 'Time Capsule Unlocked!' : 'Time Capsule'}
                </h3>
                <p className="text-white/80 text-sm font-medium">
                  {post.timeCapsuleTitle || 'Untitled Time Capsule'}
                </p>
              </div>
            </div>
            
            {/* Type Badge */}
            <div className={`px-3 py-1.5 ${isUnlocked ? 'bg-white/20' : 'bg-white/10'} rounded-full backdrop-blur-sm`}>
              <div className="flex items-center gap-2">
                <span className="text-sm">{post.timeCapsuleType === 'group' ? '👥' : '👤'}</span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  {post.timeCapsuleType}
                </span>
              </div>
            </div>
          </div>

          {/* Unlock Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/90">
                {isUnlocked ? 'Unlocked on' : 'Unlocks on'} {formatUnlockDate()}
              </p>
              {!isUnlocked && timeRemaining && (
                <p className="text-xs text-white/70 mt-1">
                  ⏰ {timeRemaining} remaining
                </p>
              )}
            </div>
            
            {isUnlocked && (
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-xs font-medium">✨ Revealed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Author Info */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewProfile(post.author.id)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img 
              src={post.author.avatar} 
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-700" 
              alt="" 
            />
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{post.author.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{post.author.handle}</p>
            </div>
          </button>
          
          <div className="ml-auto flex items-center gap-2">
            {/* Show "Just posted" indicator for current user's recent time capsules (last 5 minutes) */}
            {isOwner && (Date.now() - post.timestamp) < (5 * 60 * 1000) && (
              <span className="px-2 py-1 bg-purple-500 text-white text-[8px] font-bold uppercase rounded-full tracking-wider shadow-sm animate-pulse">Just created</span>
            )}
            <span className="text-xs text-slate-400 font-medium">
              {new Date(post.timestamp).toLocaleDateString()}
            </span>
            {isOwner && onDeletePost && (
              <button
                onClick={() => onDeletePost(post.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                title="Delete time capsule"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Group Members */}
        {post.timeCapsuleType === 'group' && post.invitedUsers && post.invitedUsers.length > 0 && (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Shared with {post.invitedUsers.length} {post.invitedUsers.length === 1 ? 'person' : 'people'}
            </p>
            <div className="flex items-center gap-2">
              {post.invitedUsers.slice(0, 3).map((userId, index) => (
                <div key={userId} className="w-6 h-6 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  {index + 1}
                </div>
              ))}
              {post.invitedUsers.length > 3 && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  +{post.invitedUsers.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {isUnlocked ? (
          <div className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {post.mediaItems && post.mediaItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {post.mediaItems.map((media, idx) => (
                  <div key={idx} className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="relative">
                      {media.type === 'image' ? (
                        <img src={media.url} className="w-full h-auto object-cover" alt={media.caption || ''} />
                      ) : (
                        <video src={media.url} controls className="w-full h-auto object-cover" />
                      )}
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white">
                        {media.type === 'image' ? 'Image' : 'Video'}
                      </div>
                    </div>
                    {media.caption && (
                      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {media.caption}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              post.mediaUrl && (
                <div className="rounded-2xl overflow-hidden">
                  {post.mediaType === 'image' ? (
                    <img src={post.mediaUrl} className="w-full h-auto" alt="" />
                  ) : post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} controls className="w-full h-auto" />
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <p className="text-sm text-slate-600 dark:text-slate-400">📎 Attachment: {post.mediaUrl}</p>
                    </div>
                  )}
                </div>
              )
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {onLike && (
                <button
                  onClick={() => onLike(post.id)}
                  className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-purple-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm font-medium">{post.radiance}</span>
                </button>
              )}
              
              {onShare && (
                <button
                  onClick={() => onShare(post)}
                  className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-purple-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="text-sm font-medium">Share</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Time Capsule Locked</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              This message will be revealed on {formatUnlockDate()}
            </p>
            {timeRemaining && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                <span className="text-xs">⏰</span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {timeRemaining} remaining
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeCapsuleCard;
