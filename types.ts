
export interface BookIdea {
  id: string;
  title: string;
  synopsis: string;
}

export interface ChapterConnection {
  targetId: string;
  description: string;
}

export interface Chapter {
  id: string;
  chapterTitle: string;
  chapterDescription: string;
  connections: ChapterConnection[];
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

// FIX: Added missing type definitions for SubscriptionTier, UserProfile, and Plan to resolve TypeScript errors.
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

export interface ContentHistory {
  past: string[];
  present: string;
  future: string[];
}

export interface RevisedChapter {
  chapterTitle: string;
  revisedContent: string;
}

export interface Project {
  id: string;
  name: string;
  lastModified: number;
  idea: BookIdea;
  chapters: Chapter[];
  // Storing Map as an array of key-value pairs for JSON serialization
  chapterContents: [string, ContentHistory][];
  coverImageBase64: string | null;
  genre: string;
  favoriteTopics: string[];
  amazonKdpDetails: AmazonKDPDetails | null;
}