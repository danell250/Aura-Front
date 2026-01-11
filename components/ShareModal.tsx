import React, { useState } from 'react';

interface ShareModalProps {
  content: string;
  url: string;
  title?: string;
  image?: string;
  onClose: () => void;
  currentUser?: any;
  onAuraShare?: (sharedPost: any, originalPost?: any) => void;
  originalPost?: any;
}

const ShareModal: React.FC<ShareModalProps> = ({ content, url, title, image, onClose, currentUser, onAuraShare, originalPost }) => {
  const [copied, setCopied] = useState(false);
  const baseUrl = 'https://auraradiance.vercel.app';
  const shareUrl = `${baseUrl}/${url}`;
  const shareTitle = title || 'Check out this post on Aura';
  const shareText = `${content}\n\n${shareUrl}`;

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
      mediaUrl: image,
      mediaType: image ? 'image' as const : undefined,
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
      action: 'aura'
    },
    { 
      name: 'X', 
      icon: '𝕏', 
      color: 'bg-black text-white',
      link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareTitle}\n${content}\n${shareUrl}`)}`
    },
    { 
      name: 'LinkedIn', 
      icon: 'in', 
      color: 'bg-[#0077b5] text-white',
      link: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&summary=${encodeURIComponent(content)}${image ? `&source=${encodeURIComponent(image)}` : ''}`
    },
    { 
      name: 'Facebook', 
      icon: 'f', 
      color: 'bg-[#1877f2] text-white',
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(`${shareTitle}\n${content}`)}${image ? `&picture=${encodeURIComponent(image)}` : ''}`
    },
    { 
      name: 'Instagram', 
      icon: '📸', 
      color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white',
      link: '#', // Instagram doesn't support direct sharing, will copy to clipboard
      action: 'copy'
    },
    { 
      name: 'Threads', 
      icon: '🧵', 
      color: 'bg-black text-white',
      link: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${shareTitle}\n${content}\n${shareUrl}`)}`
    },
    { 
      name: 'Reddit', 
      icon: '🤖', 
      color: 'bg-[#ff4500] text-white',
      link: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}${image ? `&image=${encodeURIComponent(image)}` : ''}`
    }
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-white/50 dark:border-slate-800">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">Radiate Signal</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">✕</button>
        </div>

        <div className="flex justify-center gap-4 mb-12 flex-wrap">
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
              className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center text-lg font-black shadow-lg hover:scale-110 transition-transform active:scale-90`}
              title={`Share to ${platform.name}`}
            >
              {platform.icon}
            </button>
          ))}
        </div>

        <div className="relative">
          <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3 block ml-1">Universal Sync Link</label>
          <div className="flex gap-2">
            <input 
              readOnly 
              value={shareUrl} 
              className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-500 outline-none truncate"
            />
            <button 
              onClick={copyToClipboard}
              className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-slate-700 text-white hover:brightness-125'}`}
            >
              {copied ? 'Synced' : 'Copy'}
            </button>
          </div>
        </div>

        <p className="mt-10 text-center text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-slate-600">Aura Global Broadcast Protocol</p>
      </div>
    </div>
  );
};

export default ShareModal;