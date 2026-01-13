import React, { useState, useEffect, useRef } from 'react';
import { SearchService, SearchResult, SearchFilters } from '../services/searchService';
import { PrivacyService } from '../services/privacyService';
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
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    dateRange: 'all',
    sortBy: 'relevance'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
        return;
      }

      setIsLoading(true);
      
      try {
        // Get searchable users (respects privacy settings)
        const searchableUsersResult = await PrivacyService.getSearchableUsers(query);
        const searchableUsers = searchableUsersResult.success ? searchableUsersResult.data || [] : users;
        
        // Perform search with privacy-filtered users
        const searchResults = await SearchService.search(query, posts, searchableUsers, ads, filters);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        // Fallback to regular search if privacy service fails
        const searchResults = await SearchService.search(query, posts, users, ads, filters);
        setResults(searchResults);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 200);
    return () => clearTimeout(timeoutId);
  }, [query, posts, users, ads, filters]);

  const handleResultClick = (result: SearchResult) => {
    onSelectResult(result);
    onClose();
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

  const typeFilters = [
    { key: 'all', label: 'All Results', icon: '🌐', count: results.length },
    { key: 'posts', label: 'Posts', icon: '📝', count: results.filter(r => r.type === 'post').length },
    { key: 'users', label: 'People', icon: '👤', count: results.filter(r => r.type === 'user').length },
    { key: 'ads', label: 'Ads', icon: '📢', count: results.filter(r => r.type === 'ad').length },
    { key: 'hashtags', label: 'Tags', icon: '#️⃣', count: results.filter(r => r.type === 'hashtag').length }
  ];

  const dateFilters = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' }
  ];

  const sortFilters = [
    { key: 'relevance', label: 'Most Relevant', icon: '🎯' },
    { key: 'date', label: 'Most Recent', icon: '📅' },
    { key: 'popularity', label: 'Most Popular', icon: '🔥' }
  ];

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-12 p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts, users, ads, hashtags..."
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
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
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Filters */}
          {query.trim() && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {typeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setFilters(prev => ({ ...prev, type: filter.key as any }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                      filters.type === filter.key
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{filter.icon}</span>
                    <span>{filter.label}</span>
                    {filter.count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                        filters.type === filter.key
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}>
                        {filter.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
              
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  showAdvancedFilters
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                Advanced
              </button>
            </div>
          )}

          {/* Advanced Filters */}
          {showAdvancedFilters && query.trim() && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Time Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    {dateFilters.map((filter) => (
                      <option key={filter.key} value={filter.key}>{filter.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    {sortFilters.map((filter) => (
                      <option key={filter.key} value={filter.key}>{filter.icon} {filter.label}</option>
                    ))}
                  </select>
                </div>

                {/* Reset Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ type: 'all', dateRange: 'all', sortBy: 'relevance' })}
                    className="w-full px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-lg transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {query.trim() === '' ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Search Aura Network</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">Discover posts, connect with people, explore ads, and find trending hashtags across the platform</p>
            </div>
          ) : results.length === 0 && !isLoading ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">😔</span>
              </div>
              <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">No Results Found</h3>
              <p className="text-slate-500 dark:text-slate-500 max-w-md mx-auto">Try different keywords or adjust your filters to find what you're looking for</p>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-lg group-hover:scale-105 transition-transform duration-200">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{result.title}</h4>
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full shrink-0">
                          {getResultTypeLabel(result.type)}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed">{result.description}</p>
                      {result.matchedFields.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-xs text-slate-400">Matched:</span>
                          {result.matchedFields.slice(0, 3).map((field, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded">
                              {field}
                            </span>
                          ))}
                        </div>
                      )}
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