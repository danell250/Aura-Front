import React, { useState, useEffect, useRef } from 'react';
import { SearchService, SearchResult, SearchFilters } from '../services/searchService';
import { Post, User, Ad } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  users: User[];
  ads: Ad[];
  onSelectResult: (result: SearchResult) => void;
  initialQuery?: string;
}

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  posts,
  users,
  ads,
  onSelectResult,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    dateRange: 'all',
    sortBy: 'relevance'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      
      // Simulate search delay for better UX
      setTimeout(() => {
        const searchResults = SearchService.search(query, posts, users, ads, filters);
        const searchSuggestions = SearchService.getSuggestions(query, posts, users, ads);
        
        setResults(searchResults);
        setSuggestions(searchSuggestions);
        setIsLoading(false);
      }, 200);
    };

    performSearch();
  }, [query, posts, users, ads, filters]);

  const handleResultClick = (result: SearchResult) => {
    onSelectResult(result);
    onClose();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'post':
        return '📝';
      case 'user':
        return '👤';
      case 'ad':
        return '📢';
      case 'hashtag':
        return '#️⃣';
      default:
        return '🔍';
    }
  };

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'post':
        return 'Post';
      case 'user':
        return 'User';
      case 'ad':
        return 'Ad';
      case 'hashtag':
        return 'Hashtag';
      default:
        return 'Result';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts, users, ads, hashtags..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-4 rounded-2xl border transition-colors ${showFilters ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="all">All</option>
                  <option value="posts">Posts</option>
                  <option value="users">Users</option>
                  <option value="ads">Ads</option>
                  <option value="hashtags">Hashtags</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && query.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {query.trim() === '' ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">Search Aura Network</h3>
              <p className="text-slate-500 dark:text-slate-500">Find posts, users, ads, and hashtags across the platform</p>
            </div>
          ) : results.length === 0 && !isLoading ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">No Results Found</h3>
              <p className="text-slate-500 dark:text-slate-500">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{getResultIcon(result.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{result.title}</h4>
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
                          {getResultTypeLabel(result.type)}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">{result.description}</p>
                      {result.matchedFields.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.matchedFields.map((field, fieldIndex) => (
                            <span
                              key={fieldIndex}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">
                        Score: {result.relevance.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;