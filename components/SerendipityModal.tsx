import React, { useState, useEffect } from 'react';
import { User, Post, Ad } from '../types';

interface SerendipityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProfile: (userId: string) => void;
  content: {
    type: 'post' | 'ad';
    content: Post | Ad;
    timeAgo?: string;
    authorName?: string;
  } | null;
}

const SerendipityModal: React.FC<SerendipityModalProps> = ({ 
  isOpen, 
  onClose, 
  onNavigateToProfile,
  content 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const handleViewContent = () => {
    if (content) {
      if (content.type === 'post') {
        onNavigateToProfile((content.content as Post).author.id);
      } else if (content.type === 'ad') {
        onNavigateToProfile((content.content as Ad).ownerId);
      }
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={onClose}
        >
          <div 
            className={`bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-90 duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-4">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                  <span>✨</span> Serendipity Mode
                </h2>
                <p className="text-xs font-black uppercase text-emerald-600 tracking-[0.2em] mt-1">Random Discovery</p>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {content ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <span className="text-lg">
                        {content.type === 'post' ? '📝' : '📢'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white capitalize">
                        {content.type === 'post' ? 'Post' : 'Ad'}
                      </h3>
                      {content.timeAgo && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{content.timeAgo}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                      "{content.type === 'post' 
                        ? (content.content as Post).content 
                        : (content.content as Ad).headline}"
                    </p>
                    
                    {content.authorName && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        By: {content.authorName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-xl text-xs uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleViewContent}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all"
                  >
                    Explore
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✨</div>
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Searching for something magical...
                </p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SerendipityModal;