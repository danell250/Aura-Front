import React, { useState, useEffect, useRef } from 'react';
import { SearchService, SearchResult, SearchFilters } from '../services/searchService';
import { Post, User, Ad } from '../types';
import { Avatar } from './MediaDisplay';

type RecentSearchItem = {
  q: string;
  ts: number;
};

const makeRecentKey = (userId?: string) => `aura_recent_searches:${userId || 'anon'}`;

const loadRecentSearches = (userId?: string, limit = 8): RecentSearchItem[] => {
  try {
    const raw = localStorage.getItem(makeRecentKey(userId));
    const arr = raw ? (JSON.parse(raw) as RecentSearchItem[]) : [];
    return Array.isArray(arr) ? arr.slice(0, limit) : [];
  } catch {
    return [];
  }
};

const saveRecentSearch = (userId: string | undefined, q: string, limit = 8) => {
  const query = q.trim();
  if (!query) return;

  const existing = loadRecentSearches(userId, 50);
  const next: RecentSearchItem[] = [
    { q: query, ts: Date.now() },
    ...existing.filter(x => x.q.toLowerCase() !== query.toLowerCase())
  ].slice(0, limit);

  localStorage.setItem(makeRecentKey(userId), JSON.stringify(next));
};

const removeRecentSearch = (userId: string | undefined, q: string) => {
  const existing = loadRecentSearches(userId, 50);
  const next = existing.filter(x => x.q.toLowerCase() !== q.toLowerCase());
  localStorage.setItem(makeRecentKey(userId), JSON.stringify(next));
  return next.slice(0, 8);
};

const clearRecentSearches = (userId: string | undefined) => {
  localStorage.removeItem(makeRecentKey(userId));
  return [];
};

interface SearchDropdownProps {
  posts: Post[];
  users: User[];
  ads: Ad[];
  onSelectResult: (result: SearchResult) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  userId?: string;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  posts,
  users,
  ads,
  onSelectResult,
  searchQuery,
  onSearchChange,
  placeholder = "Search Aura Network... (⌘K)",
  userId
}) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [recent, setRecent] = useState<RecentSearchItem[]>(() => loadRecentSearches(userId));
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filters: SearchFilters = {
    type: 'all',
    dateRange: 'all',
    sortBy: 'relevance'
  };

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        const items = loadRecentSearches(userId);
        setRecent(items);
        setResults([]);
        setIsOpen(isFocused && items.length > 0);
        return;
      }

      setIsLoading(true);
      
      try {
        const searchResults = await SearchService.search(searchQuery, posts, users, ads, filters);
        const limited = searchResults.slice(0, 8);
        setResults(limited);
        setIsOpen(limited.length > 0);
        setSelectedIndex(limited.length > 0 ? 0 : -1);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 200);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, posts, users, ads, userId, isFocused]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : results.length - 1);
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    if (!searchQuery.trim()) {
      const items = loadRecentSearches(userId);
      setRecent(items);
      setIsOpen(items.length > 0);
      setSelectedIndex(-1);
      return;
    }
    if (results.length > 0) setIsOpen(true);
  };

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(userId, searchQuery);
    onSelectResult(result);
    setIsOpen(false);
    setSelectedIndex(-1);
    // Keep the search term in the input for user reference
    // onSearchChange('');
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

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative group">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input 
          ref={inputRef}
          type="text" 
          value={searchQuery} 
          onChange={handleInputChange}
          onFocus={() => { setIsFocused(true); handleInputFocus(); }}
          onBlur={() => { 
            setIsFocused(false); 
            // small delay so clicking a dropdown item still works 
            setTimeout(() => setIsOpen(false), 150); 
          }}
          placeholder={placeholder}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-10 py-2 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all text-sm font-medium outline-none" 
        />
        {searchQuery && !isLoading && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              setResults([]);
              setIsOpen(false);
              setSelectedIndex(-1);
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && !searchQuery.trim() && recent.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
            <span>Recent searches</span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const next = clearRecentSearches(userId);
                setRecent(next);
                setIsOpen(false);
              }}
              className="normal-case text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          </div>
          {recent.map(item => (
            <div
              key={item.q + item.ts}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <button
                type="button"
                className="flex-1 text-left text-sm min-w-0"
                onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                onClick={() => {
                  onSearchChange(item.q);
                  inputRef.current?.focus();
                }}
              >
                <span className="text-slate-700 dark:text-slate-200 truncate block">{item.q}</span>
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // keep dropdown open
                onClick={() => {
                  const next = removeRecentSearch(userId, item.q);
                  setRecent(next);
                  setIsOpen(next.length > 0 && isFocused);
                }}
                className="ml-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
                aria-label={`Remove ${item.q} from recent searches`}
                title="Remove"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {isOpen && searchQuery.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {results.length === 0 ? (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              <div className="text-2xl mb-2">😔</div>
              <p className="text-sm">No results found</p>
            </div>
          ) : (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 ${
                    selectedIndex === index ? 'bg-slate-50 dark:bg-slate-800' : ''
                  }`}
                >
                  {result.type === 'user' ? (
                    <Avatar
                      src={(result.data as User).avatar}
                      type={(result.data as User).avatarType}
                      name={(result.data as User).name}
                      size="sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">
                      {getResultIcon(result.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-900 dark:text-white truncate text-sm">
                        {result.title}
                      </h4>
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
                        {getResultTypeLabel(result.type)}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-xs line-clamp-1">
                      {result.description}
                    </p>
                  </div>
                  <div className="text-slate-400 dark:text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
              {results.length > 0 && (
                <div className="px-4 py-2 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
                  Press <span className="font-semibold">Enter</span> to open the top result
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
