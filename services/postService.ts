import { Post } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : '/api';

export class PostService {
  /**
   * Search posts by query string
   */
  static async searchPosts(queryStr: string): Promise<{ success: boolean; posts?: Post[]; error?: string }> {
    try {
      const normalizedQuery = queryStr.toLowerCase().trim();
      if (!normalizedQuery) return { success: true, posts: [] };
      
      console.log('🔍 Searching posts with query:', normalizedQuery);
      
      const response = await fetch(`${BACKEND_URL}/posts/search?q=${encodeURIComponent(normalizedQuery)}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          console.log(`✅ Found ${result.data.length} posts via backend search`);
          return { success: true, posts: result.data };
        }
      }
      
      return { success: false, error: 'Failed to fetch search results' };
    } catch (error) {
      console.error('❌ Error searching posts:', error);
      return { success: false, error: 'Failed to search posts' };
    }
  }
}
