import React, { useState, useEffect } from 'react';
import { TrendingService, TrendingTopic } from '../services/trendingService';

interface TrendingTopicsProps {
  onHashtagClick?: (hashtag: string) => void;
  className?: string;
}

const TrendingTopics: React.FC<TrendingTopicsProps> = ({
  onHashtagClick,
  className = ''
}) => {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const topics = await TrendingService.fetchTrendingTopics();
        setTrendingTopics(topics);
      } catch (error) {
        console.error('Failed to fetch trending topics', error);
      }
    };

    fetchTrends();
    
    // Refresh every 2 minutes to keep it relatively fresh
    const interval = setInterval(fetchTrends, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleHashtagClick = (hashtag: string) => {
    if (onHashtagClick) {
      onHashtagClick(hashtag);
    }
  };

  const getCategoryIndicator = (category: TrendingTopic['category']) => {
    switch (category) {
      case 'rising':
        return (
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        );
      case 'hot':
        return (
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        );
      case 'steady':
        return (
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        );
      default:
        return (
          <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
        );
    }
  };

  const getCategoryLabel = (category: TrendingTopic['category']) => {
    switch (category) {
      case 'rising':
        return 'Rising';
      case 'hot':
        return 'Hot';
      case 'steady':
        return 'Active';
      default:
        return 'New';
    }
  };

  const formatGrowth = (growth: number) => {
    if (growth === 100) return 'New';
    if (growth > 0) return `+${Math.round(growth)}%`;
    return `${Math.round(growth)}%`;
  };

  if (trendingTopics.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
          Trending Topics
        </h3>
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            No trending topics
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Start conversations to see trends
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-md flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Trending Topics
          </h3>
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
          24h
        </div>
      </div>

      <div className="space-y-2">
        {trendingTopics.slice(0, 6).map((topic, index) => (
          <button
            key={topic.hashtag}
            onClick={() => onHashtagClick(topic.hashtag)}
            className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 w-4 text-center">
                    {index + 1}
                  </span>
                  {getCategoryIndicator(topic.category)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900 dark:text-white text-sm truncate">
                      #{topic.hashtag}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {getCategoryLabel(topic.category)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {topic.count} {topic.count === 1 ? 'mention' : 'mentions'}
                    </span>
                    {topic.growth !== 0 && topic.growth !== 100 && (
                      <span className={`text-xs font-medium ${
                        topic.growth > 0 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatGrowth(topic.growth)}
                      </span>
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

      {trendingTopics.length > 6 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onHashtagClick('')}
            className="w-full text-center text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            View all trends
          </button>
        </div>
      )}
    </div>
  );
};

export default TrendingTopics;