// Cache Service for improved performance
export class CacheService {
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  
  // Cache keys
  private static readonly USERS_CACHE_KEY = 'aura_users_cache';
  private static readonly POSTS_CACHE_KEY = 'aura_posts_cache';
  private static readonly ADS_CACHE_KEY = 'aura_ads_cache';
  private static readonly USERS_TIMESTAMP_KEY = 'aura_users_timestamp';
  private static readonly POSTS_TIMESTAMP_KEY = 'aura_posts_timestamp';
  private static readonly ADS_TIMESTAMP_KEY = 'aura_ads_timestamp';

  // Check if cache is valid (not expired)
  private static isCacheValid(timestampKey: string): boolean {
    try {
      const timestamp = localStorage.getItem(timestampKey);
      if (!timestamp) return false;
      
      const cacheTime = parseInt(timestamp);
      const now = Date.now();
      
      return (now - cacheTime) < this.CACHE_DURATION;
    } catch (error) {
      console.log('Cache validation error:', error);
      return false;
    }
  }

  // Get cached data if valid
  private static getCachedData<T>(cacheKey: string, timestampKey: string): T[] | null {
    try {
      if (!this.isCacheValid(timestampKey)) {
        return null;
      }
      
      const cachedData = localStorage.getItem(cacheKey);
      if (!cachedData) return null;
      
      const parsed = JSON.parse(cachedData);
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      console.log('Cache retrieval error:', error);
      return null;
    }
  }

  // Set cache data with timestamp
  private static setCacheData<T>(cacheKey: string, timestampKey: string, data: T[]): void {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(timestampKey, Date.now().toString());
    } catch (error) {
      console.log('Cache storage error:', error);
    }
  }

  // Users cache methods
  static getCachedUsers() {
    return this.getCachedData(this.USERS_CACHE_KEY, this.USERS_TIMESTAMP_KEY);
  }

  static setCachedUsers(users: any[]) {
    this.setCacheData(this.USERS_CACHE_KEY, this.USERS_TIMESTAMP_KEY, users);
  }

  static isUsersCacheValid(): boolean {
    return this.isCacheValid(this.USERS_TIMESTAMP_KEY);
  }

  // Posts cache methods
  static getCachedPosts() {
    return this.getCachedData(this.POSTS_CACHE_KEY, this.POSTS_TIMESTAMP_KEY);
  }

  static setCachedPosts(posts: any[]) {
    this.setCacheData(this.POSTS_CACHE_KEY, this.POSTS_TIMESTAMP_KEY, posts);
  }

  static isPostsCacheValid(): boolean {
    return this.isCacheValid(this.POSTS_TIMESTAMP_KEY);
  }

  // Ads cache methods
  static getCachedAds() {
    return this.getCachedData(this.ADS_CACHE_KEY, this.ADS_TIMESTAMP_KEY);
  }

  static setCachedAds(ads: any[]) {
    this.setCacheData(this.ADS_CACHE_KEY, this.ADS_TIMESTAMP_KEY, ads);
  }

  static isAdsCacheValid(): boolean {
    return this.isCacheValid(this.ADS_TIMESTAMP_KEY);
  }

  // Clear all cache
  static clearAllCache(): void {
    try {
      localStorage.removeItem(this.USERS_CACHE_KEY);
      localStorage.removeItem(this.POSTS_CACHE_KEY);
      localStorage.removeItem(this.ADS_CACHE_KEY);
      localStorage.removeItem(this.USERS_TIMESTAMP_KEY);
      localStorage.removeItem(this.POSTS_TIMESTAMP_KEY);
      localStorage.removeItem(this.ADS_TIMESTAMP_KEY);
      console.log('✅ All cache cleared');
    } catch (error) {
      console.log('Cache clearing error:', error);
    }
  }

  // Clear expired cache
  static clearExpiredCache(): void {
    try {
      if (!this.isUsersCacheValid()) {
        localStorage.removeItem(this.USERS_CACHE_KEY);
        localStorage.removeItem(this.USERS_TIMESTAMP_KEY);
      }
      
      if (!this.isPostsCacheValid()) {
        localStorage.removeItem(this.POSTS_CACHE_KEY);
        localStorage.removeItem(this.POSTS_TIMESTAMP_KEY);
      }
      
      if (!this.isAdsCacheValid()) {
        localStorage.removeItem(this.ADS_CACHE_KEY);
        localStorage.removeItem(this.ADS_TIMESTAMP_KEY);
      }
    } catch (error) {
      console.log('Expired cache clearing error:', error);
    }
  }

  // Get cache status for debugging
  static getCacheStatus() {
    return {
      users: {
        valid: this.isUsersCacheValid(),
        hasData: !!localStorage.getItem(this.USERS_CACHE_KEY)
      },
      posts: {
        valid: this.isPostsCacheValid(),
        hasData: !!localStorage.getItem(this.POSTS_CACHE_KEY)
      },
      ads: {
        valid: this.isAdsCacheValid(),
        hasData: !!localStorage.getItem(this.ADS_CACHE_KEY)
      }
    };
  }
}