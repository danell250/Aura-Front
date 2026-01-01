
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  handle: string;
  avatar: string;
  avatarType?: 'image' | 'video';
  coverImage?: string; 
  coverType?: 'image' | 'video';
  bio?: string;
  dob?: string;
  zodiacSign?: string;
  email?: string;
  phone?: string;
  acquaintances?: string[]; 
  sentConnectionRequests?: string[];
  notifications?: Notification[];
  blockedUsers?: string[];
  profileViews?: string[];
  isPrivate?: boolean;
  trustScore: number; 
  auraCredits: number;
  activeGlow?: 'emerald' | 'cyan' | 'amber' | 'none';
  companyName?: string;
  industry?: string;
  employeeCount?: number;
  isCompany?: boolean;
}

export interface CreditBundle {
  id: string;
  name: string;
  credits: number;
  price: string;
  numericPrice: number;
  description: string;
  gradient: string;
  icon: string;
}

export interface BusinessPage {
  id: string;
  name: string;
  description: string;
  location: string;
  industry: string;
  employeeCount: number;
  logo: string;
  logoType: 'image' | 'video';
  coverImage: string;
  coverType: 'image' | 'video';
  ownerId: string;
}

export interface Comment {
  id: string;
  author: User;
  text: string;
  timestamp: number;
  parentId?: string;
  reactions?: Record<string, number>;
  userReactions?: string[];
}

export enum EnergyType {
  HIGH_ENERGY = '⚡ High Energy',
  CALM = '🌿 Calm',
  DEEP_DIVE = '💡 Deep Dive',
  NEUTRAL = '🪐 Neutral'
}

export interface Post {
  id: string;
  author: User;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
  energy: EnergyType;
  radiance: number; 
  timestamp: number;
  reactions: Record<string, number>;
  userReactions?: string[];
  comments: Comment[];
  isBoosted?: boolean;
}

export type AdPlacement = 'feed' | 'left' | 'right';

export interface Ad {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerAvatarType?: 'image' | 'video';
  headline: string;
  description: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  ctaText: string;
  ctaLink: string;
  isSponsored: true;
  placement: AdPlacement;
  status: 'active' | 'cancelled';
  expiryDate?: number;
  subscriptionTier?: string;
  reactions?: Record<string, number>;
  userReactions?: string[];
}

export interface AdPackage {
  id: string;
  name: string;
  durationDays: number;
  price: string;
  numericPrice: number;
  features: string[];
  gradient: string;
  subtitle: string;
  adLimit: number;
  idealFor: string;
}

export interface Notification {
  id: string;
  type: 'reaction' | 'comment' | 'link' | 'credit_received' | 'boost_received' | 'connection_request';
  fromUser: User;
  message: string;
  timestamp: number;
  isRead: boolean;
  postId?: string;
  connectionId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}
