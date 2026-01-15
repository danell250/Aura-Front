import { Ad } from '../types';
import { getApiBaseUrl } from '../constants';

const API_BASE_URL = getApiBaseUrl();

export class AdService {
  /**
   * Create a new ad
   */
  static async createAd(adData: Omit<Ad, 'id' | 'timestamp' | 'reactions' | 'reactionUsers'>): Promise<{ success: boolean; ad?: Ad; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aura_auth_token')}`
        },
        body: JSON.stringify(adData),
        credentials: 'include' as RequestCredentials
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          console.log('✅ Ad created successfully in backend');
          return { success: true, ad: result.data };
        }
      }

      const errorResult = await response.json();
      return { success: false, error: errorResult.error || 'Failed to create ad' };
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
      const response = await fetch(`${API_BASE_URL}/ads`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aura_auth_token')}`
        },
        credentials: 'include' as RequestCredentials
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
      const response = await fetch(`${API_BASE_URL}/ads?hashtags=${encodeURIComponent(tag)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aura_auth_token')}`
        },
        credentials: 'include' as RequestCredentials
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
      const response = await fetch(`${API_BASE_URL}/ads/${adId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aura_auth_token')}`
        },
        credentials: 'include' as RequestCredentials
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
      const response = await fetch(`${API_BASE_URL}/ads/${adId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aura_auth_token')}`
        },
        body: JSON.stringify(updates),
        credentials: 'include' as RequestCredentials
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return { success: true, ad: result.data };
        }
      }

      const errorResult = await response.json();
      return { success: false, error: errorResult.error || 'Failed to update ad' };
    } catch (error) {
      console.error('❌ Error updating ad:', error);
      return { success: false, error: 'Failed to update ad' };
    }
  }
}
