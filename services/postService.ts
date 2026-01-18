import { Post } from '../types';
import { apiFetch } from '../utils/api';

export class PostService {
  /**
   * Search posts by query string
   */
  static async searchPosts(queryStr: string): Promise<{ success: boolean; posts?: Post[]; error?: string }> {
    try {
      const normalizedQuery = queryStr.toLowerCase().trim();
      if (!normalizedQuery) return { success: true, posts: [] };
      
      console.log('🔍 Searching posts with query:', normalizedQuery);
      
      const response = await apiFetch(`/posts/search?q=${encodeURIComponent(normalizedQuery)}`, {
        method: 'GET'
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
      const response = await apiFetch(`/posts/${postId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason, notes, userId })
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

      const response = await apiFetch(`/posts?${params.toString()}`, {
        method: 'GET'
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
      const response = await apiFetch(`/posts/${postId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        return { success: true };
      }
      
      const json = await response.json().catch(() => ({}));
      return { success: false, error: json.message || 'Failed to delete post' };
    } catch (error) {
      console.error('❌ Error deleting post:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async getMyInsights(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const timeoutMs = 10000;
      const timeoutPromise = new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Insights request timed out')), timeoutMs)
      );

      const response = await Promise.race([
        apiFetch('/posts/insights/me', {
          method: 'GET'
        }),
        timeoutPromise
      ]);

      let payload: any = null;
      try {
        payload = await response.json();
      } catch {}

      if (!response.ok || !payload?.success) {
        return {
          success: false,
          error: payload?.error || payload?.message || 'Failed to load insights'
        };
      }

      return { success: true, data: payload.data };
    } catch (error: any) {
      console.error('❌ Error fetching insights:', error);
      return { success: false, error: error?.message || 'Failed to load insights' };
    }
  }

  /**
   * Increment view count for a post
   */
  static async incrementPostViews(postId: string): Promise<{ success: boolean; viewCount?: number; error?: string }> {
    try {
      const response = await apiFetch(`/posts/${postId}/view`, {
        method: 'POST'
      });

      let payload: any = null;
      try {
        payload = await response.json();
      } catch {}

      if (!response.ok || !payload?.success) {
        return {
          success: false,
          error: payload?.error || payload?.message || 'Failed to increment post views'
        };
      }

      return { success: true, viewCount: payload.data?.viewCount ?? undefined };
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
      const response = await apiFetch(`/posts/${postId}`, {
        method: 'GET'
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
  static async createPost(postData: Partial<Post> & { authorId: string }): Promise<{ success: boolean; post?: Post; error?: string }> {
    try {
      const response = await apiFetch('/posts', {
        method: 'POST',
        body: JSON.stringify(postData)
      });

      let payload: any = null;
      try {
        payload = await response.json();
      } catch {}

      if (!response.ok || !payload?.success) {
        return {
          success: false,
          error: payload?.error || payload?.message || 'Failed to create post'
        };
      }

      return { success: true, post: payload.data };
    } catch (error) {
      console.error('❌ Error creating post:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Update an existing post
   */
  static async updatePost(postId: string, updates: Partial<Post>): Promise<{ success: boolean; post?: Post; error?: string }> {
    try {
      const response = await apiFetch(`/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      let payload: any = null;
      try {
        payload = await response.json();
      } catch {}

      if (!response.ok || !payload?.success) {
        return {
          success: false,
          error: payload?.error || payload?.message || 'Failed to update post'
        };
      }

      return { success: true, post: payload.data };
    } catch (error) {
      console.error('❌ Error updating post:', error);
      return { success: false, error: 'Network error' };
    }
  }
}
