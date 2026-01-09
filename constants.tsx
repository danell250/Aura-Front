import { AdPackage, Ad, User, EnergyType, CreditBundle, Post } from './types';

export const APP_NAME = "Aura";
export const PRIMARY_COLOR = "emerald-600";

export const CREDIT_BUNDLES: CreditBundle[] = []; // Removed all credit bundles

export const INDUSTRIES = [
  'Technology & Software',
  'Healthcare',
  'Finance',
  'Education',
  'Marketing & Advertising',
  'Manufacturing',
  'Real Estate',
  'Retail',
  'Consulting',
  'Legal Services',
  'Non-Profit',
  'Government',
  'Energy',
  'Transportation',
  'Other'
];

export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'Singapore',
  'India',
  'Brazil',
  'South Africa',
  'Netherlands',
  'Sweden',
  'Other'
];

export const MOCK_USERS: User[] = [];

export const AD_PACKAGES: AdPackage[] = [
  {
    id: 'pkg-personal-pulse',
    name: 'Personal Pulse',
    subtitle: 'Flash announcements, quick tests',
    durationDays: 7,
    price: '$49 for 7 Days',
    numericPrice: 49,
    adLimit: 1,
    idealFor: 'Flash announcements, quick tests.',
    features: ['1 Active Signal', '7-Day Neural Retention', 'Standard Network Propagation', 'Basic Analytics'],
    gradient: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'pkg-aura-radiance',
    name: 'Aura Radiance',
    subtitle: 'The "Sweet Spot"',
    durationDays: 30,
    price: '$199 for 30 Days',
    numericPrice: 199,
    adLimit: 5,
    idealFor: 'Influencers, Content Creators.',
    features: ['5 Simultaneous Signals (Huge upgrade)', '30-Day Signal Lock', 'Priority Feed Injection (Priority Placement)', 'Smart CTA Button (Custom Neural CTA)'],
    gradient: 'from-purple-500 to-pink-600'
  },
  {
    id: 'pkg-universal-signal',
    name: 'Universal Signal',
    subtitle: 'The "Whale" Tier',
    durationDays: 30,
    price: '$699 for 30 Days',
    numericPrice: 699,
    adLimit: 20,
    idealFor: 'Brands, Agencies, Power Users.',
    features: ['20 Simultaneous Signals', 'Global Network Saturation (Maximum reach)', 'Deep-Dive Neural Analytics (Who clicked, when, and heatmaps)', '"Verified" Gold Border on Ads (Visual status symbol)'],
    gradient: 'from-yellow-500 to-amber-600'
  }
];

export const INITIAL_ADS: Ad[] = [];

export const CURRENT_USER = MOCK_USERS[0] || {
  id: '',
  firstName: '',
  lastName: '',
  name: '',
  handle: '',
  avatar: '',
  acquaintances: [],
  email: '',
  dob: '',
  blockedUsers: [],
  trustScore: 0,
  auraCredits: 0,
  activeGlow: 'none' as const,
  bio: '',
  zodiacSign: ''
};

export const INITIAL_POSTS: Post[] = [];
