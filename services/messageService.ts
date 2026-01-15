import { Message } from '../types';
import { BACKEND_URL } from '../constants';

const API_BASE_URL = BACKEND_URL;

export class MessageService {
  // Get conversations for a user
  static async getConversations(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/conversations?userId=${userId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get messages between two users
  static async getMessages(currentUserId: string, otherUserId: string, page = 1, limit = 50) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/${otherUserId}?currentUserId=${currentUserId}&page=${page}&limit=${limit}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a new message
  static async sendMessage(senderId: string, receiverId: string, text: string, messageType = 'text', mediaUrl?: string, replyTo?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId,
          receiverId,
          text,
          messageType,
          mediaUrl,
          replyTo
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Edit a message
  static async editMessage(messageId: string, text: string, userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          userId
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  // Delete a message
  static async deleteMessage(messageId: string, userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Delete all messages in a conversation
  static async deleteConversation(userId: string, otherUserId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/conversation`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          otherUserId
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  // Mark messages as read
  static async markAsRead(senderId: string, receiverId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/mark-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId,
          receiverId
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  static async setArchiveState(userId: string, otherUserId: string, archived: boolean) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, otherUserId, archived }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating archive state:', error);
      throw error;
    }
  }
}
