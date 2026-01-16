import { getApiBaseUrl } from '../constants';

export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include', // Important! Sends cookies
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    
    if (data.success && data.accessToken) {
      localStorage.setItem('aura_auth_token', data.accessToken);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};
