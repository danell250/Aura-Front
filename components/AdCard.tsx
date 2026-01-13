
import React, { useState, useRef, useEffect } from 'react';
import { Ad } from '../types';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Avatar } from './MediaDisplay';

interface AdCardProps {
  ad: Ad;
  onReact?: (adId: string, reaction: string) => void;
  onShare?: (ad: Ad) => void;
  onSearchTag?: (tag: string) => void;
  onViewProfile?: (userId: string) => void;
  key?: React.Key;
}

const AdCard: React.FC<AdCardProps> = React.memo(({ ad, onReact, onShare, onSearchTag, onViewProfile }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(prev => (prev ? false : prev));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (onReact) onReact(ad.id, emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const renderTextWithHashtags = (text: string) => {
    if (!onSearchTag) return text;
    
    const parts = text.split(/(\s+)/);
    return parts.map((part, i) => {
      if (part.startsWith('#') && part.length > 1) {
        return (
          <span 
            key={i} 
            onClick={(e) => { e.stopPropagation(); onSearchTag(part); }} 
            className="text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer hover:underline"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}`;
    
    const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1`;

    return null;
  };

  const renderMedia = (url: string, type: 'image' | 'video' | undefined, className: string = "w-full h-full object-cover", isAvatar: boolean = false) => {
    if (!url) return <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 uppercase font-black text-[10px]">No Signal Preview</div>;
    
    const embedUrl = !isAvatar ? getEmbedUrl(url) : null;
    if (embedUrl) {
      return (
        <div className={`aspect-video w-full rounded-3xl overflow-hidden ${className}`}>
          <iframe src={embedUrl} className="w-full h-full border-none" allow="autoplay; fullscreen" />
        </div>
      );
    }

    const isVideo = type === 'video' || url.toLowerCase().match(/\.(mp4|webm|ogg|mov|gifv)$/) !== null;
    const objectClass = isAvatar ? 'object-contain bg-slate-50 dark:bg-slate-800' : 'object-cover';
    
    if (isVideo) {
      return (
        <video 
          key={url} 
          src={url} 
          className={`${className} ${objectClass} cursor-pointer`} 
          muted 
          autoPlay 
          loop 
          playsInline 
          preload="auto"
        />
      );
    }
    return (
      <img 
        key={url} 
        src={url} 
        className={`${className} ${objectClass} transition-transform duration-700 hover:scale-105`} 
        alt="" 
      />
    );
  };

  const isUniversalTier = ad.subscriptionTier === 'Universal Signal';

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 overflow-hidden mb-8 shadow-md relative group transition-all ${
      isUniversalTier 
        ? 'border-amber-400 dark:border-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.2)]' 
        : 'border-emerald-100 dark:border-emerald-900/30'
    }`}>
      {isUniversalTier && (
        <div className="absolute top-0 right-0 p-2 z-10">
           <span className="bg-amber-400 text-slate-900 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Verified Signal</span>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 border ${isUniversalTier ? 'border-amber-400' : 'border-slate-100 dark:border-slate-800'}`}>
              <Avatar 
                src={ad.ownerAvatar}
                type={ad.ownerAvatarType}
                name={ad.ownerName}
                size="custom"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <button 
                onClick={() => onViewProfile?.(ad.ownerId)}
                className="font-bold text-slate-900 dark:text-white leading-none text-xs hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer text-left"
              >
                {ad.ownerName}
              </button>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isUniversalTier ? 'bg-amber-400' : 'bg-emerald-500'}`}></span>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isUniversalTier ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>Sponsored</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onShare && onShare(ad)}
            className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-500 transition-all active:scale-90 px-3 py-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">Share</span>
          </button>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{renderTextWithHashtags(ad.headline)}</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-5 leading-relaxed font-medium">{renderTextWithHashtags(ad.description)}</p>

        <div className={`rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border mb-5 aspect-video flex items-center justify-center min-h-[100px] ${isUniversalTier ? 'border-amber-400/20' : 'border-slate-100 dark:border-slate-800'}`}>
          {renderMedia(ad.mediaUrl, ad.mediaType, "w-full h-full object-cover", false)}
        </div>

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {ad.reactions && Object.entries(ad.reactions).map(([emoji, count]) => (
            <button 
              key={emoji} 
              onClick={() => onReact && onReact(ad.id, emoji)} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${ad.userReactions?.includes(emoji) ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200'}`}
            >
              <span className="text-sm">{emoji}</span>
              <span className={`text-xs font-bold ${ad.userReactions?.includes(emoji) ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{count as number}</span>
            </button>
          ))}
          <div className="relative">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-4 z-50 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300" ref={emojiPickerRef}>
                <EmojiPicker onEmojiClick={handleEmojiClick} theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT} width={280} height={350} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-50 dark:border-slate-800/50">
           <a 
            href={ad.ctaLink} 
            target="_blank"
            rel="noreferrer"
            className={`px-6 py-2.5 font-bold rounded-xl text-xs shadow-sm hover:brightness-110 active:scale-95 transition-all ${isUniversalTier ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}
           >
            {ad.ctaText}
          </a>
        </div>
      </div>
    </div>
  );
});

export default AdCard;
