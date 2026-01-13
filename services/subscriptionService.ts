const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://aura-backend-production.up.railway.app/api';

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired';
  paypalSubscriptionId: string;
  nextBillingDate: string;
  amount: string;
  createdDate: string;
  cancelledDate?: string;
}

export const subscriptionService = {
  // Get user subscriptions
  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      // Return mock data for development
      return [
        {
          id: 'sub_123456789',
          userId,
          planId: 'P-5TR6407366314243FNFRU2BY',
          planName: 'Aura Radiance',
          status: 'active',
          paypalSubscriptionId: 'I-BW452GLLEP1G',
          nextBillingDate: '2025-02-11',
          amount: '$199.00',
          createdDate: '2025-01-11'
        }
      ];
    }
  },

  // Create subscription
  async createSubscription(subscriptionData: {
    userId: string;
    planId: string;
    planName: string;
    paypalSubscriptionId: string;
    amount: string;
  }): Promise<Subscription> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
};