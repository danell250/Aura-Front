import { User } from '../types';
import { db, doc, setDoc, getDoc, collection, query, where, getDocs } from './firebase';

const BACKEND_URL = 'https://aura-back-s1bw.onrender.com/api';

export class UserService {
  // Save user to both MongoDB backend and Firebase Firestore
  static async saveUser(userData: User): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('Saving user to both MongoDB and Firestore:', userData.id);
      
      // 1. Save to MongoDB backend first
      let backendSuccess = false;
      try {
        const response = await fetch(`${BACKEND_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        
        if (response.ok) {
          backendSuccess = true;
          console.log('✅ User saved to MongoDB backend successfully');
        } else {
          const errorData = await response.json();
          console.log('⚠️ MongoDB backend save failed:', errorData.message);
        }
      } catch (error) {
        console.log('⚠️ MongoDB backend not available:', error);
      }
      
      // 2. Save to Firebase Firestore
      let firestoreSuccess = false;
      try {
        await setDoc(doc(db, 'users', userData.id), {
          ...userData,
          updatedAt: new Date().toISOString()
        });
        firestoreSuccess = true;
        console.log('✅ User saved to Firebase Firestore successfully');
      } catch (error) {
        console.error('❌ Firebase Firestore save failed:', error);
      }
      
      // Return success if at least one storage method worked
      if (backendSuccess || firestoreSuccess) {
        return { success: true, user: userData };
      } else {
        return { success: false, error: 'Failed to save user to both MongoDB and Firestore' };
      }
    } catch (error) {
      console.error('❌ Error saving user:', error);
      return { success: false, error: 'Failed to save user' };
    }
  }
  
  // Update user in both MongoDB backend and Firebase Firestore
  static async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('Updating user in both MongoDB and Firestore:', userId);
      
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // 1. Update in MongoDB backend
      let backendUser = null;
      try {
        const response = await fetch(`${BACKEND_URL}/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          const result = await response.json();
          backendUser = result.data;
          console.log('✅ User updated in MongoDB backend successfully');
        } else {
          console.log('⚠️ MongoDB backend update failed');
        }
      } catch (error) {
        console.log('⚠️ MongoDB backend not available:', error);
      }
      
      // 2. Update in Firebase Firestore
      let firestoreUser = null;
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, updateData, { merge: true });
        
        // Get updated user from Firestore
        const updatedDoc = await getDoc(userRef);
        if (updatedDoc.exists()) {
          firestoreUser = updatedDoc.data() as User;
        }
        console.log('✅ User updated in Firebase Firestore successfully');
      } catch (error) {
        console.error('❌ Firebase Firestore update failed:', error);
      }
      
      // Return the most complete user data
      const finalUser = backendUser || firestoreUser;
      if (finalUser) {
        return { success: true, user: finalUser };
      } else {
        return { success: false, error: 'Failed to update user in both MongoDB and Firestore' };
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      return { success: false, error: 'Failed to update user' };
    }
  }
  
  // Get user from both MongoDB backend and Firebase Firestore (with fallback)
  static async getUser(userId: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('Fetching user from MongoDB and Firestore:', userId);
      
      // 1. Try MongoDB backend first
      try {
        const response = await fetch(`${BACKEND_URL}/users/${userId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log('✅ User found in MongoDB backend');
            return { success: true, user: result.data };
          }
        }
      } catch (error) {
        console.log('⚠️ MongoDB backend not available:', error);
      }
      
      // 2. Fallback to Firebase Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          console.log('✅ User found in Firebase Firestore');
          return { success: true, user: userData };
        }
      } catch (error) {
        console.error('❌ Firebase Firestore fetch failed:', error);
      }
      
      return { success: false, error: 'User not found in either MongoDB or Firestore' };
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      return { success: false, error: 'Failed to fetch user' };
    }
  }
  
  // Get all users from both sources (with deduplication)
  static async getAllUsers(): Promise<{ success: boolean; users?: User[]; error?: string }> {
    try {
      console.log('Fetching all users from MongoDB and Firestore');
      
      const allUsers: User[] = [];
      const userIds = new Set<string>();
      
      // 1. Get users from MongoDB backend
      try {
        const response = await fetch(`${BACKEND_URL}/users`);
        if (response.ok) {
          const result = await response.json();
          const backendUsers = result.data || result;
          if (Array.isArray(backendUsers)) {
            backendUsers.forEach((user: User) => {
              if (!userIds.has(user.id)) {
                allUsers.push(user);
                userIds.add(user.id);
              }
            });
            console.log(`✅ Loaded ${backendUsers.length} users from MongoDB backend`);
          }
        }
      } catch (error) {
        console.log('⚠️ MongoDB backend not available:', error);
      }
      
      // 2. Get users from Firebase Firestore (add any missing users)
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        let firestoreCount = 0;
        usersSnapshot.forEach((doc) => {
          const userData = doc.data() as User;
          if (!userIds.has(userData.id)) {
            allUsers.push(userData);
            userIds.add(userData.id);
            firestoreCount++;
          }
        });
        console.log(`✅ Added ${firestoreCount} additional users from Firebase Firestore`);
      } catch (error) {
        console.error('❌ Firebase Firestore fetch failed:', error);
      }
      
      return { success: true, users: allUsers };
    } catch (error) {
      console.error('❌ Error fetching all users:', error);
      return { success: false, error: 'Failed to fetch users' };
    }
  }
  
  // Search users by email in both sources
  static async findUserByEmail(email: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      console.log('Searching for user by email:', normalizedEmail);
      
      // 1. Try MongoDB backend first
      try {
        const response = await fetch(`${BACKEND_URL}/users/search?q=${encodeURIComponent(normalizedEmail)}`);
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
        console.log('⚠️ MongoDB backend search not available:', error);
      }
      
      // 2. Fallback to Firebase Firestore
      try {
        const usersQuery = query(
          collection(db, 'users'),
          where('email', '==', normalizedEmail)
        );
        const querySnapshot = await getDocs(usersQuery);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data() as User;
          console.log('✅ User found by email in Firebase Firestore');
          return { success: true, user: userData };
        }
      } catch (error) {
        console.error('❌ Firebase Firestore search failed:', error);
      }
      
      return { success: false, error: 'User not found by email' };
    } catch (error) {
      console.error('❌ Error searching user by email:', error);
      return { success: false, error: 'Failed to search user by email' };
    }
  }
  
  // Check if user exists by email or handle
  static async userExists(email?: string, handle?: string): Promise<{ exists: boolean; user?: User }> {
    try {
      if (email) {
        const result = await this.findUserByEmail(email);
        if (result.success && result.user) {
          return { exists: true, user: result.user };
        }
      }
      
      if (handle) {
        // Search by handle in both sources
        const normalizedHandle = handle.toLowerCase().trim();
        
        // Try MongoDB backend
        try {
          const response = await fetch(`${BACKEND_URL}/users/search?q=${encodeURIComponent(normalizedHandle)}`);
          if (response.ok) {
            const result = await response.json();
            const users = result.data || [];
            const user = users.find((u: User) => u.handle?.toLowerCase().trim() === normalizedHandle);
            if (user) {
              return { exists: true, user };
            }
          }
        } catch (error) {
          console.log('⚠️ MongoDB backend handle search not available:', error);
        }
        
        // Try Firebase Firestore
        try {
          const usersQuery = query(
            collection(db, 'users'),
            where('handle', '==', handle)
          );
          const querySnapshot = await getDocs(usersQuery);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data() as User;
            return { exists: true, user: userData };
          }
        } catch (error) {
          console.error('❌ Firebase Firestore handle search failed:', error);
        }
      }
      
      return { exists: false };
    } catch (error) {
      console.error('❌ Error checking if user exists:', error);
      return { exists: false };
    }
  }
}