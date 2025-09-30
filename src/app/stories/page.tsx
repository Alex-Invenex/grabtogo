'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share,
  Eye,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

interface Story {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorAvatar: string;
  title: string;
  content: {
    type: 'image' | 'video' | 'text';
    url?: string;
    text?: string;
    duration?: number;
  }[];
  createdAt: string;
  expiresAt: string;
  views: number;
  likes: number;
  comments: number;
  isViewed: boolean;
  isLiked: boolean;
}

interface StoryViewerProps {
  stories: Story[];
  currentStoryIndex: number;
  currentContentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

function StoryViewer({
  stories,
  currentStoryIndex,
  currentContentIndex,
  onClose,
  onNext,
  onPrevious,
}: StoryViewerProps) {
  const [progress, setProgress] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [showInput, setShowInput] = React.useState(false);
  const [comment, setComment] = React.useState('');

  const currentStory = stories[currentStoryIndex];
  const currentContent = currentStory?.content[currentContentIndex];
  const duration = currentContent?.duration || 5000;

  React.useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          onNext();
          return 0;
        }
        return prev + 100 / (duration / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, isPaused, onNext]);

  React.useEffect(() => {
    setProgress(0);
  }, [currentStoryIndex, currentContentIndex]);

  const handleLike = () => {
    // Implement like functionality
    console.log('Liked story:', currentStory.id);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Shared story:', currentStory.id);
  };

  const handleComment = () => {
    if (comment.trim()) {
      console.log('Comment on story:', currentStory.id, comment);
      setComment('');
      setShowInput(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours < 1 ? 'now' : `${hours}h ago`;
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Story progress bars */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex space-x-1">
          {currentStory.content.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width:
                    index < currentContentIndex
                      ? '100%'
                      : index === currentContentIndex
                        ? `${progress}%`
                        : '0%',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Story header */}
      <div className="absolute top-8 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8 border-2 border-white">
            <AvatarImage src={currentStory.vendorAvatar} alt={currentStory.vendorName} />
            <AvatarFallback>{currentStory.vendorName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-medium text-sm">{currentStory.vendorName}</p>
            <p className="text-white/70 text-xs">{formatTimeAgo(currentStory.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Story content */}
      <div
        className="w-full h-full relative"
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
      >
        {currentContent?.type === 'image' && (
          <img
            src={currentContent.url}
            alt="Story content"
            className="w-full h-full object-cover"
          />
        )}
        {currentContent?.type === 'video' && (
          <video
            src={currentContent.url}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
          />
        )}
        {currentContent?.type === 'text' && (
          <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-purple-600 to-blue-600">
            <p className="text-white text-2xl font-bold text-center">{currentContent.text}</p>
          </div>
        )}

        {/* Navigation areas */}
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full" onClick={onPrevious} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full" onClick={onNext} />
        </div>
      </div>

      {/* Story actions */}
      <div className="absolute bottom-20 left-4 right-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`text-white hover:bg-white/20 ${currentStory.isLiked ? 'text-red-500' : ''}`}
            >
              <Heart className={`h-5 w-5 ${currentStory.isLiked ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInput(true)}
              className="text-white hover:bg-white/20"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-white hover:bg-white/20"
            >
              <Share className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center space-x-2 text-white/70">
            <Eye className="h-4 w-4" />
            <span className="text-xs">{currentStory.views}</span>
          </div>
        </div>
      </div>

      {/* Comment input */}
      {showInput && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center space-x-2">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/50"
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
            />
            <Button onClick={handleComment} className="bg-white text-black hover:bg-white/90">
              Send
            </Button>
          </div>
        </div>
      )}

      {/* Navigation arrows for desktop */}
      <div className="hidden md:block">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

export default function StoriesPage() {
  const router = useRouter();
  const [stories, setStories] = React.useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = React.useState(0);
  const [currentContentIndex, setCurrentContentIndex] = React.useState(0);
  const [showViewer, setShowViewer] = React.useState(false);

  React.useEffect(() => {
    // Mock stories data
    const mockStories: Story[] = [
      {
        id: '1',
        vendorId: 'vendor1',
        vendorName: 'Fresh Fruits Co',
        vendorAvatar: '/api/placeholder/40/40',
        title: 'Fresh Mangoes Arrived!',
        content: [
          {
            type: 'image',
            url: '/api/placeholder/400/600',
            duration: 5000,
          },
          {
            type: 'text',
            text: 'Sweet & Juicy Alphonso Mangoes 🥭\n\nFresh from our farm to your table!',
            duration: 4000,
          },
        ],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
        views: 156,
        likes: 23,
        comments: 8,
        isViewed: false,
        isLiked: false,
      },
      {
        id: '2',
        vendorId: 'vendor2',
        vendorName: 'TechZone India',
        vendorAvatar: '/api/placeholder/40/40',
        title: 'New Earbuds Launch',
        content: [
          {
            type: 'image',
            url: '/api/placeholder/400/600',
            duration: 5000,
          },
          {
            type: 'text',
            text: '🎧 Premium Wireless Earbuds\n\n✨ Noise Cancellation\n🔋 24Hr Battery\n💧 IPX7 Waterproof',
            duration: 6000,
          },
        ],
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
        views: 89,
        likes: 12,
        comments: 3,
        isViewed: true,
        isLiked: true,
      },
      {
        id: '3',
        vendorId: 'vendor3',
        vendorName: 'EcoWear',
        vendorAvatar: '/api/placeholder/40/40',
        title: 'Sustainable Fashion',
        content: [
          {
            type: 'image',
            url: '/api/placeholder/400/600',
            duration: 5000,
          },
          {
            type: 'text',
            text: '🌱 100% Organic Cotton\n♻️ Eco-Friendly Dyes\n🌍 Sustainable Fashion',
            duration: 5000,
          },
        ],
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
        views: 234,
        likes: 45,
        comments: 12,
        isViewed: false,
        isLiked: false,
      },
    ];
    setStories(mockStories);
  }, []);

  const handleStoryClick = (index: number) => {
    setCurrentStoryIndex(index);
    setCurrentContentIndex(0);
    setShowViewer(true);
  };

  const handleNext = () => {
    const currentStory = stories[currentStoryIndex];
    if (currentContentIndex < currentStory.content.length - 1) {
      setCurrentContentIndex(currentContentIndex + 1);
    } else if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setCurrentContentIndex(0);
    } else {
      setShowViewer(false);
    }
  };

  const handlePrevious = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(currentContentIndex - 1);
    } else if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setCurrentContentIndex(stories[currentStoryIndex - 1].content.length - 1);
    }
  };

  const handleClose = () => {
    setShowViewer(false);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours < 1 ? 'now' : `${hours}h`;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Vendor Stories</h1>
          <p className="text-muted-foreground">See what's new from your favorite vendors</p>
        </div>

        {/* Stories grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story, index) => (
            <div
              key={story.id}
              onClick={() => handleStoryClick(index)}
              className="relative group cursor-pointer"
            >
              <div
                className={`relative rounded-lg overflow-hidden aspect-[3/4] ${
                  story.isViewed ? 'ring-2 ring-gray-300' : 'ring-2 ring-primary'
                }`}
              >
                {story.content[0]?.type === 'image' && (
                  <img
                    src={story.content[0].url}
                    alt={story.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
                {story.content[0]?.type === 'text' && (
                  <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 to-blue-600">
                    <p className="text-white text-sm font-medium text-center">
                      {story.content[0].text}
                    </p>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Vendor info */}
                <div className="absolute top-3 left-3">
                  <Avatar className="h-8 w-8 border-2 border-white">
                    <AvatarImage src={story.vendorAvatar} alt={story.vendorName} />
                    <AvatarFallback>{story.vendorName[0]}</AvatarFallback>
                  </Avatar>
                </div>

                {/* Story info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-medium text-sm truncate">{story.vendorName}</p>
                  <p className="text-white/70 text-xs">{formatTimeAgo(story.createdAt)}</p>
                </div>

                {/* Stats */}
                <div className="absolute top-3 right-3">
                  <div className="flex items-center space-x-1 text-white/70">
                    <Eye className="h-3 w-3" />
                    <span className="text-xs">{story.views}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {stories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No stories yet</h3>
            <p className="text-muted-foreground">
              Check back later for updates from your favorite vendors
            </p>
          </div>
        )}
      </div>

      {/* Story viewer */}
      {showViewer && (
        <StoryViewer
          stories={stories}
          currentStoryIndex={currentStoryIndex}
          currentContentIndex={currentContentIndex}
          onClose={handleClose}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}
    </div>
  );
}
