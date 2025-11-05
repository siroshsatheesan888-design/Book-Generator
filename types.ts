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
