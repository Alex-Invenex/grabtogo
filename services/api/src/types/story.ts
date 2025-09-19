export interface Story {
  id: string;
  vendorId: string;
  type: StoryType;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  duration: number; // in seconds
  isActive: boolean;
  viewCount: number;
  expiresAt: Date;
  createdAt: Date;
  vendor?: {
    id: string;
    companyName: string;
    address: string;
    categories: string[];
  };
}

export enum StoryType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export interface CreateStoryRequest {
  type: StoryType;
  mediaUrl: string;
  caption?: string;
  duration?: number; // defaults: 5s for image, video length for video
}

export interface StoryView {
  id: string;
  storyId: string;
  userId: string;
  viewedAt: Date;
}

export interface HomeStoryFeed {
  stories: Story[];
  hasMore: boolean;
  lastViewedStoryId?: string;
}