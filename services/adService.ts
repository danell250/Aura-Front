import { Ad } from '../types';
import { apiFetch } from '../utils/api';

export class AdService {
  /**
   * Create a new ad
   */
  static async createAd(adData: Omit<Ad, 'id' | 'timestamp' | 'reactions' | 'reactionUsers'>): Promise<{ success: boolean; ad?: Ad; error?: string }> {
    try {
      const response = await apiFetch('/ads', {
        method: 'POST',
        body: JSON.stringify(adData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          console.log('✅ Ad created successfully in backend');
          return { success: true, ad: result.data };
        }
      }

      const errorResult = await response.json();
      return { success: false, error: errorResult.message || errorResult.error || 'Failed to create ad' };
    } catch (error) {
      console.error('❌ Error creating ad:', error);
      return { success: false, error: 'Failed to create ad' };
    }
  }

  /**
   * Get all ads
   */
  static async getAllAds(): Promise<{ success: boolean; ads?: Ad[]; error?: string }> {
    try {
      const response = await apiFetch('/ads', {
        method: 'GET'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          return { success: true, ads: result.data };
        }
      }

      const errorResult = await response.json();
      return { success: false, error: errorResult.error || 'Failed to fetch ads' };
    } catch (error) {
      console.error('❌ Error fetching ads:', error);
      return { success: false, error: 'Failed to fetch ads' };
    }
  }

  static async getAdsByHashtag(hashtag: string): Promise<{ success: boolean; ads?: Ad[]; error?: string }> {
    try {
      const tag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
      const response = await apiFetch(`/ads?hashtags=${encodeURIComponent(tag)}`, {
        method: 'GET'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          return { success: true, ads: result.data };
        }
      }

      const errorResult = await response.json();
      return { success: false, error: errorResult.error || 'Failed to fetch ads by hashtag' };
    } catch (error) {
      console.error('❌ Error fetching ads by hashtag:', error);
      return { success: false, error: 'Failed to fetch ads by hashtag' };
    }
  }

  /**
   * Delete an ad by ID
   */
  static async deleteAd(adId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiFetch(`/ads/${adId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return { success: true };
        }
      }

      const errorResult = await response.json();
      return { success: false, error: errorResult.error || 'Failed to delete ad' };
    } catch (error) {
      console.error('❌ Error deleting ad:', error);
      return { success: false, error: 'Failed to delete ad' };
    }
  }

  /**
   * Update an ad by ID
   */
  static async updateAd(adId: string, updates: Partial<Ad>): Promise<{ success: boolean; ad?: Ad; error?: string }> {
    try {
      const response = await apiFetch(`/ads/${adId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return { success: true, ad: result.data };
        }
      }

      const errorResult = await response.json();
      return { success: false, error: errorResult.message || errorResult.error || 'Failed to update ad' };
    } catch (error) {
      console.error('❌ Error updating ad:', error);
      return { success: false, error: 'Failed to update ad' };
    }
  }

  /**
   * Update an ad status by ID
   */
  static async updateAdStatus(adId: string, status: 'active' | 'paused' | 'ended' | 'cancelled'): Promise<{ success: boolean; ad?: Ad; error?: string }> {
    try {
      const response = await apiFetch(`/ads/${adId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return { success: true, ad: result.data };
        }
      }

      const errorResult = await response.json();
      return { success: false, error: errorResult.message || errorResult.error || 'Failed to update ad status' };
    } catch (error) {
      console.error('❌ Error updating ad status:', error);
      return { success: false, error: 'Failed to update ad status' };
    }
  }
}
