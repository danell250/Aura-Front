import { getApiBaseUrl } from '../constants';

const API_BASE_URL = getApiBaseUrl();

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

export interface AdSubscription {
  id: string;
  userId: string;
  packageId: string;
  packageName: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: number;
  endDate?: number;
  nextBillingDate?: number;
  paypalSubscriptionId?: string;
  adsUsed: number;
  adLimit: number;
  createdAt: number;
  updatedAt: number;
}

// Helper function to fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = REQUEST_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
};

export const adSubscriptionService = {
  // Get user's ad subscriptions
  async getUserSubscriptions(userId: string): Promise<AdSubscription[]> {
    try {
      console.log('[AdSubscriptionService] Fetching user subscriptions for:', userId);
      const token = localStorage.getItem('aura_auth_token');
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/ad-subscriptions/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('[AdSubscriptionService] HTTP error:', response.status);
        // Return empty array instead of throwing to prevent UI from getting stuck
        return [];
      }

      const result = await response.json();
      console.log('[AdSubscriptionService] Fetched subscriptions:', result.data?.length || 0);
      return result.data || [];
    } catch (error) {
      console.error('[AdSubscriptionService] Error fetching user ad subscriptions:', error);
      // Return empty array to prevent UI from getting stuck
      return [];
    }
  },

  // Get user's active subscriptions with available ad slots
  async getActiveSubscriptions(userId: string): Promise<AdSubscription[]> {
    try {
      console.log('[AdSubscriptionService] Fetching active subscriptions for:', userId);
      const token = localStorage.getItem('aura_auth_token');
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/ad-subscriptions/user/${userId}/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('[AdSubscriptionService] HTTP error:', response.status);
        // Return empty array instead of throwing to prevent UI from getting stuck
        return [];
      }

      const result = await response.json();
      console.log('[AdSubscriptionService] Fetched active subscriptions:', result.data?.length || 0);
      return result.data || [];
    } catch (error) {
      console.error('[AdSubscriptionService] Error fetching active ad subscriptions:', error);
      // Return empty array to prevent UI from getting stuck
      return [];
    }
  },

  // Create new ad subscription
  async createSubscription(subscriptionData: {
    userId: string;
    packageId: string;
    packageName: string;
    paypalSubscriptionId?: string;
    adLimit: number;
    durationDays?: number;
  }): Promise<AdSubscription> {
    try {
      console.log('[AdSubscriptionService] Creating subscription:', subscriptionData);
      const token = localStorage.getItem('aura_auth_token');
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/ad-subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AdSubscriptionService] Create subscription error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[AdSubscriptionService] Subscription created:', result.data?.id);
      return result.data;
    } catch (error) {
      console.error('[AdSubscriptionService] Error creating ad subscription:', error);
      throw error;
    }
  },

  // Use an ad slot from subscription
  async useAdSlot(subscriptionId: string): Promise<AdSubscription> {
    try {
      console.log('[AdSubscriptionService] Using ad slot for subscription:', subscriptionId);
      const token = localStorage.getItem('aura_auth_token');
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/ad-subscriptions/${subscriptionId}/use-ad`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AdSubscriptionService] Use ad slot error:', response.status, errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[AdSubscriptionService] Ad slot used, remaining:', result.data?.adLimit - result.data?.adsUsed);
      return result.data;
    } catch (error) {
      console.error('[AdSubscriptionService] Error using ad slot:', error);
      throw error;
    }
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<AdSubscription> {
    try {
      console.log('[AdSubscriptionService] Cancelling subscription:', subscriptionId);
      const token = localStorage.getItem('aura_auth_token');
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/ad-subscriptions/${subscriptionId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AdSubscriptionService] Cancel subscription error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[AdSubscriptionService] Subscription cancelled:', result.data?.id);
      return result.data;
    } catch (error) {
      console.error('[AdSubscriptionService] Error cancelling ad subscription:', error);
      throw error;
    }
  },

  // Get subscription by ID
  async getSubscriptionById(subscriptionId: string): Promise<AdSubscription | null> {
    try {
      console.log('[AdSubscriptionService] Fetching subscription by ID:', subscriptionId);
      const token = localStorage.getItem('aura_auth_token');
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/ad-subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('[AdSubscriptionService] Fetch subscription error:', response.status);
        return null;
      }

      const result = await response.json();
      console.log('[AdSubscriptionService] Fetched subscription:', result.data?.id);
      return result.data;
    } catch (error) {
      console.error('[AdSubscriptionService] Error fetching ad subscription:', error);
      return null;
    }
  }
};
