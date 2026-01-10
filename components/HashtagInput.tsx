import React, { useState, useRef, useEffect } from 'react';

interface HashtagInputProps {
  value: string;
  onChange: (value: string, hashtags: string[]) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

const HashtagInput: React.FC<HashtagInputProps> = ({
  value,
  onChange,
  placeholder = "What's on your mind? Use #hashtags to categorize...",
  className = "",
  maxLength = 500
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Common hashtag suggestions
  const commonHashtags = [
    'leadership', 'innovation', 'strategy', 'growth', 'teamwork',
    'productivity', 'success', 'motivation', 'networking', 'career',
    'technology', 'business', 'entrepreneurship', 'mindset', 'goals',
    'learning', 'development', 'coaching', 'transformation', 'excellence'
  ];

  // Extract hashtags from text
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
  };

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      const hashtags = extractHashtags(newValue);
      onChange(newValue, hashtags);
      
      // Check for hashtag suggestions
      const cursorPos = e.target.selectionStart;
      setCursorPosition(cursorPos);
      
      const textBeforeCursor = newValue.slice(0, cursorPos);
      const hashtagMatch = textBeforeCursor.match(/#([a-zA-Z0-9_]*)$/);
      
      if (hashtagMatch) {
        const partial = hashtagMatch[1].toLowerCase();
        const filtered = commonHashtags.filter(tag => 
          tag.includes(partial) && !hashtags.includes(tag)
        );
        setSuggestions(filtered.slice(0, 5));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    
    // Find the partial hashtag to replace
    const hashtagMatch = textBeforeCursor.match(/#([a-zA-Z0-9_]*)$/);
    if (hashtagMatch) {
      const startPos = textBeforeCursor.lastIndexOf('#');
      const newText = value.slice(0, startPos) + `#${suggestion} ` + textAfterCursor;
      const hashtags = extractHashtags(newText);
      onChange(newText, hashtags);
      
      // Set cursor position after the inserted hashtag
      setTimeout(() => {
        const newCursorPos = startPos + suggestion.length + 2;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    }
    
    setShowSuggestions(false);
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const currentHashtags = extractHashtags(value);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none min-h-[120px] text-base leading-relaxed"
          style={{ overflow: 'hidden' }}
        />
        
        {/* Character count */}
        <div className="absolute bottom-3 right-3 text-xs text-slate-400 dark:text-slate-500">
          {value.length}/{maxLength}
        </div>
      </div>

      {/* Hashtag suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-40 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm flex items-center gap-2"
            >
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">#{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {/* Current hashtags display */}
      {currentHashtags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {currentHashtags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default HashtagInput;