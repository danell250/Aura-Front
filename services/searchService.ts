import { Post, User, Ad, Notification } from '../types';

export interface SearchResult {
  type: 'post' | 'user' | 'ad' | 'hashtag';
  id: string;
  title: string;
  description: string;
  relevance: number;
  data: Post | User | Ad | { tag: string; count: number };
  matchedFields: string[];
}

export interface SearchFilters {
  type?: 'all' | 'posts' | 'users' | 'ads' | 'hashtags';
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year';
  sortBy?: 'relevance' | 'date' | 'popularity';
}

export class SearchService {
  /**
   * Comprehensive search across all content types
   */
  static async search(
    query: string,
    posts: Post[],
    users: User[],
    ads: Ad[],
    filters: SearchFilters = {}
  ): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    const results: SearchResult[] = [];

    // Search posts
    if (!filters.type || filters.type === 'all' || filters.type === 'posts') {
      const postResults = await this.searchPosts(searchTerms, posts);
      results.push(...postResults);
    }

    // Search users (now async to include remote users)
    if (!filters.type || filters.type === 'all' || filters.type === 'users') {
      const userResults = await this.searchUsers(searchTerms, users);
      results.push(...userResults);
    }

    // Search ads
    if (!filters.type || filters.type === 'all' || filters.type === 'ads') {
      results.push(...this.searchAds(searchTerms, ads));
    }

    // Search hashtags
    if (!filters.type || filters.type === 'all' || filters.type === 'hashtags') {
      results.push(...this.searchHashtags(searchTerms, posts, ads));
    }

    // Apply date filtering
    const filteredResults = this.applyDateFilter(results, filters.dateRange);

    // Sort results
    return this.sortResults(filteredResults, filters.sortBy || 'relevance');
  }

  /**
   * Search within posts
   */
  private static async searchPosts(searchTerms: string[], posts: Post[]): Promise<SearchResult[]> {
    let allPosts = posts;
    const queryStr = searchTerms.join(' ');

    // Try to fetch posts from backend search
    try {
      const { PostService } = await import('./postService');
      const searchResult = await PostService.searchPosts(queryStr);

      if (searchResult.success && searchResult.posts) {
        // Merge remote results with local posts, avoiding duplicates
        const localPostIds = new Set(posts.map(p => p.id));
        const remotePosts = searchResult.posts.filter(p => !localPostIds.has(p.id));
        allPosts = [...posts, ...remotePosts];
        console.log(`🔍 Search expanded with ${remotePosts.length} posts from backend search`);
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch remote posts for search:', error);
    }

    return allPosts.map(post => {
      const matchedFields: string[] = [];
      let relevance = 0;

      const hashtagSearchTerms = searchTerms
        .map(term => term.startsWith('#') ? term.slice(1) : term)
        .filter(term => term.length > 0);

      // Search in content
      const contentMatches = this.calculateRelevance(searchTerms, (post.content || '').toLowerCase());
      if (contentMatches > 0) {
        matchedFields.push('content');
        relevance += contentMatches * 3; // Content matches are highly relevant
      }

      // Search in author name
      const authorMatches = this.calculateRelevance(searchTerms, (post.author.name || '').toLowerCase());
      if (authorMatches > 0) {
        matchedFields.push('author');
        relevance += authorMatches * 2;
      }

      // Search in author handle
      const handleMatches = this.calculateRelevance(searchTerms, (post.author.handle || '').toLowerCase());
      if (handleMatches > 0) {
        matchedFields.push('handle');
        relevance += handleMatches * 2;
      }

      // Search in hashtags
      if (post.hashtags) {
        const hashtagMatches = post.hashtags.some(tag =>
          hashtagSearchTerms.some(term => tag.toLowerCase().includes(term))
        );
        if (hashtagMatches) {
          matchedFields.push('hashtags');
          relevance += 2;
        }
      }

      // Search in comments
      const commentMatches = post.comments && post.comments.some(comment =>
        this.calculateRelevance(searchTerms, (comment.text || '').toLowerCase()) > 0
      );
      if (commentMatches) {
        matchedFields.push('comments');
        relevance += 1;
      }

      // Boost relevance for popular posts
      relevance += Math.log((post.radiance || 0) + 1) * 0.1;

      return {
        type: 'post' as const,
        id: post.id,
        title: `${post.author.name} • ${this.formatDate(post.timestamp)}`,
        description: this.truncateText(post.content, 120),
        relevance,
        data: post,
        matchedFields
      };
    }).filter(result => result.relevance > 0);
  }

  /**
   * Search within users (respecting privacy settings)
   */
  private static async searchUsers(searchTerms: string[], users: User[]): Promise<SearchResult[]> {
    let allUsers = users;
    const queryStr = searchTerms.join(' ');

    // Try to fetch users from backend search (much more efficient than fetching all users)
    try {
      const { UserService } = await import('./userService');
      const searchResult = await UserService.searchUsers(queryStr);

      if (searchResult.success && searchResult.users) {
        // Merge remote results with local users, avoiding duplicates
        const localUserIds = new Set(users.map(u => u.id));
        const remoteUsers = searchResult.users.filter(u => !localUserIds.has(u.id));
        allUsers = [...users, ...remoteUsers];
        console.log(`🔍 Search expanded with ${remoteUsers.length} users from backend search`);
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch remote users for search:', error);
      // Continue with local users only
    }

    // Filter users who allow being found in search
    const searchableUsers = allUsers.filter(user => {
      const privacySettings = (user as any).privacySettings;
      // Default to true if privacy settings don't exist or showInSearch is not set
      return !privacySettings || privacySettings.showInSearch !== false;
    });

    return searchableUsers.map(user => {
      const matchedFields: string[] = [];
      let relevance = 0;

      // Search in full name
      const nameMatches = this.calculateRelevance(searchTerms, (user.name || '').toLowerCase());
      if (nameMatches > 0) {
        matchedFields.push('name');
        relevance += nameMatches * 4; // Name matches are very relevant
      }

      // Search in first name
      if (user.firstName && typeof user.firstName === 'string') {
        const firstNameMatches = this.calculateRelevance(searchTerms, user.firstName.toLowerCase());
        if (firstNameMatches > 0) {
          matchedFields.push('firstName');
          relevance += firstNameMatches * 4;
        }
      }

      // Search in last name
      if (user.lastName && typeof user.lastName === 'string') {
        const lastNameMatches = this.calculateRelevance(searchTerms, user.lastName.toLowerCase());
        if (lastNameMatches > 0) {
          matchedFields.push('lastName');
          relevance += lastNameMatches * 4;
        }
      }

      // Search for full name combinations (first + last)
      if (user.firstName && user.lastName && typeof user.firstName === 'string' && typeof user.lastName === 'string') {
        const fullNameCombinations = [
          `${user.firstName} ${user.lastName}`.toLowerCase(),
          `${user.lastName} ${user.firstName}`.toLowerCase(),
          `${user.firstName}${user.lastName}`.toLowerCase()
        ];

        fullNameCombinations.forEach(combination => {
          const combinationMatches = this.calculateRelevance(searchTerms, combination);
          if (combinationMatches > 0) {
            matchedFields.push('fullName');
            relevance += combinationMatches * 5; // Full name combinations get highest relevance
          }
        });
      }

      // Search in handle
      const handleMatches = this.calculateRelevance(searchTerms, (user.handle || '').toLowerCase());
      if (handleMatches > 0) {
        matchedFields.push('handle');
        relevance += handleMatches * 3;
      }

      // Search in bio
      if (user.bio && typeof user.bio === 'string') {
        const bioMatches = this.calculateRelevance(searchTerms, user.bio.toLowerCase());
        if (bioMatches > 0) {
          matchedFields.push('bio');
          relevance += bioMatches * 2;
        }
      }

      // Search in company name
      if (user.companyName && typeof user.companyName === 'string') {
        const companyMatches = this.calculateRelevance(searchTerms, user.companyName.toLowerCase());
        if (companyMatches > 0) {
          matchedFields.push('company');
          relevance += companyMatches * 2;
        }
      }

      // Search in industry
      if (user.industry && typeof user.industry === 'string') {
        const industryMatches = this.calculateRelevance(searchTerms, user.industry.toLowerCase());
        if (industryMatches > 0) {
          matchedFields.push('industry');
          relevance += industryMatches * 1.5;
        }
      }

      // Boost relevance for high trust score users
      relevance += (user.trustScore / 100) * 0.5;

      return {
        type: 'user' as const,
        id: user.id,
        title: user.name || user.handle || 'Unknown User',
        description: user.bio || user.handle || '',
        relevance,
        data: user,
        matchedFields
      };
    }).filter(result => result.relevance > 0);
  }

  /**
   * Search within ads
   */
  private static searchAds(searchTerms: string[], ads: Ad[]): SearchResult[] {
    return ads.filter(ad => ad.status === 'active').map(ad => {
      const matchedFields: string[] = [];
      let relevance = 0;

      const hashtagSearchTerms = searchTerms
        .map(term => term.startsWith('#') ? term.slice(1) : term)
        .filter(term => term.length > 0);

      // Search in headline
      const headlineMatches = this.calculateRelevance(searchTerms, (ad.headline || '').toLowerCase());
      if (headlineMatches > 0) {
        matchedFields.push('headline');
        relevance += headlineMatches * 4;
      }

      // Search in description
      const descMatches = this.calculateRelevance(searchTerms, (ad.description || '').toLowerCase());
      if (descMatches > 0) {
        matchedFields.push('description');
        relevance += descMatches * 3;
      }

      // Search in owner name
      const ownerMatches = this.calculateRelevance(searchTerms, (ad.ownerName || '').toLowerCase());
      if (ownerMatches > 0) {
        matchedFields.push('owner');
        relevance += ownerMatches * 2;
      }

      // Search in hashtags
      if (ad.hashtags) {
        const hashtagMatches = ad.hashtags.some(tag =>
          hashtagSearchTerms.some(term => tag.toLowerCase().includes(term))
        );
        if (hashtagMatches) {
          matchedFields.push('hashtags');
          relevance += 2;
        }
      }

      // Search in CTA text
      const ctaMatches = this.calculateRelevance(searchTerms, (ad.ctaText || '').toLowerCase());
      if (ctaMatches > 0) {
        matchedFields.push('cta');
        relevance += 1;
      }

      return {
        type: 'ad' as const,
        id: ad.id,
        title: ad.headline,
        description: this.truncateText(ad.description, 120),
        relevance,
        data: ad,
        matchedFields
      };
    }).filter(result => result.relevance > 0);
  }

  /**
   * Search hashtags across posts and ads
   */
  private static searchHashtags(searchTerms: string[], posts: Post[], ads: Ad[]): SearchResult[] {
    const hashtagCounts = new Map<string, number>();

    const hashtagSearchTerms = searchTerms
      .map(term => term.startsWith('#') ? term.slice(1) : term)
      .filter(term => term.length > 0);

    // Count hashtags from posts
    posts.forEach(post => {
      if (post.hashtags) {
        post.hashtags.forEach(tag => {
          hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
        });
      }
    });

    // Count hashtags from ads
    ads.forEach(ad => {
      if (ad.hashtags) {
        ad.hashtags.forEach(tag => {
          hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
        });
      }
    });

    // Filter hashtags that match search terms
    const matchingHashtags: SearchResult[] = [];
    hashtagCounts.forEach((count, tag) => {
      const relevance = this.calculateRelevance(
        hashtagSearchTerms.length ? hashtagSearchTerms : searchTerms,
        tag.toLowerCase()
      );
      if (relevance > 0) {
        matchingHashtags.push({
          type: 'hashtag' as const,
          id: `hashtag-${tag}`,
          title: `#${tag}`,
          description: `${count} posts`,
          relevance: relevance + Math.log(count + 1) * 0.5, // Boost popular hashtags
          data: { tag, count },
          matchedFields: ['tag']
        });
      }
    });

    return matchingHashtags;
  }

  /**
   * Calculate relevance score for search terms in text
   */
  private static calculateRelevance(searchTerms: string[], text: string): number {
    let score = 0;

    searchTerms.forEach(term => {
      // Exact match gets highest score
      if (text === term) {
        score += 10;
      }
      // Word boundary match gets high score
      else if (new RegExp(`\\b${term}\\b`).test(text)) {
        score += 5;
      }
      // Starts with term gets medium score
      else if (text.startsWith(term)) {
        score += 3;
      }
      // Contains term gets low score
      else if (text.includes(term)) {
        score += 1;
      }
    });

    return score;
  }

  /**
   * Apply date filtering to results
   */
  private static applyDateFilter(results: SearchResult[], dateRange?: string): SearchResult[] {
    if (!dateRange || dateRange === 'all') return results;

    const now = Date.now();
    let cutoffTime = 0;

    switch (dateRange) {
      case 'today':
        cutoffTime = now - (24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoffTime = now - (365 * 24 * 60 * 60 * 1000);
        break;
    }

    return results.filter(result => {
      if (result.type === 'post') {
        return (result.data as Post).timestamp >= cutoffTime;
      }
      if (result.type === 'ad') {
        // Ads don't have timestamps, so include all ads in date filtering
        return true;
      }
      return true; // Users and hashtags don't have timestamps
    });
  }

  /**
   * Sort search results
   */
  private static sortResults(results: SearchResult[], sortBy: string): SearchResult[] {
    return results.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          const aTime = this.getTimestamp(a);
          const bTime = this.getTimestamp(b);
          return bTime - aTime;
        case 'popularity':
          const aPopularity = this.getPopularity(a);
          const bPopularity = this.getPopularity(b);
          return bPopularity - aPopularity;
        case 'relevance':
        default:
          return b.relevance - a.relevance;
      }
    });
  }

  /**
   * Get timestamp from search result
   */
  private static getTimestamp(result: SearchResult): number {
    if (result.type === 'post') {
      return (result.data as Post).timestamp;
    }
    if (result.type === 'ad') {
      // Ads don't have timestamps, use current time
      return Date.now();
    }
    return 0;
  }

  /**
   * Get popularity score from search result
   */
  private static getPopularity(result: SearchResult): number {
    if (result.type === 'post') {
      return (result.data as Post).radiance;
    }
    if (result.type === 'user') {
      return (result.data as User).trustScore;
    }
    if (result.type === 'hashtag') {
      return (result.data as { tag: string; count: number }).count;
    }
    return 0;
  }

  /**
   * Utility functions
   */
  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private static formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  /**
   * Get search suggestions based on partial query
   */
  static getSuggestions(
    query: string,
    posts: Post[],
    users: User[],
    ads: Ad[]
  ): string[] {
    if (query.length < 2) return [];

    const suggestions = new Set<string>();
    const lowerQuery = query.toLowerCase();
    const baseQuery = lowerQuery.startsWith('#') ? lowerQuery.slice(1) : lowerQuery;

    if (!baseQuery) return [];

    // User name suggestions
    users.forEach(user => {
      if (user.name && user.name.toLowerCase().includes(baseQuery)) {
        suggestions.add(user.name);
      }
      if (user.handle && user.handle.toLowerCase().includes(baseQuery)) {
        suggestions.add(user.handle);
      }
    });

    // Hashtag suggestions
    const allHashtags = new Set<string>();
    posts.forEach(post => {
      if (post.hashtags) {
        post.hashtags.forEach(tag => allHashtags.add(tag));
      }
    });
    ads.forEach(ad => {
      if (ad.hashtags) {
        ad.hashtags.forEach(tag => allHashtags.add(tag));
      }
    });

    allHashtags.forEach(tag => {
      if (tag.toLowerCase().includes(baseQuery)) {
        suggestions.add(`#${tag}`);
      }
    });

    // Common words from post content
    const commonWords = new Set<string>();
    posts.forEach(post => {
      const words = post.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && word.includes(baseQuery)) {
          commonWords.add(word);
        }
      });
    });

    // Limit suggestions and prioritize
    return Array.from(suggestions)
      .concat(Array.from(commonWords))
      .slice(0, 8);
  }
}
