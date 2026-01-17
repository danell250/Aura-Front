import React, { useEffect, useRef, useState } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface ModernTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  onSubmit?: () => void;
  submitText?: string;
  isSubmitting?: boolean;
}

const ModernTextarea: React.FC<ModernTextareaProps> = ({
  value,
  onChange,
  placeholder,
  maxLength = 500,
  onSubmit,
  submitText = 'Post',
  isSubmitting = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  const length = value.length;
  const ratio = maxLength > 0 ? length / maxLength : 0;

  const isOverLimit = length > maxLength;
  const isEmpty = length === 0;
  const canSubmit = !!onSubmit && !isEmpty && !isOverLimit && !isSubmitting;

  let barColor = 'bg-emerald-500';
  if (ratio >= 0.8 && ratio <= 1) {
    barColor = 'bg-amber-400';
  } else if (ratio > 1) {
    barColor = 'bg-rose-500';
  }

  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, 400);
    el.style.height = `${newHeight}px`;
  }, [value]);

  useEffect(() => {
    if (!isSubmitting && !isEmpty && !isOverLimit) {
      setShowConfirmation(true);
      const timeout = window.setTimeout(() => {
        setShowConfirmation(false);
      }, 2500);
      return () => window.clearTimeout(timeout);
    }
  }, [isSubmitting, isEmpty, isOverLimit]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleSubmitClick = () => {
    if (canSubmit && onSubmit) {
      onSubmit();
    }
  };

  const handleEmojiPick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const nextValue = value + emoji;
    onChange(nextValue);
    setShowEmojiPicker(false);
  };

  return (
    <div className="w-full">
      <div
        className={[
          'relative rounded-[28px] border px-4 pt-3 pb-4 bg-white/80 dark:bg-slate-900/80 shadow-[0_18px_44px_rgba(15,23,42,0.18)]',
          'transition-all duration-300',
          'border-slate-200 dark:border-slate-700',
          'focus-within:border-emerald-500 focus-within:shadow-[0_0_0_1px_rgba(16,185,129,0.55),0_22px_60px_rgba(16,185,129,0.25)]'
        ].join(' ')}
      >
        <div className="pointer-events-none absolute -inset-px rounded-[30px] opacity-0 blur-2xl bg-gradient-to-r from-emerald-400/40 via-teal-400/30 to-sky-400/40 transition-opacity duration-300 focus-within:opacity-100" />

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={placeholder || 'Post content'}
          aria-invalid={isOverLimit}
          className="relative z-10 w-full bg-transparent border-0 focus:outline-none focus:ring-0 resize-none text-base sm:text-lg leading-relaxed text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 min-h-[96px] max-h-[400px]"
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(prev => !prev)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-lg"
                aria-label="Add emoji"
              >
                <span>😊</span>
              </button>
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-11 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiPick}
                    theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT}
                    width={320}
                    height={400}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="w-32 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`${barColor} h-full rounded-full transition-all duration-300`}
                  style={{ width: `${Math.min(ratio, 1) * 100}%` }}
                />
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {length}/{maxLength}
              </div>
            </div>

            {isOverLimit && (
              <div className="text-[11px] font-semibold text-rose-500">
                Over the character limit
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showConfirmation && (
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 transition-opacity duration-300">
                Posted
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={!canSubmit}
              className={[
                'inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-[0.16em]',
                'transition-all duration-200 shadow-sm',
                canSubmit
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              ].join(' ')}
              aria-disabled={!canSubmit}
            >
              {isSubmitting && (
                <span className="inline-flex">
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                </span>
              )}
              <span>{submitText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernTextarea;
