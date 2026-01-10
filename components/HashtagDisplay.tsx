import React from 'react';

interface HashtagDisplayProps {
  text: string;
  hashtags?: string[];
  onHashtagClick?: (hashtag: string) => void;
  className?: string;
}

const HashtagDisplay: React.FC<HashtagDisplayProps> = ({ 
  text, 
  hashtags = [], 
  onHashtagClick,
  className = ""
}) => {
  // Function to render text with clickable hashtags
  const renderTextWithHashtags = (content: string) => {
    if (!content) return null;
    
    // Split text by hashtag pattern
    const parts = content.split(/(#[a-zA-Z0-9_]+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const hashtag = part.slice(1).toLowerCase();
        return (
          <span
            key={index}
            onClick={() => onHashtagClick?.(hashtag)}
            className={`inline-block text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors ${onHashtagClick ? 'hover:underline' : ''}`}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={className}>
      <div className="text-content">
        {renderTextWithHashtags(text)}
      </div>
      
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {hashtags.map((tag, index) => (
            <button
              key={index}
              onClick={() => onHashtagClick?.(tag)}
              className="inline-flex items-center px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HashtagDisplay;