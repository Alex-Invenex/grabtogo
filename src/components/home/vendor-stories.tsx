'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

export function VendorStories() {
  const [stories, setStories] = React.useState<Story[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch('/api/stories?activeOnly=true&limit=20');
        if (!response.ok) throw new Error('Failed to fetch stories');

        const result = await response.json();
        const flatStories: Story[] = [];

        if (result.data && Array.isArray(result.data)) {
          result.data.forEach((vendorGroup: any) => {
            if (vendorGroup.stories && Array.isArray(vendorGroup.stories)) {
              vendorGroup.stories.forEach((story: any) => {
                flatStories.push({
                  id: story.id,
                  vendorId: story.vendorId,
                  vendor: {
                    id: vendorGroup.vendor.id,
                    name: vendorGroup.vendor.name,
                    profileImage: vendorGroup.vendor.profile?.logoUrl,
                  },
                  mediaUrl: story.mediaUrl,
                  mediaType: story.type === 'video' ? 'video' : 'image',
                  caption: story.caption,
                  createdAt: story.createdAt,
                  expiresAt: story.expiresAt,
                  viewCount: story.viewCount || 0,
                  isViewed: false,
                });
              });
            }
          });
        }

        setStories(flatStories);
      } catch (error) {
        console.error('[VendorStories] Error:', error);
        setStories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section className="py-8 bg-gradient-to-br from-gray-50 via-white to-primary/5">
      <div className="container-custom">
        <h2 className="text-2xl font-bold mb-6">Vendor Stories</h2>

        {loading ? (
          <p className="text-gray-500">Loading stories...</p>
        ) : stories.length === 0 ? (
          <p className="text-gray-500">No vendor stories available at the moment. Check back soon!</p>
        ) : (
          <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide">
          {stories.map((story) => (
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
        )}
      </div>
    </section>
  );
}
