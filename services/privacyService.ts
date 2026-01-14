const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : '/api';

export interface PrivacySettings {
  showInSearch: boolean;
  showOnlineStatus: boolean;
  showProfileViews: boolean;
  allowTagging: boolean;
  emailNotifications: boolean;
  analyticsConsent: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
  allowDirectMessages: 'everyone' | 'friends' | 'none';
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  thirdPartySharing: boolean;
  locationTracking: boolean;
  activityTracking: boolean;
  personalizedAds: boolean;
  pushNotifications: boolean;
  updatedAt: string;
}

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  showStatus: boolean;
  lastSeen?: string;
}

export class PrivacyService {
  /**
   * Get user's privacy settings
   */
  static async getPrivacySettings(userId: string): Promise<{ success: boolean; data?: PrivacySettings; error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/privacy/settings/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result.data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to get privacy settings' };
      }
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Update user's privacy settings
   */
  static async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<{ success: boolean; data?: PrivacySettings; error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/privacy/settings/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result.data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to update privacy settings' };
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Track analytics event (only if user consented)
   */
  static async trackAnalyticsEvent(userId: string, eventType: string, eventData?: any): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/privacy/analytics-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          eventType,
          eventData
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to track analytics event' };
      }
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Get searchable users (respects privacy settings)
   */
  static async getSearchableUsers(query?: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const url = query 
        ? `${BACKEND_URL}/privacy/searchable-users?q=${encodeURIComponent(query)}`
        : `${BACKEND_URL}/privacy/searchable-users`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result.data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to get searchable users' };
      }
    } catch (error) {
      console.error('Error getting searchable users:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Record profile view (if user allows it)
   */
  static async recordProfileView(profileOwnerId: string, viewerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/privacy/profile-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileOwnerId,
          viewerId
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to record profile view' };
      }
    } catch (error) {
      console.error('Error recording profile view:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Get user's online status (if they allow it)
   */
  static async getOnlineStatus(userId: string): Promise<{ success: boolean; data?: OnlineStatus; error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/privacy/online-status/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result.data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to get online status' };
      }
    } catch (error) {
      console.error('Error getting online status:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Track page view (analytics)
   */
  static async trackPageView(userId: string, pageType: string, details?: any): Promise<{ success: boolean; error?: string }> {
    return this.trackAnalyticsEvent(userId, 'page_view', { pageType, ...details });
  }

  /**
   * Track user interaction (analytics)
   */
  static async trackInteraction(userId: string, interactionType: string, targetType: string, details?: any): Promise<{ success: boolean; error?: string }> {
    return this.trackAnalyticsEvent(userId, 'interaction', { interactionType, targetType, ...details });
  }

  /**
   * Check if user allows tagging
   */
  static async canTagUser(userId: string): Promise<boolean> {
    try {
      const result = await this.getPrivacySettings(userId);
      if (result.success && result.data) {
        return result.data.allowTagging;
      }
      return true; // Default to allowing tagging if settings can't be retrieved
    } catch (error) {
      console.error('Error checking tagging permission:', error);
      return true; // Default to allowing tagging on error
    }
  }

  /**
   * Check if user allows direct messages
   */
  static async canSendDirectMessage(userId: string, currentUserId: string): Promise<boolean> {
    try {
      const result = await this.getPrivacySettings(userId);
      if (result.success && result.data) {
        const setting = result.data.allowDirectMessages;
        if (setting === 'none') return false;
        if (setting === 'everyone') return true;
        if (setting === 'friends') {
          // In production, you'd check if users are friends
          // For now, we'll return true
          return true;
        }
      }
      return true; // Default to allowing messages if settings can't be retrieved
    } catch (error) {
      console.error('Error checking messaging permission:', error);
      return true; // Default to allowing messages on error
    }
  }

  /**
   * Get default privacy settings
   */
  static getDefaultPrivacySettings(): PrivacySettings {
    return {
      showInSearch: true,
      showOnlineStatus: true,
      showProfileViews: true,
      allowTagging: true,
      emailNotifications: true,
      analyticsConsent: true,
      profileVisibility: 'public',
      allowDirectMessages: 'everyone',
      dataProcessingConsent: true,
      marketingConsent: false,
      thirdPartySharing: false,
      locationTracking: false,
      activityTracking: true,
      personalizedAds: false,
      pushNotifications: true,
      updatedAt: new Date().toISOString()
    };
  }
}
