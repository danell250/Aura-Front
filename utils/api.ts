import { BACKEND_URL } from '../constants';

// Centralized fetch utility with credentials for CORS
export const fetchWithCredentials = (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include' as RequestCredentials,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

// Backend API fetch utility
export const apiFetch = (endpoint: string, options: RequestInit = {}) => {
  return fetchWithCredentials(`${BACKEND_URL}${endpoint}`, options);
};
