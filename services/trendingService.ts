import { Post, Ad } from '../types';
import { apiFetch } from '../utils/api';

const normalizeHashtag = (tag: string) =>
  tag.replace(/^#+/, '').toLowerCase();

export interface TrendingTopic {
  hashtag: string;
  count: number;
  growth: number; // Percentage growth from previous period
  category: 'rising' | 'hot' | 'steady';
}

export interface TrendingData {
  topics: TrendingTopic[];
  lastUpdated: number;
}

export class TrendingService {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static cache: TrendingData | null = null;

  /**
   * Fetch trending topics from the backend API
   */
  static async fetchTrendingTopics(limit: number = 10, hours: number = 24): Promise<TrendingTopic[]> {
    const CACHE_KEY = `aura_trending_topics_v1_${limit}_${hours}`;
    const TTL_MS = 5 * 60 * 1000; // 5 minutes (tweak if you want)

    const readCache = (): { ts: number; data: TrendingTopic[] } | null => {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed.ts !== 'number' || !Array.isArray(parsed.data)) return null;
        return parsed;
      } catch {
        return null;
      }
    };

    const writeCache = (data: TrendingTopic[]) => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
      } catch {
        // ignore storage errors (private mode / quota)
      }
    };

    // 1) Return fresh cache immediately (fast load after refresh)
    const cached = readCache();
    if (cached && Date.now() - cached.ts < TTL_MS) {
      return cached.data;
    }

    // 2) Try network
    try {
      const response = await apiFetch(`/posts/hashtags/trending?limit=${limit}&hours=${hours}`);
      if (response.ok) {
        const result = await response.json();

        if (result?.success && Array.isArray(result.data)) {
          const topics: TrendingTopic[] = result.data.map((item: any) => {
            let category: 'rising' | 'hot' | 'steady' = 'steady';
            if (item.count >= 10) category = 'hot';
            else if (item.count >= 5) category = 'rising';

            return {
              hashtag: item._id,
              count: item.count,
              growth: 0,
              category
            };
          });

          // 3) Save and return
          writeCache(topics);
          return topics;
        }
      }

      // If response isn't ok or payload unexpected, fall back to old cache if any
      if (cached?.data?.length) return cached.data;
      return [];
    } catch (e) {
      // 4) Network error: fall back to last cached trends
      if (cached?.data?.length) return cached.data;
      return [];
    }
  }

  /**
   * Get trending hashtags from posts and ads (Legacy Client-Side)
   */
  static getTrendingTopics(posts: Post[], ads: Ad[]): TrendingTopic[] {
    // Check cache first
    if (this.cache && Date.now() - this.cache.lastUpdated < this.CACHE_DURATION) {
      return this.cache.topics;
    }

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const twoDaysAgo = now - (48 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    // Get hashtags from recent posts (last 24 hours)
    const recentHashtags = new Map<string, number>();
    const previousHashtags = new Map<string, number>();
    const weeklyHashtags = new Map<string, number>();

    posts.forEach(post => {
      if (post.hashtags) {
        post.hashtags.forEach(tag => {
          const normalizedTag = normalizeHashtag(tag);
          
          if (post.timestamp >= oneDayAgo) {
            recentHashtags.set(normalizedTag, (recentHashtags.get(normalizedTag) || 0) + 1);
          } else if (post.timestamp >= twoDaysAgo) {
            previousHashtags.set(normalizedTag, (previousHashtags.get(normalizedTag) || 0) + 1);
          }
          
          if (post.timestamp >= oneWeekAgo) {
            weeklyHashtags.set(normalizedTag, (weeklyHashtags.get(normalizedTag) || 0) + 1);
          }
        });
      }
    });

    ads.filter(ad => ad.status === 'active').forEach(ad => {
      if (ad.hashtags) {
        ad.hashtags.forEach(tag => {
          const normalizedTag = normalizeHashtag(tag);
          recentHashtags.set(normalizedTag, (recentHashtags.get(normalizedTag) || 0) + 3); // Weight ads higher
          weeklyHashtags.set(normalizedTag, (weeklyHashtags.get(normalizedTag) || 0) + 3);
        });
      }
    });

    // Calculate trending topics with growth rates
    const trendingTopics: TrendingTopic[] = [];

    recentHashtags.forEach((currentCount, hashtag) => {
      const previousCount = previousHashtags.get(hashtag) || 0;
      const weeklyCount = weeklyHashtags.get(hashtag) || 0;
      
      // Calculate growth rate
      let growth = 0;
      if (previousCount > 0) {
        growth = ((currentCount - previousCount) / previousCount) * 100;
      } else if (currentCount > 0) {
        growth = 100; // New hashtag
      }
      
      // Determine category based on usage and growth - more conservative approach
      let category: 'rising' | 'hot' | 'steady' = 'steady';
      if (growth > 150 && currentCount >= 3) {
        category = 'rising';
      } else if (currentCount >= 8 || weeklyCount >= 15) {
        category = 'hot';
      }

      // Only include hashtags with meaningful activity and filter out noise
      if (currentCount >= 1 && hashtag.length >= 2) {
        trendingTopics.push({
          hashtag,
          count: currentCount,
          growth,
          category
        });
      }
    });

    // Sort by relevance score (combination of count, growth, and recency)
    const sortedTopics = trendingTopics
      .sort((a, b) => {
        // Calculate relevance score
        const scoreA = a.count * 2 + (Math.max(0, a.growth) * 0.1) + (a.category === 'rising' ? 5 : a.category === 'hot' ? 3 : 1);
        const scoreB = b.count * 2 + (Math.max(0, b.growth) * 0.1) + (b.category === 'rising' ? 5 : b.category === 'hot' ? 3 : 1);
        return scoreB - scoreA;
      })
      .slice(0, 15); // Top 15 trending topics

    // Update cache
    this.cache = {
      topics: sortedTopics,
      lastUpdated: now
    };

    return sortedTopics;
  }

  /**
   * Get trending topics by category
   */
  static getTrendingByCategory(posts: Post[], ads: Ad[], category: 'rising' | 'hot' | 'steady'): TrendingTopic[] {
    const allTrending = this.getTrendingTopics(posts, ads);
    return allTrending.filter(topic => topic.category === category);
  }

  /**
   * Get suggested hashtags based on trending topics
   */
  static getSuggestedHashtags(posts: Post[], ads: Ad[], limit: number = 5): string[] {
    const trending = this.getTrendingTopics(posts, ads);
    return trending.slice(0, limit).map(topic => topic.hashtag);
  }

  /**
   * Check if a hashtag is trending
   */
  static isHashtagTrending(hashtag: string, posts: Post[], ads: Ad[]): boolean {
    const trending = this.getTrendingTopics(posts, ads);
    const normalized = normalizeHashtag(hashtag);
    return trending.some(topic => topic.hashtag === normalized);
  }

  /**
   * Get hashtag statistics
   */
  static getHashtagStats(hashtag: string, posts: Post[], ads: Ad[]): {
    totalUses: number;
    recentUses: number;
    growth: number;
    category: 'rising' | 'hot' | 'steady' | 'none';
  } {
    const normalizedHashtag = normalizeHashtag(hashtag);
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const twoDaysAgo = now - (48 * 60 * 60 * 1000);

    let totalUses = 0;
    let recentUses = 0;
    let previousUses = 0;

    posts.forEach(post => {
      if (post.hashtags?.some(tag => normalizeHashtag(tag) === normalizedHashtag)) {
        totalUses++;
        if (post.timestamp >= oneDayAgo) {
          recentUses++;
        } else if (post.timestamp >= twoDaysAgo) {
          previousUses++;
        }
      }
    });

    ads.filter(ad => ad.status === 'active').forEach(ad => {
      if (ad.hashtags?.some(tag => normalizeHashtag(tag) === normalizedHashtag)) {
        totalUses += 2; // Weight ads higher
        recentUses += 2;
      }
    });

    const growth = previousUses > 0 ? ((recentUses - previousUses) / previousUses) * 100 : 100;
    
    let category: 'rising' | 'hot' | 'steady' | 'none' = 'none';
    if (recentUses === 0) category = 'none';
    else if (growth > 50) category = 'rising';
    else if (recentUses >= 5) category = 'hot';
    else if (recentUses > 0) category = 'steady';

    return {
      totalUses,
      recentUses,
      growth,
      category
    };
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  static clearCache(): void {
    this.cache = null;
  }
}
