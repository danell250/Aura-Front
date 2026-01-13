import React, { useState, useEffect } from 'react';

interface HashtagSearchProps {
  onHashtagSelect: (hashtag: string) => void;
  onClose: () => void;
}

const HashtagSearch: React.FC<HashtagSearchProps> = ({ onHashtagSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock trending hashtags - in production, fetch from API
  const mockTrendingTags = [
    { tag: 'leadership', count: 156 },
    { tag: 'innovation', count: 142 },
    { tag: 'strategy', count: 128 },
    { tag: 'growth', count: 115 },
    { tag: 'teamwork', count: 98 },
    { tag: 'productivity', count: 87 },
    { tag: 'success', count: 76 },
    { tag: 'networking', count: 65 },
    { tag: 'career', count: 54 },
    { tag: 'technology', count: 43 }
  ];

  useEffect(() => {
    // Simulate API call for trending hashtags
    setIsLoading(true);
    setTimeout(() => {
      setTrendingTags(mockTrendingTags);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredTags = searchTerm
    ? trendingTags.filter(tag => 
        tag.tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : trendingTags;

  const handleTagClick = (tag: string) => {
    onHashtagSelect(tag);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black uppercase tracking-wide text-slate-900 dark:text-white">
              Explore Tags
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search hashtags..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-4">
                {searchTerm ? 'Search Results' : 'Trending Now'}
              </h3>
              
              <div className="space-y-2">
                {filteredTags.length > 0 ? (
                  filteredTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => handleTagClick(tag.tag)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          #{tag.tag}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                        {tag.count} posts
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p>No hashtags found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HashtagSearch;