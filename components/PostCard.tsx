
import React, { useState, useRef, useEffect } from 'react';
import { Post, User, Comment } from '../types';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { geminiService } from '../services/gemini';
import BoostModal from './BoostModal';
import { Avatar, MediaDisplay } from './MediaDisplay';
import { getTrustBadgeConfig } from '../services/trustService';
import { PostService } from '../services/postService';
import PDFViewer from './PDFViewer';
import { linkService } from '../services/linkService';
import TimeCapsuleCard from './TimeCapsuleCard';

const AutoplayVideo: React.FC<{ src: string; className?: string }> = ({ src, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    element.muted = true;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!videoRef.current) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const playPromise = videoRef.current.play();
            if (playPromise && typeof (playPromise as any).catch === 'function') {
              (playPromise as any).catch(() => {});
            }
          } else {
            videoRef.current.pause();
          }
        });
      },
      {
        threshold: [0.2, 0.6, 0.9],
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      className={`${className} cursor-pointer`}
      loop
      muted
      playsInline
      preload="auto"
    />
  );
};

interface PostCardProps {
  post: Post;
  onReact: (postId: string, reaction: string, targetType: 'post' | 'comment', commentId?: string) => void;
  onComment: (postId: string, text: string, parentId?: string) => void;
  currentUser: User;
  onViewProfile: (userId: string) => void;
  onSearchTag: (tag: string) => void;
  onLike: (postId: string) => void;
  onShare?: (post: Post) => void;
  onBoost?: (postId: string, credits: number) => void;
  onDeletePost?: (postId: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onOpenCreditStore?: () => void;
  allUsers: User[];
  onSendConnectionRequest?: (senderId: string, receiverId: string) => void;
  onLoadComments?: (postId: string, comments: Comment[]) => void;
  onSyncPost?: (post: Post) => void;
  key?: React.Key;
}

const PostCard: React.FC<PostCardProps> = React.memo(({ 
  post, onReact, onComment, currentUser, onViewProfile, onSearchTag, onLike, onShare, onBoost, onDeletePost, onDeleteComment, onOpenCreditStore, allUsers, onLoadComments, onSyncPost
}) => {
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [activeCommentEmojiPicker, setActiveCommentEmojiPicker] = useState<string | null>(null);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'Harassment' | 'Spam' | 'Misinformation' | 'HateSpeech' | 'Other'>('Harassment');
  const [reportNotes, setReportNotes] = useState('');
  const [reportMsg, setReportMsg] = useState<string | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const commentEmojiPickerRef = useRef<HTMLDivElement>(null);
  const authorTrustBadge = getTrustBadgeConfig(post.author.trustScore ?? 0);

  if (post.isTimeCapsule) {
    return (
      <TimeCapsuleCard
        post={post}
        currentUser={currentUser}
        onViewProfile={onViewProfile}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onDeletePost={onDeletePost}
      />
    );
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(prev => (prev ? false : prev));
      }
      if (commentEmojiPickerRef.current && !commentEmojiPickerRef.current.contains(event.target as Node)) {
        setActiveCommentEmojiPicker(prev => (prev ? null : prev));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!Array.isArray(post.mediaItems) || post.mediaItems.length === 0) return;
      if (event.key === 'ArrowRight') {
        setCurrentMediaIndex(prev => {
          if (prev >= post.mediaItems!.length - 1) return prev;
          return prev + 1;
        });
      } else if (event.key === 'ArrowLeft') {
        setCurrentMediaIndex(prev => {
          if (prev <= 0) return prev;
          return prev - 1;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [post.mediaItems]);

  useEffect(() => {
    if (!post.isTimeCapsule || !post.unlockDate || post.isUnlocked) {
      setTimeRemaining(null);
      return;
    }
    const updateTime = () => {
      const now = Date.now();
      const unlockTime = post.unlockDate as number;
      if (now >= unlockTime) {
        setTimeRemaining(null);
        return;
      }
      const diff = unlockTime - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };
    updateTime();
    const interval = window.setInterval(updateTime, 60000);
    return () => {
      window.clearInterval(interval);
    };
  }, [post.isTimeCapsule, post.unlockDate, post.isUnlocked]);

  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?/\s]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}`;
    
    const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1`;

    const igMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/(?:p|reels|reel|tv)\/)([^/?\s]+)/);
    if (igMatch) return `https://www.instagram.com/reels/${igMatch[1]}/embed`;

    const fbMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:facebook\.com\/)(?:watch\/\?v=|reel\/|share\/r\/|share\/v\/|.*\/videos\/)([^/?\s]+)/);
    if (fbMatch) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`;

    return null;
  };

  const renderMedia = (url: string, type: 'image' | 'video' | 'document' | undefined, className: string) => {
    if (!url) return null;
    const embedUrl = getEmbedUrl(url);
    if (embedUrl) {
      const isFB = embedUrl.includes('facebook.com');
      const isIG = embedUrl.includes('instagram.com');
      return (
        <div className={`${isIG ? 'aspect-[9/16] max-w-[400px] mx-auto' : 'aspect-video'} w-full rounded-[2rem] overflow-hidden ${className}`}>
          <iframe 
            key={embedUrl} 
            src={embedUrl} 
            className="w-full h-full border-none" 
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" 
            allowFullScreen 
            title="Embedded Media" 
            scrolling={isIG ? "no" : "yes"}
          />
        </div>
      );
    }
    const lowerUrl = url.toLowerCase();
    const isDocument = type === 'document' || lowerUrl.match(/\.(pdf|doc|docx)$/i) !== null;
    if (isDocument) {
      if (lowerUrl.endsWith('.pdf')) {
        return (
          <PDFViewer key={url} url={url} />
        );
      }

      return (
        <div
          key={url}
          className="w-full h-[120px] flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-300">
              DOC
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Document</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 underline"
              >
                Open document in new tab
              </a>
            </div>
          </div>
        </div>
      );
    }
    const isVideo = type === 'video' || lowerUrl.match(/\.(mp4|webm|ogg|mov|gifv)$/i) !== null;
    const isGif = lowerUrl.match(/\.gif$/i) !== null;
    if (isVideo) {
      return (
        <AutoplayVideo key={url} src={url} className={className} />
      );
    }
    if (isGif) {
      return (
        <img key={url} src={url} className={className} alt="" />
      );
    }
    return <img key={url} src={url} className={className} alt="" />;
  };

  const handleBoostClick = () => {
    setShowBoostModal(true);
  };

  const handleBoostConfirm = (credits: number) => {
    if (onBoost) {
      onBoost(post.id, credits);
    }
  };
  
  const submitReport = async () => {
    try {
      const resp = await PostService.reportPost(post.id, currentUser.id, reportReason, reportNotes);
      if (resp.success) {
        setReportMsg('Post reported');
        setReportOpen(false);
        setReportNotes('');
      } else {
        setReportMsg(resp.error || 'Failed to report post');
      }
    } catch {
      setReportMsg('Failed to report post');
    } finally {
      setTimeout(() => setReportMsg(null), 3000);
    }
  };

  useEffect(() => {
    const fetchComments = async () => {
      if (!onLoadComments) return;
      if (post.comments && post.comments.length > 0) return; // already loaded
      if (post.commentCount === 0) return; // No comments to load
      setIsLoadingComments(true);
      try {
        const { CommentService } = await import('../services/commentService');
        const resp = await CommentService.getComments(post.id);
        if (resp.success && resp.data) {
          onLoadComments(post.id, resp.data as unknown as Comment[]);
        }
      } catch (e) {
        console.error('Failed to load comments for post', post.id, e);
      } finally {
        setIsLoadingComments(false);
      }
    };
    if (showComments) fetchComments();
  }, [showComments, post.id, onLoadComments, post.comments]);

  // Live comment polling while comments are open
  useEffect(() => {
    if (!showComments || !onLoadComments) return;
    let intervalId: number | undefined;
    const poll = async () => {
      try {
        const { CommentService } = await import('../services/commentService');
        const resp = await CommentService.getComments(post.id);
        if (resp.success && Array.isArray(resp.data)) {
          // Only update if counts differ or latest timestamp changed
          const currentCount = (post.comments || []).length;
          const newCount = resp.data.length;
          if (newCount !== currentCount) {
            onLoadComments(post.id, resp.data as unknown as Comment[]);
          } else {
            const currentLatest = Math.max(0, ...((post.comments || []).map(c => c.timestamp || 0)));
            const newLatest = Math.max(0, ...(resp.data.map((c: any) => c.timestamp || 0)));
            if (newLatest > currentLatest) {
              onLoadComments(post.id, resp.data as unknown as Comment[]);
            }
          }
        }
      } catch {
        // ignore polling errors
      }
    };
    poll();
    intervalId = window.setInterval(poll, 7000);
    return () => { if (intervalId) window.clearInterval(intervalId); };
  }, [showComments, post.id, onLoadComments, post.comments]);

  useEffect(() => {
    if (!onSyncPost) return;
    if (post.id.startsWith('temp-')) return;
    let intervalId: number | undefined;
    const pollPost = async () => {
      try {
        const { PostService } = await import('../services/postService');
        const resp = await PostService.getPostById(post.id);
        if (resp.success && resp.post) {
          onSyncPost(resp.post);
        }
      } catch {
      }
    };
    pollPost();
    intervalId = window.setInterval(pollPost, 7000);
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [post.id, onSyncPost]);

  useEffect(() => {
    if (post.id.startsWith('temp-')) return;
    PostService.incrementPostViews(post.id).catch(() => {});
  }, [post.id]);

  const handleAISuggestion = async () => {
    if (isSuggesting) return;
    setIsSuggesting(true);
    const suggestion = await geminiService.suggestReply(post.content);
    setCommentText(suggestion);
    setIsSuggesting(false);
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(\s+)/);
    return parts.map((part, i) => {
      if (part.startsWith('#') && part.length > 1) {
        return (
          <span
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onSearchTag(part);
            }}
            className="text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer hover:underline"
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('@') && part.length > 1) {
        const handle = part.replace(/[.,!?;:]/g, '');
        const taggedUser = allUsers.find((u) => u.handle === handle);
        return (
          <span
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              if (taggedUser) onViewProfile(taggedUser.id);
            }}
            className="text-emerald-500 font-bold cursor-pointer hover:underline"
          >
            {part}
          </span>
        );
      }
      if (linkService.isUrl(part)) {
        const { display, title } = linkService.truncateUrl(part);
        return (
          <a
            key={i}
            href={part}
            title={title}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium hover:underline max-w-full truncate align-baseline"
          >
            <span className="truncate">{display}</span>
            <span aria-hidden="true" className="text-[11px] align-baseline">
              ↗
            </span>
          </a>
        );
      }
      return part;
    });
  };

  const handlePostEmojiClick = (emojiData: EmojiClickData) => {
    onReact(post.id, emojiData.emoji, 'post');
    setShowEmojiPicker(false);
  };

  const handleCommentEmojiClick = (emojiData: EmojiClickData, commentId: string) => {
    onReact(post.id, emojiData.emoji, 'comment', commentId);
    setActiveCommentEmojiPicker(null);
  };

  const handleSubmitComment = (parentId?: string) => {
    const text = parentId ? replyText : commentText;
    if (!text.trim()) return;
    onComment(post.id, text, parentId);
    if (parentId) { setReplyText(''); setReplyingTo(null); } 
    else { setCommentText(''); }
  };

  const renderComment = (comment: Comment, isNested = false) => {
    const comments = post.comments || [];
    const replies = comments.filter(c => c.parentId === comment.id);
    const isReplying = replyingTo === comment.id;
    const isEmojiPickerActive = activeCommentEmojiPicker === comment.id;
    
    return (
      <div key={comment.id} className={`${isNested ? 'ml-10 mt-4 border-l-2 border-slate-100 dark:border-slate-800 pl-4' : 'mt-6'}`}>
        <div className="flex gap-3">
          <div onClick={() => onViewProfile(comment.author.id)} className="cursor-pointer shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:scale-110 flex items-center justify-center">
              <Avatar 
                src={comment.author.avatar} 
                type={comment.author.avatarType} 
                name={comment.author.name} 
                size="custom"
                className="w-full h-full"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 relative group futuristic-shadow transition-all hover:bg-white dark:hover:bg-slate-800">
              <div className="flex justify-between items-start mb-1">
                <button 
                  onClick={() => onViewProfile(comment.author.id)}
                  className="text-[10px] font-black uppercase tracking-tight text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {comment.author.name}
                </button>
                <span className="text-[8px] text-slate-400 uppercase font-medium">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{comment.text}</p>
              
              {comment.reactions && Object.keys(comment.reactions).length > 0 && (
                <div className="absolute -bottom-3 right-4 flex gap-1 animate-in zoom-in duration-300">
                  {Object.entries(comment.reactions).map(([emoji, count]) => (
                    <button 
                      key={emoji} 
                      onClick={() => onReact(post.id, emoji, 'comment', comment.id)}
                      className={`bg-white dark:bg-slate-700 border rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm scale-90 transition-all hover:scale-100 ${comment.userReactions?.includes(emoji) ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 'border-slate-100 dark:border-slate-600'}`}
                    >
                      <span className="text-[10px] leading-none align-middle">{emoji}</span>
                      <span className="text-[8px] font-black text-slate-400">{count as number}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-2 ml-2">
              <button onClick={() => setReplyingTo(isReplying ? null : comment.id)} className="text-[9px] font-black text-slate-400 hover:text-emerald-500 uppercase tracking-widest transition-colors">Reply</button>
              <div className="relative">
                <button onClick={() => setActiveCommentEmojiPicker(isEmojiPickerActive ? null : comment.id)} className="text-[9px] font-black text-slate-400 hover:text-emerald-500 uppercase tracking-widest transition-colors">React</button>
                {isEmojiPickerActive && (
                  <div className="absolute bottom-full left-0 mb-4 z-[9999] shadow-2xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-2" ref={commentEmojiPickerRef}>
                    <EmojiPicker 
                      onEmojiClick={(ed) => handleCommentEmojiClick(ed, comment.id)} 
                      theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT} 
                      width={280} 
                      height={350}
                      searchDisabled={false}
                      skinTonesDisabled={true}
                      previewConfig={{
                        showPreview: false
                      }}
                    />
                  </div>
                )}
              </div>
              {comment.author.id === currentUser.id && (
                <button 
                  onClick={() => onDeleteComment && onDeleteComment(post.id, comment.id)} 
                  className="text-[9px] font-black text-rose-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
            {isReplying && (
              <div className="mt-4 flex gap-2 animate-in slide-in-from-top-2">
                <input autoFocus value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmitComment(comment.id)} placeholder="Sync a reply..." className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-emerald-400 transition-all font-medium" />
                <button onClick={() => handleSubmitComment(comment.id)} className="px-4 py-2 aura-bg-gradient text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">Send</button>
              </div>
            )}
            {replies.map(reply => renderComment(reply, true))}
          </div>
        </div>
      </div>
    );
  };

  const displayMediaUrl = post.mediaUrl || (post.content.match(/https?:\/\/[^\s]+\.(?:mp4|webm|ogg|mov|gif|gifv|jpg|jpeg|png|webp)/i)?.[0] || (getEmbedUrl(post.content) ? post.content.match(/https?:\/\/[^\s]+/)?.[0] : null));
  const hasMediaItems = Array.isArray(post.mediaItems) && post.mediaItems.length > 0;
  const currentMediaItem = hasMediaItems ? post.mediaItems[currentMediaIndex] : undefined;
  const currentMediaUrl = hasMediaItems
    ? (currentMediaItem?.url || post.mediaUrl || displayMediaUrl)
    : displayMediaUrl;
  const currentMediaType = hasMediaItems
    ? (currentMediaItem?.type || post.mediaType)
    : post.mediaType;
  const rootComments = (post.comments || []).filter(c => !c.parentId);
  const baseShadow = '0 24px 80px -32px rgba(15,23,42,0.65)';
  const radianceGlow = post.radiance > 10
    ? `${baseShadow}, 0 0 0 1px rgba(16,185,129,${Math.min(post.radiance / 120, 0.6)})`
    : baseShadow;

  return (
    <div 
      id={`post-${post.id}`}
      className={`relative mb-8 group overflow-hidden rounded-[2.25rem] border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60 backdrop-blur-xl transition-all duration-500 ${post.isBoosted ? 'ring-1 ring-emerald-400/40' : ''}`} 
      style={{ boxShadow: radianceGlow }}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={() => onViewProfile(post.author.id)}>
            <div className={`w-11 h-11 rounded-xl overflow-hidden border transition-all duration-300 bg-slate-50 dark:bg-slate-800 shrink-0 ${post.author.activeGlow === 'emerald' ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-slate-100 dark:border-slate-800'}`}>
              <Avatar 
                src={post.author.avatar} 
                type={post.author.avatarType} 
                name={post.author.name} 
                size="custom"
                className="w-full h-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <button 
                onClick={() => onViewProfile(post.author.id)}
                className="font-bold text-slate-900 dark:text-white text-sm tracking-tight leading-none truncate hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer text-left"
              >
                {post.author.name}
              </button>
              <div className="flex items-center gap-2 mt-1">
                <button 
                  onClick={() => onViewProfile(post.author.id)}
                  className="text-xs text-slate-500 font-medium truncate hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {post.author.handle}
                </button>
                <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0"></span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">{post.energy}</span>
                {(post.author as any).isPrivate && (
                  <>
                    <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0"></span>
                    <span className="text-[8px] text-amber-600 dark:text-amber-400 font-medium shrink-0 flex items-center gap-1">
                      <span>🔒</span>
                      <span>Private</span>
                    </span>
                  </>
                )}
                {authorTrustBadge && (
                  <>
                    <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0"></span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[8px] font-semibold ${authorTrustBadge.colorClass}`}
                    >
                      <span className={authorTrustBadge.textClass}>
                        <span className="mr-0.5">{authorTrustBadge.icon}</span>
                        <span>{authorTrustBadge.label}</span>
                      </span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {post.isBoosted && (
              <span className="px-2 py-1 bg-emerald-500 text-white text-[8px] font-bold uppercase rounded-full tracking-wider shadow-sm">Boosted</span>
            )}
            {post.isTimeCapsule && (
              <span className={`px-2 py-1 text-[8px] font-bold uppercase rounded-full tracking-wider shadow-sm flex items-center gap-1 ${
                post.isUnlocked 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              }`}>
                <span className="text-[10px]">⏰</span>
                {post.isUnlocked ? 'Unlocked' : 'Time Capsule'}
              </span>
            )}
            {/* Show "Just posted" indicator for current user's recent posts (last 5 minutes) */}
            {post.author.id === currentUser.id && (Date.now() - post.timestamp) < (5 * 60 * 1000) && (
              <span className="px-2 py-1 bg-blue-500 text-white text-[8px] font-bold uppercase rounded-full tracking-wider shadow-sm animate-pulse">Just posted</span>
            )}
            <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{new Date(post.timestamp).toLocaleDateString()}</span>
            <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
              {(post.viewCount ?? 0).toLocaleString()} views
            </span>
            {post.author.id === currentUser.id && (
              <button 
                onClick={() => onDeletePost && onDeletePost(post.id)} 
                className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                title="Delete Post"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Time Capsule unlock info */}
        {post.isTimeCapsule && !post.isUnlocked && post.unlockDate && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⏰</span>
              <div>
                <h3 className="font-bold text-purple-700 dark:text-purple-300 text-sm">Time Capsule Locked</h3>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Will unlock on {new Date(post.unlockDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            {post.timeCapsuleTitle && (
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                "{post.timeCapsuleTitle}"
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-purple-600 dark:text-purple-400">
                This message is waiting to be revealed to {post.timeCapsuleType === 'group' ? 'the group' : 'you'} in the future.
              </p>
              {timeRemaining && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-[11px] font-semibold text-purple-700 dark:text-purple-200">
                  <span>⏰</span>
                  <span>{timeRemaining} remaining</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Unlocked Time Capsule header */}
        {post.isTimeCapsule && post.isUnlocked && post.unlockDate && (
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <div>
                <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  Time Capsule Unlocked
                </p>
                {post.timeCapsuleTitle && (
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    "{post.timeCapsuleTitle}"
                  </p>
                )}
                <p className="text-xs text-purple-500 dark:text-purple-400">
                  Message from {new Date(post.timestamp).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed mb-6 whitespace-pre-wrap font-medium tracking-tight break-words overflow-hidden w-full">
          <span className="align-middle inline-block leading-[1.4] max-w-full">
            {renderContent(post.content)}
          </span>
        </div>

        {hasMediaItems && currentMediaUrl ? (
          <div className="rounded-2xl overflow-hidden mb-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-inner min-h-[100px] flex flex-col items-center justify-center relative group/carousel">
            {(post.mediaItems[currentMediaIndex].headline ||
              post.mediaItems[currentMediaIndex].caption) && (
              <div className="w-full p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                {post.mediaItems[currentMediaIndex].headline && (
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                    {post.mediaItems[currentMediaIndex].headline}
                  </h4>
                )}
                {post.mediaItems[currentMediaIndex].caption && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {post.mediaItems[currentMediaIndex].caption}
                  </p>
                )}
              </div>
            )}

            <div className="w-full relative">
              {renderMedia(currentMediaUrl, currentMediaType, "w-full h-auto max-h-[600px] object-contain")}

              {post.mediaItems.length > 1 && (
                <div className="absolute left-3 top-3 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium z-10">
                  {currentMediaIndex + 1} / {post.mediaItems.length}
                </div>
              )}

              {post.mediaItems.length > 1 && (
                <>
                  {currentMediaIndex > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentMediaIndex((prev) => prev - 1);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all opacity-0 group-hover/carousel:opacity-100 z-10"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  {currentMediaIndex < post.mediaItems.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentMediaIndex((prev) => prev + 1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all opacity-0 group-hover/carousel:opacity-100 z-10"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}

                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {post.mediaItems.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all shadow-sm ${
                          idx === currentMediaIndex ? 'bg-white w-3' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : !hasMediaItems && currentMediaUrl ? (
          <div className="rounded-2xl overflow-hidden mb-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-inner min-h-[100px] flex items-center justify-center">
            {renderMedia(currentMediaUrl, currentMediaType, "w-full h-auto max-h-[600px] object-contain")}
          </div>
        ) : null}

        <div className="flex items-center gap-2 mb-6 flex-wrap">
           {Object.entries(post.reactions).map(([emoji, count]) => (
             <button key={emoji} onClick={() => onReact(post.id, emoji, 'post')} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${post.userReactions?.includes(emoji) ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-700 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200'}`}>
               <span className="text-sm leading-none align-middle">{emoji}</span>
               <span className={`text-xs font-bold ${post.userReactions?.includes(emoji) ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{count as number}</span>
             </button>
           ))}
           <div className="relative">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-500 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-4 z-[9999] shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300" ref={emojiPickerRef}>
                  <EmojiPicker 
                    onEmojiClick={handlePostEmojiClick} 
                    theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT} 
                    width={320} 
                    height={400}
                    searchDisabled={false}
                    skinTonesDisabled={true}
                    previewConfig={{
                      showPreview: false
                    }}
                  />
                </div>
              )}
           </div>
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-slate-50 dark:border-slate-800/50">
           <div className="flex items-center gap-6">
              <button onClick={() => onLike(post.id)} className={`flex items-center gap-2 transition-all active:scale-110 group/radiance ${(post as any).sessionLiked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-emerald-600'}`}>
                <div className="relative">
                  <span className={`text-xl transition-transform ${(post as any).sessionLiked ? 'scale-110' : 'group-hover/radiance:scale-110'}`}>✨</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">{post.radiance}</span>
              </button>
              <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-2 transition-all group/comments ${showComments ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-indigo-600'}`}>
                <span className={`text-xl transition-transform ${showComments ? 'scale-110' : 'group-hover/comments:scale-110'}`}>💬</span>
                <span className="text-xs font-bold uppercase tracking-wider">{post.commentCount ?? (post.comments || []).length}</span>
              </button>
       </div>
           
           <div className="flex items-center gap-2">
             <button onClick={handleBoostClick} className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">Boost</button>
             <button onClick={() => onShare && onShare(post)} className="p-2 text-slate-400 hover:text-emerald-500 transition-all flex items-center gap-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                <span className="text-xs font-bold uppercase tracking-wider">Share</span>
              </button>
              <button onClick={() => setReportOpen(true)} className="p-2 text-slate-400 hover:text-rose-500 transition-all flex items-center gap-1">
                <span className="w-5 h-5">🚩</span>
                <span className="text-xs font-bold uppercase tracking-wider">Report</span>
              </button>
           </div>
        </div>

        {showComments && (
        <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800/50 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
        {isLoadingComments && (
        <div className="text-center text-xs text-slate-400">Loading comments...</div>
        )}
        <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-center">
                <Avatar 
                  src={currentUser.avatar} 
                  type={currentUser.avatarType} 
                  name={currentUser.name} 
                  size="custom"
                  className="w-full h-full"
                />
              </div>
              <div className="flex-1 space-y-3">
                <div className="relative group">
                  <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..." className="w-full bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-emerald-500/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-5 py-3 text-sm outline-none transition-all resize-none min-h-[50px] dark:text-white font-medium" />
                  <button onClick={handleAISuggestion} disabled={isSuggesting} className="absolute right-3 top-3 p-1.5 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 transition-all opacity-0 group-hover:opacity-100" title="AI Suggestion">{isSuggesting ? '...' : '✨'}</button>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => handleSubmitComment()} disabled={!commentText.trim()} className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-30 transition-all hover:bg-emerald-700">Post</button>
                </div>
              </div>
            </div>
            <div className="space-y-1">{rootComments.length === 0 ? (<p className="text-center text-xs font-medium text-slate-400 py-6">No comments yet</p>) : rootComments.map(comment => renderComment(comment))}</div>
          </div>
        )}
      </div>

      {/* Boost Modal */}
      <BoostModal
        isOpen={showBoostModal}
        onClose={() => setShowBoostModal(false)}
        onBoost={handleBoostConfirm}
        currentUser={currentUser}
        postAuthor={post.author.name}
        onOpenCreditStore={onOpenCreditStore}
      />
      
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setReportOpen(false);
              setReportReason('Harassment');
              setReportNotes('');
            }}
          ></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Report Post</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {(['Harassment','Spam','Misinformation','HateSpeech','Other'] as const).map(r => (
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
                onClick={() => {
                  setReportOpen(false);
                  setReportReason('Harassment');
                  setReportNotes('');
                }}
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
      
      {reportMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm shadow-lg">
            {reportMsg}
          </div>
        </div>
      )}
    </div>
  );
});

export default PostCard;
