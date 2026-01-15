import { User } from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : '/api';

export type TrustLevel = 'verified' | 'trusted' | 'neutral' | 'caution' | 'unverified';

export interface TrustBreakdown {
  profileCompleteness: number;
  activityLevel: number;
  responseRate: number;
  positiveInteractions: number;
  accountAge: number;
  negativeFlags: number;
  total: number;
  level: TrustLevel;
}

export interface SerendipityMatch {
  user: User;
  compatibilityScore: number;
  trustScore: number;
  trustLevel: TrustLevel;
  mutualConnections: number;
  sharedHashtags: string[];
  industryMatch: boolean;
  profileCompleteness: {
    currentUser: number;
    candidate: number;
  };
  activityLevel: {
    currentUser: number;
    candidate: number;
  };
}

export function getTrustLevel(score: number): TrustLevel {
  if (score >= 85) return 'verified';
  if (score >= 65) return 'trusted';
  if (score >= 45) return 'neutral';
  if (score >= 25) return 'caution';
  return 'unverified';
}

export function getTrustBadgeConfig(score: number): {
  label: string;
  colorClass: string;
  textClass: string;
  icon: string;
} | null {
  const level = getTrustLevel(score);
  switch (level) {
    case 'verified':
      return {
        label: 'Verified',
        colorClass: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700',
        textClass: 'text-emerald-700 dark:text-emerald-300',
        icon: '✅'
      };
    case 'trusted':
      return {
        label: 'Trusted',
        colorClass: 'bg-sky-100 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700',
        textClass: 'text-sky-700 dark:text-sky-300',
        icon: '🛡️'
      };
    case 'neutral':
      return {
        label: 'Neutral',
        colorClass: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700',
        textClass: 'text-amber-700 dark:text-amber-300',
        icon: '⚖️'
      };
    case 'caution':
      return {
        label: 'Caution',
        colorClass: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-700',
        textClass: 'text-orange-700 dark:text-orange-300',
        icon: '⚠️'
      };
    case 'unverified':
    default:
      return null;
  }
}

export async function recalculateTrustForUser(userId: string): Promise<TrustBreakdown | null> {
  try {
    const resp = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/recalculate-trust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!resp.ok) return null;
    const json = await resp.json().catch(() => null);
    if (!json || !json.success || !json.data) return null;
    return json.data as TrustBreakdown;
  } catch (error) {
    console.error('Failed to recalculate trust score for user:', error);
    return null;
  }
}

export async function recalculateTrustForAll(): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE_URL}/users/recalculate-trust-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!resp.ok) return false;
    const json = await resp.json().catch(() => null);
    return !!(json && json.success);
  } catch (error) {
    console.error('Failed to recalculate trust scores for all users:', error);
    return false;
  }
}

export function formatTrustSummary(user: User): string {
  const score = user.trustScore ?? 0;
  const level = getTrustLevel(score);
  const labelMap: Record<TrustLevel, string> = {
    verified: 'Verified',
    trusted: 'Trusted',
    neutral: 'Neutral',
    caution: 'Caution',
    unverified: 'Unverified'
  };
  return `${labelMap[level]} • ${score}/100`;
}

export async function getSerendipityMatches(userId: string, limit: number = 20): Promise<SerendipityMatch[]> {
  try {
    const resp = await fetch(
      `${API_BASE_URL}/users/${encodeURIComponent(userId)}/serendipity-matches?limit=${encodeURIComponent(
        String(limit)
      )}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      }
    );
    if (!resp.ok) {
      return [];
    }
    const json = await resp.json().catch(() => null);
    if (!json || !json.success || !Array.isArray(json.data)) {
      return [];
    }
    return json.data as SerendipityMatch[];
  } catch (error) {
    console.error('Failed to load serendipity matches:', error);
    return [];
  }
}

export async function trackSerendipitySkip(userId: string, targetUserId: string): Promise<void> {
  try {
    await fetch(
      `${API_BASE_URL}/users/${encodeURIComponent(userId)}/serendipity-skip`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ targetUserId })
      }
    );
  } catch (error) {
    console.error('Failed to track serendipity skip:', error);
  }
}
