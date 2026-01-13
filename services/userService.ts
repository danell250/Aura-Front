import { User } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : '/api';

export class UserService {
  // Save user to MongoDB backend
  static async saveUser(userData: User): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('Saving user to MongoDB:', userData.id);
      
      const response = await fetch(`${BACKEND_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${BACKEND_URL}/users/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${BACKEND_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${BACKEND_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${BACKEND_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${BACKEND_URL}/users/${toUserId}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  // Accept connection request
  static async acceptConnectionRequest(fromUserId: string, toUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/users/${toUserId}/accept-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fromUserId })
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

  // Remove acquaintance
  static async removeAcquaintance(userId: string, acquaintanceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/users/${userId}/remove-acquaintance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acquaintanceId })
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
        const response = await fetch(`${BACKEND_URL}/users/search?q=${encodeURIComponent(normalizedEmail)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
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
          const response = await fetch(`${BACKEND_URL}/users/search?q=${encodeURIComponent(normalizedHandle)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
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

  // Purchase credits
  static async purchaseCredits(userId: string, amount: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/users/${userId}/purchase-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to purchase credits' };
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
      return { success: false, error: 'Network error' };
    }
  }
}
