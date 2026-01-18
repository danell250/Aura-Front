
import React, { useState, useRef, useEffect } from 'react';
import { User, EnergyType, Post } from '../types';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

const getZodiacSign = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries ♈';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus ♉';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini ♊';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer ♋';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo ♌';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo ♍';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra ♎';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio ♏';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius ♐';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn ♑';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius ♒';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces ♓';
  return '';
};

interface BirthdayPostProps {
  birthdayUser: User;
  quirkyWish: string;
  onReact: (postId: string, reaction: string) => void;
  onComment: (postId: string, text: string) => void;
  currentUser: User;
  onViewProfile: (userId: string) => void;
  birthdayPostId: string;
  reactions?: Record<string, number>;
  userReactions?: string[];
  key?: React.Key;
  onShare: (mode: 'public' | 'acquaintances' | 'private') => void;
}

const BirthdayPost: React.FC<BirthdayPostProps> = ({ 
  birthdayUser, quirkyWish, onReact, onComment, currentUser, onViewProfile, birthdayPostId, reactions = {}, userReactions = [], onShare
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const zodiacSign = birthdayUser.zodiacSign || (birthdayUser.dob ? getZodiacSign(birthdayUser.dob) : '');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onReact(birthdayPostId, emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 via-emerald-50/50 to-rose-50/50 dark:from-indigo-950/20 dark:via-emerald-950/20 dark:to-rose-950/20 rounded-[3rem] border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden mb-8 relative group">
      {/* Confetti Decorative Layer */}
      <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
        <div className="absolute top-10 left-10 text-xl animate-bounce">🎈</div>
        <div className="absolute top-20 right-20 text-xl animate-bounce delay-700">✨</div>
        <div className="absolute bottom-10 left-1/2 text-xl animate-pulse">🍰</div>
        <div className="absolute top-1/2 left-4 text-xl animate-bounce delay-300">🎉</div>
      </div>

      <div className="p-10 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-5">
            <div 
              className="w-20 h-20 rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-700 shadow-xl cursor-pointer hover:scale-110 transition-transform bg-slate-50 dark:bg-slate-800"
              onClick={() => onViewProfile(birthdayUser.id)}
            >
              <img src={birthdayUser.avatar} className="w-full h-full object-contain" alt="" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                Orbit Milestone: {birthdayUser.firstName}!
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-full tracking-widest shadow-lg shadow-emerald-500/20">
                  Birthday Energy
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Neural Sync Announcement
                </span>
                {zodiacSign && (
                  <span className="px-3 py-1 bg-white/80 dark:bg-slate-900/60 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase rounded-full tracking-widest border border-emerald-200 dark:border-emerald-700">
                    {zodiacSign}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-4xl">🎂</div>
        </div>

        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-8 border border-white/50 dark:border-slate-700 shadow-inner mb-8">
          <p className="text-xl font-bold text-slate-800 dark:text-slate-200 leading-relaxed text-center italic tracking-tight">
            "{quirkyWish}"
          </p>
        </div>

        {currentUser.id === birthdayUser.id && (
          <div className="flex flex-wrap items-center gap-3 mb-8 justify-center">
            <button
              onClick={() => onShare('public')}
              className="px-6 py-3 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.18em] shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              Share To Feed
            </button>
            <button
              onClick={() => onShare('acquaintances')}
              className="px-6 py-3 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.18em] shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              Share To Acquaintances
            </button>
            <button
              onClick={() => onShare('private')}
              className="px-6 py-3 rounded-xl bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 text-[11px] font-black uppercase tracking-[0.18em] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              Keep Private
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {Object.entries(reactions).map(([emoji, count]) => (
            <button 
              key={emoji}
              onClick={() => onReact(birthdayPostId, emoji)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all active:scale-90 ${userReactions.includes(emoji) ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-700 shadow-sm' : 'bg-white/60 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
            >
              <span className="text-lg">{emoji}</span>
              <span className={`text-xs font-black ${userReactions.includes(emoji) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{count}</span>
            </button>
          ))}
          <div className="relative">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-12 h-12 flex items-center justify-center bg-white/60 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:scale-110 active:scale-90 transition-all text-xl"
            >
              ➕
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-4 z-50 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4" ref={emojiPickerRef}>
                <EmojiPicker onEmojiClick={handleEmojiClick} theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT} width={280} height={350} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <div className="flex gap-2">
             {['🎉', '🍰', '🔥', '💎'].filter(e => !reactions[e]).map(emoji => (
               <button 
                key={emoji}
                onClick={() => onReact(birthdayPostId, emoji)}
                className="w-10 h-10 flex items-center justify-center bg-white/40 dark:bg-slate-800/40 rounded-xl border border-white/20 dark:border-slate-700 shadow-sm hover:scale-110 active:scale-90 transition-all text-lg grayscale hover:grayscale-0"
               >
                 {emoji}
               </button>
             ))}
          </div>
          <button 
            onClick={() => onComment(birthdayPostId, `Happy Solar Return, ${birthdayUser.firstName}! Keep radiating! ✨`)}
            className="px-8 py-4 bg-slate-900 dark:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl hover:brightness-125 transition-all active:scale-95"
          >
            Send Quick Sync
          </button>
        </div>
      </div>
    </div>
  );
};

export default BirthdayPost;
