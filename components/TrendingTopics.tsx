import React, { useMemo } from 'react';
import { TrendingService, TrendingTopic } from '../services/trendingService';
import { Post, Ad } from '../types';

interface TrendingTopicsProps {
  posts: Post[];
  ads: Ad[];
  onHashtagClick: (hashtag: string) => void;
  className?: string;
}

const TrendingTopics: React.FC<TrendingTopicsProps> = ({
  posts,
  ads,
  onHashtagClick,
  className = ''
}) => {
  const trendingTopics = useMemo(() => {
    return TrendingService.getTrendingTopics(posts, ads);
  }, [posts, ads]);

  const getCategoryIcon = (category: TrendingTopic['category']) => {
    switch (category) {
      case 'rising':
        return '📈';
      case 'hot':
        return '🔥';
      case 'steady':
        return '📊';
      default:
        return '💫';
    }
  };

  const getCategoryColor = (category: TrendingTopic['category']) => {
    switch (category) {
      case 'rising':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'hot':
        return 'text-orange-600 dark:text-orange-400';
      case 'steady':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const formatGrowth = (growth: number) => {
    if (growth === 100) return 'New';
    if (growth > 0) return `+${Math.round(growth)}%`;
    return `${Math.round(growth)}%`;
  };

  if (trendingTopics.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">
          Trending Topics
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-3 opacity-30">📊</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No trending topics yet
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Start using hashtags to see trends
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Trending Topics
        </h3>
        <div className="text-xs text-slate-400 dark:text-slate-500">
          Last 24h
        </div>
      </div>

      <div className="space-y-3">
        {trendingTopics.slice(0, 8).map((topic, index) => (
          <button
            key={topic.hashtag}
            onClick={() => onHashtagClick(topic.hashtag)}
            className="w-full text-left p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 group border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(topic.category)}</span>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full w-6 h-6 flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                      #{topic.hashtag}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCategoryColor(topic.category)} bg-current bg-opacity-10`}>
                      {topic.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {topic.count} {topic.count === 1 ? 'post' : 'posts'}
                    </span>
                    {topic.growth !== 0 && (
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-bold ${
                          topic.growth > 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatGrowth(topic.growth)}
                        </span>
                        {topic.growth > 0 && (
                          <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {trendingTopics.length > 8 && (
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onHashtagClick('')} // This could open a full trending page
            className="w-full text-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            View all trending topics
          </button>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1">
            <span>🔥</span>
            <span>Hot</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📈</span>
            <span>Rising</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📊</span>
            <span>Steady</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingTopics;