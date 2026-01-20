
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  handle: string;
  avatar: string;
  avatarKey?: string;
  avatarType?: 'image' | 'video';
  coverImage?: string; 
  coverKey?: string;
  coverType?: 'image' | 'video';
  bio?: string;
  dob?: string;
  zodiacSign?: string;
  email?: string;
  phone?: string;
  country?: string;
  acquaintances?: string[]; 
  sentAcquaintanceRequests?: string[];
  notifications?: Notification[];
  blockedUsers?: string[];
  profileViews?: string[];
  isPrivate?: boolean;
  trustScore: number; 
  auraCredits: number;
  activeGlow?: 'emerald' | 'cyan' | 'amber' | 'none';
  companyName?: string;
  companyWebsite?: string;
  industry?: string;
  employeeCount?: number;
  isCompany?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
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
  taggedUserIds?: string[];
}

export enum EnergyType {
  HIGH_ENERGY = '⚡ High Energy',
  CALM = '🌿 Calm',
  DEEP_DIVE = '💡 Deep Dive',
  NEUTRAL = '🪐 Neutral',
  MOTIVATED = '🔥 Motivated',
  VENTING = '😔 Venting',
  HEALING = '🤍 Healing',
  CELEBRATING = '🎉 Celebrating',
  THINKING_OUT_LOUD = '🤔 Thinking out loud'
}

export interface MediaItemMetrics {
  views: number;
  clicks: number;
  saves: number;
  dwellMs: number;
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  key?: string;
  mimeType?: string;
  size?: number;
  caption?: string;
  headline?: string;
  order?: number;
  metrics?: MediaItemMetrics;
}

export interface Post {
  id: string;
  author: User;
  authorId?: string;
  ownerId?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
  mediaKey?: string;
  mediaMimeType?: string;
  mediaSize?: number;
  mediaItems?: MediaItem[];
  energy: EnergyType;
  radiance: number; 
  timestamp: number;
  reactions: Record<string, number>;
  userReactions?: string[];
  comments: Comment[];
  commentCount?: number;
  isBoosted?: boolean;
  hashtags?: string[];
   viewCount?: number;
  visibility?: 'public' | 'acquaintances' | 'private';
  isBirthdayPost?: boolean;
  // Time Capsule fields
  isTimeCapsule?: boolean;
  unlockDate?: number; // timestamp when the post becomes visible
  isUnlocked?: boolean; // whether the post is currently visible
  timeCapsuleType?: 'personal' | 'group';
  invitedUsers?: string[]; // user IDs for group time capsules
  timeCapsuleTitle?: string; // custom title for the time capsule
  taggedUserIds?: string[];
  sharedFrom?: {
    postId: string;
    originalAuthor: string;
    originalContent: string;
    originalUrl?: string;
    hashtags?: string[];
  };
  isSystemPost?: boolean;
  systemType?: string;
  visibility?: 'public' | 'acquaintances' | 'private';
  sharedAt?: string;
}

export type AdPlacement = 'feed' | 'left' | 'right';

export interface Ad {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerAvatarType?: 'image' | 'video';
  ownerEmail?: string; // For special user detection
  headline: string;
  description: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  mediaKey?: string;
  mediaMimeType?: string;
  mediaSize?: number;
  ctaText: string;
  ctaLink: string;
  isSponsored: true;
  placement: AdPlacement;
  status: 'active' | 'cancelled';
  expiryDate?: number;
  subscriptionTier?: string;
  subscriptionId?: string; // Link to AdSubscription
  reactions?: Record<string, number>;
  reactionUsers?: Record<string, string[]>;
  userReactions?: string[];
  hashtags?: string[];
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
  paymentType?: 'one-time' | 'subscription';
  subscriptionPlanId?: string;
}

export interface AdSubscription {
  id: string;
  userId: string;
  packageId: string;
  packageName: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: number;
  endDate?: number;
  nextBillingDate?: number;
  paypalSubscriptionId?: string;
  adsUsed: number;
  adLimit: number;
  createdAt: number;
  updatedAt: number;
}

export interface Notification {
  id: string;
  type: 'reaction' | 'comment' | 'link' | 'credit_received' | 'boost_received' | 'connection_request' | 'acquaintance_request' | 'acquaintance_accepted' | 'acquaintance_rejected' | 'profile_view'
  | 'share'
  | 'like'
  | 'message'
  | 'time_capsule_unlocked';
  fromUser: User;
  message: string;
  timestamp: number;
  isRead: boolean;
  postId?: string;
  connectionId?: string;
}

// Ensure Message interface is exported properly
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  isRead?: boolean;
  messageType?: 'text' | 'image' | 'file';
  mediaUrl?: string;
  replyTo?: string;
  isEdited?: boolean;
  editedAt?: number;
}
