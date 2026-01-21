import { getApiBaseUrl } from '../constants';

const API_BASE_URL = getApiBaseUrl();

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

export const normalizeAnalytics = (a: any): AdAnalytics => ({
  adId: a?.adId ?? '',
  impressions: Number(a?.impressions ?? 0),
  clicks: Number(a?.clicks ?? 0),
  engagement: Number(a?.engagement ?? 0),
  reach: Number(a?.reach ?? 0),
  spend: Number(a?.spend ?? 0),
  conversions: Number(a?.conversions ?? 0),
  ctr: Number(a?.ctr ?? 0),
  lastUpdated: a?.lastUpdated ?? Date.now()
});

export const normalizeCampaignPerformance = (c: any): CampaignPerformance => ({
  totalImpressions: Number(c?.totalImpressions ?? 0),
  totalClicks: Number(c?.totalClicks ?? 0),
  totalReach: Number(c?.totalReach ?? 0),
  totalEngagement: Number(c?.totalEngagement ?? 0),
  totalSpend: Number(c?.totalSpend ?? 0),
  averageCTR: Number(c?.averageCTR ?? 0),
  activeAds: Number(c?.activeAds ?? 0),
  daysToNextExpiry: c?.daysToNextExpiry,
  performanceScore: Number(c?.performanceScore ?? 0),
  lastUpdated: c?.lastUpdated ?? Date.now(),
  trendData: Array.isArray(c?.trendData) ? c.trendData.map((t: any) => ({
    date: t?.date ?? '',
    impressions: Number(t?.impressions ?? 0),
    clicks: Number(t?.clicks ?? 0),
    engagement: Number(t?.engagement ?? 0)
  })) : []
});

export const normalizeAdPerformanceMetrics = (m: any): AdPerformanceMetrics => ({
  adId: m?.adId ?? '',
  adName: m?.adName ?? 'Untitled',
  status: m?.status ?? 'active',
  impressions: Number(m?.impressions ?? 0),
  clicks: Number(m?.clicks ?? 0),
  ctr: Number(m?.ctr ?? 0),
  engagement: Number(m?.engagement ?? 0),
  spend: Number(m?.spend ?? 0),
  roi: Number(m?.roi ?? 0),
  createdAt: m?.createdAt ?? Date.now()
});

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
      return result.data ? normalizeAnalytics(result.data) : null;
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
        return normalizeCampaignPerformance({});
      }

      const result = await response.json();
      return normalizeCampaignPerformance(result.data || {});
    } catch (error) {
      console.error('[AdAnalytics] Error fetching campaign performance:', error);
      return normalizeCampaignPerformance({});
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
      return Array.isArray(result.data) 
        ? result.data.map(normalizeAdPerformanceMetrics) 
        : [];
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
        body: JSON.stringify({ engagementType }),
        credentials: 'include'
      });
    } catch (error) {
      console.error('[AdAnalytics] Error tracking engagement:', error);
    }
  }
};
