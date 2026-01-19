import { Message } from '../types';
import { apiFetch } from '../utils/api';

export class MessageService {
  // Get conversations for a user
  static async getConversations(userId: string) {
    try {
      const response = await apiFetch(`/messages/conversations?userId=${userId}`);
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
      const response = await apiFetch(
        `/messages/${otherUserId}?currentUserId=${currentUserId}&page=${page}&limit=${limit}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a new message
  static async sendMessage(
    senderId: string, 
    receiverId: string, 
    text: string, 
    messageType = 'text', 
    mediaUrl?: string, 
    replyTo?: string,
    mediaKey?: string,
    mediaMimeType?: string,
    mediaSize?: number
  ) {
    try {
      const response = await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          senderId,
          receiverId,
          text,
          messageType,
          mediaUrl,
          mediaKey,
          mediaMimeType,
          mediaSize,
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
      const response = await apiFetch(`/messages/${messageId}`, {
        method: 'PUT',
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
      const response = await apiFetch(`/messages/${messageId}`, {
        method: 'DELETE',
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
      const response = await apiFetch(`/messages/conversation/${otherUserId}`, {
        method: 'DELETE',
        body: JSON.stringify({
          userId
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
      const response = await apiFetch('/messages/mark-read', {
        method: 'PUT',
        body: JSON.stringify({
          senderId,
          receiverId,
          currentUserId: receiverId
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
      const response = await apiFetch('/messages/archive', {
        method: 'POST',
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
