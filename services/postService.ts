import { Post } from '../types';
import { getApiBaseUrl } from '../constants';

const API_BASE_URL = getApiBaseUrl();

export class PostService {
  /**
   * Search posts by query string
   */
  static async searchPosts(queryStr: string): Promise<{ success: boolean; posts?: Post[]; error?: string }> {
    try {
      const normalizedQuery = queryStr.toLowerCase().trim();
      if (!normalizedQuery) return { success: true, posts: [] };
      
      console.log('🔍 Searching posts with query:', normalizedQuery);
      
      const response = await fetch(`${API_BASE_URL}/posts/search?q=${encodeURIComponent(normalizedQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' as RequestCredentials
      });
      
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
  
  /**
   * Report a post
   */
  static async reportPost(postId: string, userId: string, reason: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason, notes, userId }),
        credentials: 'include' as RequestCredentials
      });
      const json = await response.json().catch(() => ({} as any));
      if (response.ok && json?.success) {
        return { success: true };
      }
      return { success: false, error: json?.message || 'Failed to report post' };
    } catch (error: any) {
      console.error('❌ Error reporting post:', error);
      return { success: false, error: error?.message || 'Network error' };
    }
  }

  /**
   * Get all posts with privacy filtering
  */
  static async getAllPosts(page = 1, limit = 20, userId?: string): Promise<{ success: boolean; posts?: Post[]; pagination?: any; error?: string }> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (userId) params.append('userId', userId);

      const response = await fetch(`${API_BASE_URL}/posts?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' as RequestCredentials
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return { success: true, posts: result.data, pagination: result.pagination };
        }
      }
      
      return { success: false, error: 'Failed to fetch posts' };
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      return { success: false, error: 'Failed to fetch posts' };
    }
  }

  /**
   * Delete a post by ID
   */
  static async deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include' as RequestCredentials
      });

      const json = await response.json().catch(() => ({} as any));
      if (response.ok && json?.success) {
        return { success: true };
      }

      return { success: false, error: json?.message || 'Failed to delete post' };
    } catch (error: any) {
      console.error('❌ Error deleting post:', error);
      return { success: false, error: error?.message || 'Failed to delete post' };
    }
  }

  /**
   * Increment view count for a post
   */
  static async incrementPostViews(postId: string): Promise<{ success: boolean; viewCount?: number; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' as RequestCredentials
      });

      const result = await response.json().catch(() => null as any);
      if (response.ok && result && result.success) {
        return { success: true, viewCount: result.data?.viewCount ?? undefined };
      }

      return { success: false, error: result?.message || 'Failed to increment post views' };
    } catch (error: any) {
      console.error('❌ Error incrementing post views:', error);
      return { success: false, error: error?.message || 'Failed to increment post views' };
    }
  }

  /**
   * Get post by ID with privacy filtering
   */
  static async getPostById(postId: string): Promise<{ success: boolean; post?: Post; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' as RequestCredentials
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return { success: true, post: result.data };
        }
      }
      
      return { success: false, error: 'Post not found or private' };
    } catch (error) {
      console.error('❌ Error fetching post:', error);
      return { success: false, error: 'Failed to fetch post' };
    }
  }

  /**
   * Create a new post
   */
  static async createPost(postData: any): Promise<{ success: boolean; post?: Post; error?: string }> {
    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(postData),
        credentials: 'include' as RequestCredentials
      });

      const result = await response.json().catch(() => null);
      if (response.ok && result && result.success && result.data) {
        return { success: true, post: result.data };
      }

      return { 
        success: false, 
        error: (result && result.message) || (response.status === 401 ? 'You must be signed in to post.' : 'Failed to create post.') 
      };
    } catch (error: any) {
      console.error('❌ Error creating post:', error);
      return { success: false, error: error?.message || 'Failed to create post' };
    }
  }
}
