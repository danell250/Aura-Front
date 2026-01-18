
import React, { useEffect } from 'react';
import { Ad } from '../types';
import { adAnalyticsService } from '../services/adAnalyticsService';

interface AdSidebarCardProps {
  ad: Ad;
  onCTAClick?: (link: string) => void;
}

const AdSidebarCard: React.FC<AdSidebarCardProps> = ({ ad, onCTAClick }) => {
  useEffect(() => {
    if (!ad?.id) return;

    if (typeof window === 'undefined' || !(window as any).IntersectionObserver) {
      adAnalyticsService.trackImpression(ad.id);
      return;
    }

    const elementId = `sidebar-ad-${ad.id}`;
    const el = document.getElementById(elementId);
    if (!el) return;

    let fired = false;
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && !fired) {
          fired = true;
          adAnalyticsService.trackImpression(ad.id);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [ad.id]);
  
  const handleCTAClick = (e: React.MouseEvent) => {
    if (onCTAClick) {
      e.preventDefault();
      adAnalyticsService.trackClick(ad.id);
      onCTAClick(ad.ctaLink);
    }
  };

  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}`;
    
    const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1`;

    return null;
  };

  const isVideo = ad.mediaType === 'video' || ad.mediaUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov|gifv)$/) !== null;
  const embedUrl = getEmbedUrl(ad.mediaUrl);

  return (
    <div
      id={`sidebar-ad-${ad.id}`}
      className="glass rounded-3xl p-4 border border-emerald-100/50 futuristic-shadow relative group"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-50 border border-slate-200/20">
          <img src={ad.ownerAvatar} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="overflow-hidden">
          <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase truncate leading-none">{ad.ownerName}</p>
          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Verified</span>
        </div>
      </div>
      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 mb-2">{ad.headline}</h4>
      <div 
        className="rounded-xl overflow-hidden mb-3 aspect-video bg-slate-50 dark:bg-slate-900 relative"
      >
        {embedUrl ? (
          <iframe 
            src={embedUrl} 
            className="w-full h-full border-none pointer-events-none" 
            allow="autoplay"
          />
        ) : isVideo ? (
          <video 
            key={ad.mediaUrl}
            src={ad.mediaUrl} 
            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" 
            muted 
            autoPlay 
            loop 
            playsInline 
          />
        ) : (
          <img 
            key={ad.mediaUrl}
            src={ad.mediaUrl} 
            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" 
            alt="" 
          />
        )}
      </div>
      <a 
        href={ad.ctaLink} 
        onClick={handleCTAClick}
        className="w-full py-2 bg-slate-900 dark:bg-emerald-600 text-white text-[9px] font-black uppercase text-center rounded-xl tracking-widest block transition-colors hover:bg-emerald-700"
      >
        {ad.ctaText}
      </a>
    </div>
  );
};

export default AdSidebarCard;
