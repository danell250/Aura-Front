import { BACKEND_URL } from '../constants';

// Centralized fetch utility with credentials for CORS
export const fetchWithCredentials = async (url: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Attach bearer token if present
  const token = localStorage.getItem('aura_auth_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  // Merge with any existing headers
  Object.assign(headers, options.headers || {});
  
  return fetch(url, {
    ...options,
    credentials: 'include' as RequestCredentials,
    headers,
  });
};

// Backend API fetch utility
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  return fetchWithCredentials(`${BACKEND_URL}${endpoint}`, options);
};