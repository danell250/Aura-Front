import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { SerendipityMatch, getTrustBadgeConfig } from '../services/trustService';

interface SerendipityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProfile: (userId: string) => void;
  onMessage: (userId: string) => void;
  onRefresh: () => void;
  matches: SerendipityMatch[];
  isLoading: boolean;
}

const SerendipityModal: React.FC<SerendipityModalProps> = ({
  isOpen,
  onClose,
  onNavigateToProfile,
  onMessage,
  onRefresh,
  matches,
  isLoading
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setActiveIndex(0);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const hasMatches = matches.length > 0;
  const activeMatch = hasMatches ? matches[Math.min(activeIndex, matches.length - 1)] : null;

  const handleSkip = () => {
    if (!hasMatches) return;
    const nextIndex = activeIndex + 1;
    if (nextIndex >= matches.length) {
      onClose();
      return;
    }
    setActiveIndex(nextIndex);
  };

  const handleConnect = () => {
    if (!activeMatch) return;
    onNavigateToProfile(activeMatch.user.id);
    onClose();
  };

  const handleMessage = () => {
    if (!activeMatch) return;
    onMessage(activeMatch.user.id);
    onClose();
  };

  const renderMatchCard = (match: SerendipityMatch) => {
    const user = match.user as User;
    const trustBadge = getTrustBadgeConfig(match.trustScore ?? 0);
    const compatibilityLabel = `${match.compatibilityScore}/100 match`;
    const sharedTags = match.sharedHashtags.slice(0, 3);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name?.charAt(0) || '👤'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-black text-slate-900 dark:text-white">
                  {user.name}
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{user.handle}</span>
                {user.industry && (
                  <>
                    <span>•</span>
                    <span>{user.industry}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-[0.12em]">
                {compatibilityLabel}
              </span>
            </div>
            {trustBadge && (
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-medium bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
                <span className={trustBadge.textClass}>
                  <span className="mr-1">{trustBadge.icon}</span>
                  <span>{trustBadge.label}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
              Shared Vibes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sharedTags.length > 0 ? (
                sharedTags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 text-[10px] font-semibold"
                  >
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  No shared tags yet
                </span>
              )}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
              Mutual Connections
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {match.mutualConnections > 0 ? `${match.mutualConnections} shared` : 'No mutuals yet'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Built from your existing network
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
              Activity
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              You: {match.activityLevel.currentUser.toFixed(0)} • Them: {match.activityLevel.candidate.toFixed(0)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Based on how often you both show up
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
              Profile Signal
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              You: {match.profileCompleteness.currentUser.toFixed(0)} • Them: {match.profileCompleteness.candidate.toFixed(0)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              How complete your profiles feel
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-xl text-xs uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Skip
          </button>
          <button
            onClick={handleMessage}
            className="flex-1 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-black rounded-xl text-xs uppercase tracking-widest transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Message
          </button>
          <button
            onClick={handleConnect}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all"
          >
            Connect
          </button>
        </div>

        {matches.length > 1 && (
          <div className="pt-2 flex items-center justify-center gap-1">
            {matches.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${
                  idx === activeIndex ? 'bg-purple-600 dark:bg-purple-400' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={onClose}
        >
          <div
            className={`bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-90 duration-300 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                <span>✨</span> Serendipity Mode
              </h2>
              <p className="text-xs font-black uppercase text-emerald-600 tracking-[0.2em] mt-1">
                Meaningful Connections
              </p>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="mr-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoading && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✨</div>
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Scanning the network for meaningful matches...
                </p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
                </div>
              </div>
            )}

            {!isLoading && activeMatch && renderMatchCard(activeMatch)}

            {!isLoading && !activeMatch && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🌌</div>
                <p className="text-slate-700 dark:text-slate-300 mb-2">
                  No serendipitous matches just yet.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Keep showing up, posting, and connecting. The network learns with you.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-[0.18em]"
                >
                  Back To Aura
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SerendipityModal;
