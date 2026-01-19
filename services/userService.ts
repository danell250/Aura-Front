import { User } from '../types';
import { apiFetch } from '../utils/api';

export class UserService {
  // Get current user (prefers cookie-based auth, optional bearer token)
  static async getMe(token?: string | null): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await apiFetch('/auth/user', {
        method: 'GET'
      });
      if (response.ok) {
        const result = await response.json();
        return { success: true, user: result.user };
      }
      if (response.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      return { success: false, error: 'Failed to fetch user' };
    } catch (error) {
      console.error('Error fetching current user:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Save user to MongoDB backend
  static async saveUser(userData: User): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('Saving user to MongoDB:', userData.id);
      
      const response = await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ User saved to MongoDB successfully');
        return { success: true, user: result.data };
      } else {
        const errorData = await response.json();
        console.warn('⚠️ Failed to save user to MongoDB:', errorData.message);
        return { success: false, error: errorData.message || 'Failed to save user' };
      }
    } catch (error) {
      console.error('❌ Error saving user:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Search users by query
  static async searchUsers(query: string): Promise<{ success: boolean; users?: User[]; error?: string }> {
    try {
      const response = await apiFetch(`/users/search?q=${encodeURIComponent(query)}`, {
        method: 'GET'
      });
      if (response.ok) {
        const result = await response.json();
        return { success: true, users: result.data || [] };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to search users' };
      }
    } catch (error) {
      console.error('Error searching users:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Get user by ID from MongoDB backend
  static async getUserById(userId: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await apiFetch(`/users/${userId}`, {
        method: 'GET'
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, user: result.data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Get all users from MongoDB backend
  static async getAllUsers(): Promise<{ success: boolean; users?: User[]; error?: string }> {
    try {
      const response = await apiFetch('/users', {
        method: 'GET'
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, users: result.data || [] };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to get users' };
      }
    } catch (error) {
      console.error('Error getting all users:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Update user
  static async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await apiFetch(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, user: result.data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to update user' };
      }
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Send connection request
  static async sendConnectionRequest(fromUserId: string, toUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiFetch(`/users/${toUserId}/connect`, {
        method: 'POST',
        body: JSON.stringify({ fromUserId })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to send connection request' };
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async cancelConnectionRequest(fromUserId: string, toUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiFetch(`/users/${fromUserId}/cancel-connection`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId: toUserId })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to cancel connection request' };
      }
    } catch (error) {
      console.error('Error cancelling connection request:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Accept connection request
  static async acceptConnectionRequest(fromUserId: string, toUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiFetch(`/users/${toUserId}/accept-connection`, {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requesterId: fromUserId })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to accept connection request' };
      }
    } catch (error) {
      console.error('Error accepting connection request:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Reject connection request
  static async rejectConnectionRequest(fromUserId: string, toUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiFetch(`/users/${toUserId}/reject-connection`, {
        method: 'POST',
        body: JSON.stringify({ requesterId: fromUserId })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to reject connection request' };
      }
    } catch (error) {
      console.error('Error rejecting connection request:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Block user
  static async blockUser(userId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiFetch(`/users/${userId}/block`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId })
      });
      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to block user' };
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async unblockUser(userId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiFetch(`/users/${userId}/unblock`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId })
      });
      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to unblock user' };
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Report user
  static async reportUser(userId: string, targetUserId: string, reason: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiFetch(`/users/${userId}/report`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId, reason, notes })
      });
      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to report user' };
      }
    } catch (error) {
      console.error('Error reporting user:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Remove acquaintance
  static async removeAcquaintance(userId: string, acquaintanceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiFetch(`/users/${userId}/remove-acquaintance`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId: acquaintanceId })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to remove acquaintance' };
      }
    } catch (error) {
      console.error('Error removing acquaintance:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Find user by email
  static async findUserByEmail(email: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      console.log('Searching for user by email:', normalizedEmail);
      
      // Try MongoDB backend
      try {
        const response = await apiFetch(`/users/search?q=${encodeURIComponent(normalizedEmail)}`, {
          method: 'GET'
        });
        if (response.ok) {
          const result = await response.json();
          const users = result.data || [];
          const user = users.find((u: User) => u.email?.toLowerCase().trim() === normalizedEmail);
          if (user) {
            console.log('✅ User found by email in MongoDB backend');
            return { success: true, user };
          }
        }
      } catch (error) {
        console.warn('⚠️ MongoDB backend search failed:', error);
      }

      console.log('❌ User not found by email');
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Error finding user by email:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Check if handle exists
  static async checkHandleExists(handle?: string): Promise<{ exists: boolean; user?: User; error?: string }> {
    try {
      if (!handle) {
        return { exists: false };
      }

      if (handle) {
        // Search by handle in backend
        const normalizedHandle = handle.toLowerCase().trim();
        
        // Try MongoDB backend
        try {
          const response = await apiFetch(`/users/search?q=${encodeURIComponent(normalizedHandle)}`, {
            method: 'GET'
          });
          if (response.ok) {
            const result = await response.json();
            const users = result.data || [];
            const user = users.find((u: User) => u.handle?.toLowerCase().trim() === normalizedHandle);
            if (user) {
              return { exists: true, user };
            }
          }
        } catch (error) {
          console.warn('⚠️ MongoDB backend handle check failed:', error);
        }
      }

      return { exists: false };
    } catch (error) {
      console.error('Error checking handle existence:', error);
      return { exists: false, error: 'Network error' };
    }
  }

  static async purchaseCredits(
    userId: string,
    payload: { credits: number; bundleName: string; transactionId?: string; paymentMethod?: string; orderId?: string }
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const response = await apiFetch(`/users/${userId}/purchase-credits`, {
        method: 'POST',
        body: JSON.stringify({
          credits: payload.credits,
          bundleName: payload.bundleName,
          transactionId: payload.transactionId,
          paymentMethod: payload.paymentMethod || 'paypal',
          orderId: payload.orderId
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result.data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to purchase credits' };
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async getCreditHistory(
    userId: string
  ): Promise<{ success: boolean; error?: string; data?: any[] }> {
    try {
      const response = await apiFetch(`/credits/history/${userId}`, {
        method: 'GET'
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result.data || [] };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to fetch credit history' };
      }
    } catch (error) {
      console.error('Error fetching credit history:', error);
      return { success: false, error: 'Network error' };
    }
  }
}
