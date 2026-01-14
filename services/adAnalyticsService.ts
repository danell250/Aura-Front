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
        return this.getMockCampaignPerformance();
      }

      const result = await response.json();
      return result.data || this.getMockCampaignPerformance();
    } catch (error) {
      console.error('[AdAnalytics] Error fetching campaign performance:', error);
      return this.getMockCampaignPerformance();
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
      await fetch(`${API_BASE_URL}/ads/${adId}/impression`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
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

  // Mock data for development
  getMockCampaignPerformance(): CampaignPerformance {
    return {
      totalImpressions: 12847,
      totalClicks: 892,
      totalReach: 8934,
      totalEngagement: 1247,
      totalSpend: 199,
      averageCTR: 6.94,
      activeAds: 3,
      performanceScore: 87,
      trendData: [
        { date: '2025-01-08', impressions: 1523, clicks: 98, engagement: 145 },
        { date: '2025-01-09', impressions: 1789, clicks: 124, engagement: 178 },
        { date: '2025-01-10', impressions: 1654, clicks: 115, engagement: 162 },
        { date: '2025-01-11', impressions: 1923, clicks: 142, engagement: 201 },
        { date: '2025-01-12', impressions: 2134, clicks: 156, engagement: 234 },
        { date: '2025-01-13', impressions: 1987, clicks: 138, engagement: 189 },
        { date: '2025-01-14', impressions: 1837, clicks: 119, engagement: 138 }
      ]
    };
  }
};
