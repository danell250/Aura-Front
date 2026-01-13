import { Comment } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : '/api';

export class CommentService {
  static async getComments(postId: string): Promise<{ success: boolean; data?: Comment[]; error?: string }> {
    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const resp = await fetch(`${BACKEND_URL}/posts/${postId}/comments`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      const json = await resp.json().catch(() => ({} as any));
      if (resp.ok && json?.success) return { success: true, data: json.data || [] };
      return { success: false, error: json?.message || 'Failed to fetch comments' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  static async createComment(postId: string, text: string, authorId: string, parentId?: string): Promise<{ success: boolean; data?: Comment; error?: string }>{
    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const resp = await fetch(`${BACKEND_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ text, authorId, parentId })
      });
      const json = await resp.json().catch(() => ({} as any));
      if (resp.ok && json?.success && json?.data) return { success: true, data: json.data };
      return { success: false, error: json?.message || 'Failed to create comment' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  static async deleteComment(commentId: string): Promise<{ success: boolean; error?: string }>{
    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const resp = await fetch(`${BACKEND_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      const json = await resp.json().catch(() => ({} as any));
      if (resp.ok && json?.success) return { success: true };
      return { success: false, error: json?.message || 'Failed to delete comment' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  static async reactToComment(commentId: string, reaction: string, userId: string): Promise<{ success: boolean; data?: Comment; error?: string }> {
    try {
      const token = localStorage.getItem('aura_auth_token') || '';
      const resp = await fetch(`${BACKEND_URL}/comments/${commentId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ reaction, userId })
      });
      const json = await resp.json().catch(() => ({} as any));
      if (resp.ok && json?.success) return { success: true, data: json.data };
      return { success: false, error: json?.message || 'Failed to react to comment' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }
}
