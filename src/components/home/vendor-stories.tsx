'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { StorySkeleton } from '@/components/ui/loading-states';

interface Story {
  id: string;
  vendorId: string;
  vendor: {
    id: string;
    name: string;
    profileImage?: string;
  };
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  isViewed?: boolean;
}

interface VendorStoriesProps {
  stories?: Story[];
  loading?: boolean;
}

export function VendorStories({ stories = [], loading = false }: VendorStoriesProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="py-8">
        <div className="container">
          <h2 className="mb-6 text-2xl font-bold">Vendor Stories</h2>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0">
                <StorySkeleton />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="py-8">
        <div className="container">
          <h2 className="mb-6 text-2xl font-bold">Vendor Stories</h2>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0">
                <StorySkeleton />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Mock data for demonstration
  const mockStories: Story[] =
    stories.length > 0
      ? stories
      : [
          {
            id: '1',
            vendorId: 'vendor1',
            vendor: {
              id: 'vendor1',
              name: 'Fresh Fruits Co',
              profileImage: undefined,
            },
            mediaUrl: '/api/placeholder/150/150',
            mediaType: 'image',
            caption: 'Fresh mangoes just arrived!',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
            viewCount: 156,
            isViewed: false,
          },
          {
            id: '2',
            vendorId: 'vendor2',
            vendor: {
              id: 'vendor2',
              name: "Baker's Delight",
              profileImage: undefined,
            },
            mediaUrl: '/api/placeholder/150/150',
            mediaType: 'image',
            caption: "Today's special: Chocolate croissants",
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
            viewCount: 89,
            isViewed: true,
          },
          {
            id: '3',
            vendorId: 'vendor3',
            vendor: {
              id: 'vendor3',
              name: 'Tech Gadgets',
              profileImage: undefined,
            },
            mediaUrl: '/api/placeholder/150/150',
            mediaType: 'video',
            caption: 'New smartphone accessories in stock',
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
            viewCount: 234,
            isViewed: false,
          },
          {
            id: '4',
            vendorId: 'vendor4',
            vendor: {
              id: 'vendor4',
              name: 'Fashion Hub',
              profileImage: undefined,
            },
            mediaUrl: '/api/placeholder/150/150',
            mediaType: 'image',
            caption: 'Summer collection now available',
            createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString(),
            viewCount: 178,
            isViewed: false,
          },
        ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-extrabold text-xl">📱</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Vendor Stories</h2>
              <p className="text-gray-600">See what's happening now</p>
            </div>
          </div>
          <Link
            href="/stories"
            className="text-primary font-semibold hover:text-primary/80 transition-colors"
          >
            View all
          </Link>
        </div>

        <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide">
          {mockStories.map((story) => (
            <Link key={story.id} href={`/stories/${story.id}`} className="flex-shrink-0 group">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  {/* Story Ring */}
                  <div
                    className={`relative p-1 rounded-full transition-all duration-300 ${
                      story.isViewed
                        ? 'bg-gray-300'
                        : 'bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 group-hover:scale-105'
                    }`}
                  >
                    {/* White Background Ring */}
                    <div className="rounded-full p-1 bg-white">
                      <Avatar className="h-20 w-20 border-2 border-white">
                        <AvatarImage src={story.vendor.profileImage} />
                        <AvatarFallback className="text-base font-bold bg-gradient-to-br from-primary to-orange-500 text-white">
                          {getInitials(story.vendor.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  {/* Media type indicator with better styling */}
                  {story.mediaType === 'video' && (
                    <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-gradient-to-br from-primary to-red-600 text-white flex items-center justify-center text-xs shadow-lg">
                      ▶
                    </div>
                  )}

                  {/* New indicator for unviewed stories */}
                  {!story.isViewed && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                  )}
                </div>

                {/* Vendor Name with better styling */}
                <div className="text-center max-w-[90px]">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {story.vendor.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {/* Enhanced Add story button */}
          <div className="flex-shrink-0">
            <Link
              href="/vendor/stories/create"
              className="flex flex-col items-center space-y-3 group"
            >
              <div className="relative">
                <div className="relative p-1 rounded-full border-2 border-dashed border-gray-300 group-hover:border-primary transition-all duration-300 group-hover:scale-105">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-primary/10 group-hover:to-orange-500/10 flex items-center justify-center transition-all duration-300">
                    <span className="text-3xl text-gray-400 group-hover:text-primary transition-colors">
                      +
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-center max-w-[90px]">
                <p className="text-sm font-semibold text-gray-600 group-hover:text-primary transition-colors">
                  Add Story
                </p>
              </div>
            </Link>
          </div>
        </div>

        {mockStories.length === 0 && !loading && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <p className="text-gray-900 font-semibold text-lg">No stories available right now</p>
              <p className="text-sm text-gray-600 mt-2">
                Check back later for updates from your favorite vendors
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
