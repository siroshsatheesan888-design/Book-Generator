
export interface BookIdea {
  id: string;
  title: string;
  synopsis: string;
}

export interface Chapter {
  id: string;
  chapterTitle: string;
  chapterDescription: string;
}

export interface AmazonKDPDetails {
  description: string;
  keywords: string[];
  categories: string[];
}

export interface TrilogyBook {
  bookNumber: number;
  title: string;
  synopsis: string;
}

// FIX: Add missing type definitions for SubscriptionTier, UserProfile, and Plan to resolve TypeScript errors.
export type SubscriptionTier = 'free' | 'pro';

export interface UserProfile {
  id: string;
  email?: string;
  subscription_tier: SubscriptionTier;
  gemini_api_key?: string;
}

export interface Plan {
  id: SubscriptionTier;
  name: string;
  price: string;
  features: string[];
}
