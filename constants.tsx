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
    id: 'pkg-leader',
    name: 'Leadership Pulse',
    subtitle: 'Amplify your executive presence',
    durationDays: 30,
    price: '$299 for 30 Days',
    numericPrice: 299,
    adLimit: 3,
    idealFor: 'Executives, Business Leaders, Consultants.',
    features: ['3 Leadership Signals', '30-Day Executive Reach', 'Professional Network Targeting', 'Leadership Analytics'],
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'pkg-career',
    name: 'Career Growth',
    subtitle: 'Accelerate your professional journey',
    durationDays: 30,
    price: '$199 for 30 Days',
    numericPrice: 199,
    adLimit: 2,
    idealFor: 'Career Professionals, Job Seekers, Coaches.',
    features: ['2 Career Signals', '30-Day Professional Visibility', 'Industry-Specific Targeting', 'Career Analytics'],
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'pkg-business',
    name: 'Business Impact',
    subtitle: 'Maximum business visibility',
    durationDays: 30,
    price: '$499 for 30 Days',
    numericPrice: 499,
    adLimit: 5,
    idealFor: 'Business Owners, Entrepreneurs, B2B Services.',
    features: ['5 Business Signals', '30-Day Business Network', 'Industry Leader Targeting', 'Business Growth Analytics'],
    gradient: 'from-purple-500 to-pink-600'
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
