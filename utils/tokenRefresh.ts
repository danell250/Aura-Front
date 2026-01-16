import { getApiBaseUrl } from '../constants';

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.success && data.accessToken) {
      localStorage.setItem('aura_auth_token', data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};
