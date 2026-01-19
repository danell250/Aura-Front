import { BACKEND_URL, getApiBaseUrl } from '../constants';
import { refreshAccessToken } from './tokenRefresh';

// Helper to handle token refresh queue
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Centralized fetch utility with credentials for CORS and Auto-Refresh
export const fetchWithCredentials = async (url: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Attach bearer token if present
  let token = localStorage.getItem('aura_auth_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  // Merge with any existing headers
  Object.assign(headers, options.headers || {});
  
  // If body is FormData, delete Content-Type to let browser set boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }
  
  let response = await fetch(url, {
    ...options,
    credentials: 'include' as RequestCredentials,
    headers,
  });

  // Handle 401 Unauthorized - Attempt Refresh
  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      
      if (newToken) {
        onRefreshed(newToken);
      } else {
        // Refresh failed - allow the 401 to propagate (caller handles logout)
        return response; 
      }
    } else {
      // If already refreshing, wait for the new token
      await new Promise<string>((resolve) => {
        addRefreshSubscriber(resolve);
      });
    }
    
    // Retry request with new token
    const newToken = localStorage.getItem('aura_auth_token');
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        credentials: 'include' as RequestCredentials,
        headers
      });
    }
  }

  return response;
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  return fetchWithCredentials(`${getApiBaseUrl()}${endpoint}`, options);
};

export const getApiBaseUrlClient = () => getApiBaseUrl();
