const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://aura-back-s1bw.onrender.com/api';

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

export const adSubscriptionService = {
  // Get user's ad subscriptions
  async getUserSubscriptions(userId: string): Promise<AdSubscription[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/ad-subscriptions/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching user ad subscriptions:', error);
      return [];
    }
  },

  // Get user's active subscriptions with available ad slots
  async getActiveSubscriptions(userId: string): Promise<AdSubscription[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/ad-subscriptions/user/${userId}/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching active ad subscriptions:', error);
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
      const response = await fetch(`${API_BASE_URL}/ad-subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating ad subscription:', error);
      throw error;
    }
  },

  // Use an ad slot from subscription
  async useAdSlot(subscriptionId: string): Promise<AdSubscription> {
    try {
      const response = await fetch(`${API_BASE_URL}/ad-subscriptions/${subscriptionId}/use-ad`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error using ad slot:', error);
      throw error;
    }
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<AdSubscription> {
    try {
      const response = await fetch(`${API_BASE_URL}/ad-subscriptions/${subscriptionId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error cancelling ad subscription:', error);
      throw error;
    }
  },

  // Get subscription by ID
  async getSubscriptionById(subscriptionId: string): Promise<AdSubscription> {
    try {
      const response = await fetch(`${API_BASE_URL}/ad-subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching ad subscription:', error);
      throw error;
    }
  }
};