import { Notification } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : '/api';

export class NotificationService {
  /**
   * Get notifications for a user
   */
  static async getNotifications(userId: string, unreadOnly = false): Promise<{ success: boolean; data?: Notification[]; unreadCount?: number; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (unreadOnly) params.append('unreadOnly', 'true');
      
      const url = `${BACKEND_URL}/notifications/user/${userId}${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        return { 
          success: true, 
          data: result.data || [], 
          unreadCount: result.unreadCount || 0 
        };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to get notifications' };
      }
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to mark notification as read' };
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/notifications/user/${userId}/read-all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to mark all notifications as read' };
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to delete notification' };
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Create a notification (for testing purposes)
   */
  static async createNotification(
    userId: string, 
    type: string, 
    fromUserId: string, 
    message: string, 
    postId?: string, 
    connectionId?: string
  ): Promise<{ success: boolean; data?: Notification; error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type,
          fromUserId,
          message,
          postId,
          connectionId
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result.data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to create notification' };
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: 'Network error' };
    }
  }
}