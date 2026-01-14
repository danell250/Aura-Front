const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://aura-back-s1bw.onrender.com/api';

export interface AdAnalytics {
  adId: string;
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate
  reach: number;
  engagement: number;
  conversions: number;
  spend: number;
  lastUpdated: number;
}

export interface CampaignPerformance {
  totalImpressions: number;
  totalClicks: number;
  totalReach: number;
  totalEngagement: number;
  totalSpend: number;
  averageCTR: number;
  activeAds: number;
  daysToNextExpiry?: number | null;
  performanceScore: number;
  trendData: {
    date: string;
    impressions: number;
    clicks: number;
    engagement: number;
  }[];
}

export interface AdPerformanceMetrics {
  adId: string;
  adName: string;
  status: 'active' | 'paused' | 'completed';
  impressions: number;
  clicks: number;
  ctr: number;
  engagement: number;
  spend: number;
  roi: number;
  createdAt: number;
}

export const adAnalyticsService = {
  // Get analytics for a specific ad
  async getAdAnalytics(adId: string): Promise<AdAnalytics | null> {
    try {
      const token = localStorage.getItem('aura_auth_token');
      const response = await fetch(`${API_BASE_URL}/ads/${adId}/analytics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('[AdAnalytics] Failed to fetch ad analytics:', response.status);
        return null;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[AdAnalytics] Error fetching ad analytics:', error);
      return null;
    }
  },

  // Get campaign performance for user
  async getCampaignPerformance(userId: string): Promise<CampaignPerformance> {
    try {
      const token = localStorage.getItem('aura_auth_token');
      const response = await fetch(`${API_BASE_URL}/ads/analytics/campaign/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('[AdAnalytics] Failed to fetch campaign performance:', response.status);
        return {
          totalImpressions: 0,
          totalClicks: 0,
          totalReach: 0,
          totalEngagement: 0,
          totalSpend: 0,
          averageCTR: 0,
          activeAds: 0,
          performanceScore: 0,
          trendData: []
        };
      }

      const result = await response.json();
      return result.data || {
        totalImpressions: 0,
        totalClicks: 0,
        totalReach: 0,
        totalEngagement: 0,
        totalSpend: 0,
        averageCTR: 0,
        activeAds: 0,
        performanceScore: 0,
        trendData: []
      };
    } catch (error) {
      console.error('[AdAnalytics] Error fetching campaign performance:', error);
      return {
        totalImpressions: 0,
        totalClicks: 0,
        totalReach: 0,
        totalEngagement: 0,
        totalSpend: 0,
        averageCTR: 0,
        activeAds: 0,
        performanceScore: 0,
        trendData: []
      };
    }
  },

  // Get all ad performance metrics for user
  async getUserAdPerformance(userId: string): Promise<AdPerformanceMetrics[]> {
    try {
      const token = localStorage.getItem('aura_auth_token');
      const response = await fetch(`${API_BASE_URL}/ads/analytics/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('[AdAnalytics] Failed to fetch user ad performance:', response.status);
        return [];
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('[AdAnalytics] Error fetching user ad performance:', error);
      return [];
    }
  },

  // Track ad impression
  async trackImpression(adId: string): Promise<void> {
    try {
      const token = localStorage.getItem('aura_auth_token');
      const response = await fetch(`${API_BASE_URL}/ads/${adId}/impression`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      
      if (!response.ok && response.status === 404) {
        console.warn(`[AdAnalytics] Ad ${adId} not found for impression tracking (404). This might happen if the ad was just deleted or the backend is out of sync.`);
      }
    } catch (error) {
      console.error('[AdAnalytics] Error tracking impression:', error);
    }
  },

  // Track ad click
  async trackClick(adId: string): Promise<void> {
    try {
      const token = localStorage.getItem('aura_auth_token');
      await fetch(`${API_BASE_URL}/ads/${adId}/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
    } catch (error) {
      console.error('[AdAnalytics] Error tracking click:', error);
    }
  },

  // Track ad engagement
  async trackEngagement(adId: string, engagementType: 'like' | 'comment' | 'share'): Promise<void> {
    try {
      const token = localStorage.getItem('aura_auth_token');
      await fetch(`${API_BASE_URL}/ads/${adId}/engagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ engagementType })
      });
    } catch (error) {
      console.error('[AdAnalytics] Error tracking engagement:', error);
    }
  },

 
};
