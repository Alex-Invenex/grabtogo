'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { StorySkeleton } from '@/components/ui/loading-states';
import { Sparkles, Play } from 'lucide-react';

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

interface VendorStoriesModernProps {
  stories?: Story[];
  loading?: boolean;
}

export function VendorStoriesModern({ stories = [], loading = false }: VendorStoriesModernProps) {
  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="container-custom">
          <h2 className="mb-6 text-3xl font-bold">Vendor Stories</h2>
          <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide">
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

  if (stories.length === 0) {
    return (
      <section className="py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Vendor Stories</h2>
              <p className="text-gray-600 mt-1">Discover what's happening with local vendors</p>
            </div>
            <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
          </div>
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No vendor stories available at the moment. Check back soon!</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 fade-in-up">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Vendor Stories</h2>
            <p className="text-gray-600">Discover what's happening with local vendors</p>
          </div>
          <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
        </div>

        {/* Stories Scroll Container */}
        <div className="relative">
          <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide">
            {stories.map((story, index) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="flex-shrink-0 group story-card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative">
                  {/* Story Avatar Ring */}
                  <div className={`relative p-1 rounded-full bg-gradient-to-tr ${
                    story.isViewed
                      ? 'from-gray-300 to-gray-400'
                      : 'from-orange-500 via-pink-500 to-purple-600'
                  } hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl`}>
                    <div className="bg-white p-1 rounded-full">
                      <Avatar className="w-20 h-20 border-2 border-white">
                        <AvatarImage
                          src={story.vendor.profileImage || ''}
                          alt={story.vendor.name}
                        />
                        <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-orange-400 to-pink-500 text-white">
                          {story.vendor.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  {/* Play Icon for Videos */}
                  {story.mediaType === 'video' && (
                    <div className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-1.5 shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}

                  {/* Unviewed Indicator */}
                  {!story.isViewed && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white animate-pulse"></div>
                  )}
                </div>

                {/* Vendor Name */}
                <div className="mt-3 text-center max-w-[88px]">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                    {story.vendor.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Scroll Indicators */}
          <div className="absolute left-0 top-0 bottom-6 w-12 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-6 w-12 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none"></div>
        </div>

        {/* View All Link */}
        <div className="text-center mt-6 fade-in animation-delay-400">
          <Link
            href="/stories"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold group transition-all duration-300"
          >
            View All Stories
            <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
