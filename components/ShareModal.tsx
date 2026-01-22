import React, { useState, useEffect } from 'react';
import { MediaItem } from '../types';

interface ShareModalProps {
  content: string;
  url: string;
  title?: string;
  image?: string;
  mediaItems?: MediaItem[];
  onClose: () => void;
  currentUser?: any;
  onAuraShare?: (sharedPost: any, originalPost?: any) => void;
  originalPost?: any;
}

const ShareModal: React.FC<ShareModalProps> = ({ content, url, title, image, mediaItems, onClose, currentUser, onAuraShare, originalPost }) => {
  const [copied, setCopied] = useState(false);
  const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin || 'https://auraso.vercel.app';
  const shareUrl = url.startsWith('http') ? url : `${baseUrl.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
  const socialShareUrl = shareUrl;

  const shareTitle = title || 'Check out this post on Aura';

  const getEnhancedShareContent = () => {
    const authorName = originalPost?.author?.name || currentUser?.name || 'Aura User';
    const authorHandle = originalPost?.author?.handle || currentUser?.handle || '';
    const trustScore = originalPost?.author?.trustScore || 0;

    return `"${content}"${authorHandle ? `\n\n— @${authorHandle}` : `\n\n— ${authorName}`}${trustScore ? ` (Trust: ${trustScore})` : ''}\n\n${shareUrl}`;
  };

  const shareText = getEnhancedShareContent();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAuraShare = () => {
    // Create a new post in the Aura feed with shared content
    const sharedPost = {
      id: `shared-${Date.now()}`,
      content: `🔄 Shared Post:\n\n${content}`,
      author: currentUser,
      timestamp: Date.now(),
      reactions: {},
      comments: [],
      userReactions: [],
      isBoosted: false,
      radiance: 0,
      energy: 'NEUTRAL' as const,
      mediaUrl: image || (mediaItems && mediaItems.length > 0 ? mediaItems[0].url : undefined),
      mediaType: image || (mediaItems && mediaItems.length > 0) ? 'image' as const : undefined,
      originalPost: {
        content,
        url,
        title
      }
    };
    
    if (onAuraShare) {
      onAuraShare(sharedPost, originalPost);
    }
    
    onClose();
  };

  const socialPlatforms = [
    { 
      name: 'Aura', 
      icon: '✨', 
      color: 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white',
      link: '#', // Internal Aura sharing
      action: 'aura',
      description: 'Share inside Aura'
    },
    { 
      name: 'X', 
      icon: '𝕏', 
      color: 'bg-black text-white',
      link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(getEnhancedShareContent())}&url=${encodeURIComponent(shareUrl)}`,
      description: 'Share on X (Twitter)'
    },
    { 
      name: 'LinkedIn', 
      icon: 'in', 
      color: 'bg-[#0077b5] text-white',
      link: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(socialShareUrl)}`,
      description: 'Share on LinkedIn'
    },
    { 
      name: 'Facebook', 
      icon: 'f', 
      color: 'bg-[#1877f2] text-white',
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(socialShareUrl)}&quote=${encodeURIComponent(`${shareTitle}\n${content}`)}`,
      description: 'Share on Facebook'
    },
    { 
      name: 'Instagram', 
      icon: '📸', 
      color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white',
      link: '#', // Instagram doesn't support direct sharing, will copy to clipboard
      action: 'copy',
      description: 'Copy for Instagram'
    },
    { 
      name: 'Threads', 
      icon: '🧵', 
      color: 'bg-black text-white',
      link: `https://www.threads.net/intent/post?text=${encodeURIComponent(getEnhancedShareContent())}`,
      description: 'Share on Threads'
    },
    { 
      name: 'Reddit', 
      icon: '🤖', 
      color: 'bg-[#ff4500] text-white',
      link: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&text=${encodeURIComponent(content)}`,
      description: 'Share on Reddit'
    },
    { 
      name: 'WhatsApp', 
      icon: '💬', 
      color: 'bg-[#25D366] text-white', 
      link: `https://wa.me/?text=${encodeURIComponent(getEnhancedShareContent())}`,
      description: 'Share on WhatsApp'
    },
    { 
      name: 'Telegram', 
      icon: '✈️', 
      color: 'bg-[#0088cc] text-white', 
      link: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(getEnhancedShareContent())}`,
      description: 'Share on Telegram'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl md:max-w-3xl rounded-[2.5rem] p-5 sm:p-6 md:p-8 shadow-2xl border border-white/50 dark:border-slate-800 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white">Share Post</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">✕</button>
        </div>

        {/* Preview Section */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 sm:p-5 mb-6 border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Preview</p>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-3">
              {content}
            </p>
            {image && (
              <div className="mt-3 rounded-lg overflow-hidden max-h-40 bg-slate-200 dark:bg-slate-700">
                <img
                  src={image}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 break-all hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              {shareUrl}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">Share to platforms</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {socialPlatforms.map(platform => (
              <button
                key={platform.name}
                onClick={() => {
                  if (platform.action === 'copy') {
                    copyToClipboard();
                  } else if (platform.action === 'aura') {
                    handleAuraShare();
                  } else {
                    window.open(platform.link, '_blank', 'noopener,noreferrer');
                  }
                }}
                className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl ${platform.color} shadow-md hover:shadow-lg transition-all active:scale-95 transform hover:-translate-y-1`}
                title={`Share to ${platform.name}`}
              >
                {/* Tooltip */}
                {platform.description && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {platform.description}
                  </div>
                )}
                <span className="text-lg font-black">
                  {platform.icon}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {platform.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 block">Share Link</label>
          <div className="flex gap-2">
            <input 
              readOnly 
              value={shareUrl} 
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none truncate hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            />
            <button 
              onClick={copyToClipboard}
              className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all transform active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 shadow-md hover:shadow-lg'
              }`}
            >
              {copied ? 'Synced' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 mt-6 pt-6">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 block">Full Post Text</label>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
            <textarea 
              readOnly 
              value={getEnhancedShareContent()} 
              className="w-full bg-transparent text-xs font-mono text-slate-700 dark:text-slate-300 outline-none resize-none h-24" 
            />
            <button 
              onClick={() => { 
                navigator.clipboard.writeText(getEnhancedShareContent()); 
                setCopied(true); 
                setTimeout(() => setCopied(false), 2000); 
              }} 
              className="mt-3 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors" 
            > 
              {copied ? '✓ Copied to clipboard' : 'Copy this text'} 
            </button> 
          </div> 
        </div>

        <p className="mt-6 text-center text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
          Aura Global Broadcast Protocol
        </p>
      </div>
    </div>
  );
};

export default ShareModal;
