'use client'

import * as React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { StorySkeleton } from '@/components/ui/loading-states'

interface Story {
  id: string
  vendorId: string
  vendor: {
    id: string
    name: string
    profileImage?: string
  }
  mediaUrl: string
  mediaType: 'image' | 'video'
  caption?: string
  createdAt: string
  expiresAt: string
  viewCount: number
  isViewed?: boolean
}

interface VendorStoriesProps {
  stories?: Story[]
  loading?: boolean
}

export function VendorStories({ stories = [], loading = false }: VendorStoriesProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

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
    )
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
    )
  }

  // Mock data for demonstration
  const mockStories: Story[] = stories.length > 0 ? stories : [
    {
      id: '1',
      vendorId: 'vendor1',
      vendor: {
        id: 'vendor1',
        name: 'Fresh Fruits Co',
        profileImage: undefined
      },
      mediaUrl: '/api/placeholder/150/150',
      mediaType: 'image',
      caption: 'Fresh mangoes just arrived!',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
      viewCount: 156,
      isViewed: false
    },
    {
      id: '2',
      vendorId: 'vendor2',
      vendor: {
        id: 'vendor2',
        name: 'Baker\'s Delight',
        profileImage: undefined
      },
      mediaUrl: '/api/placeholder/150/150',
      mediaType: 'image',
      caption: 'Today\'s special: Chocolate croissants',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
      viewCount: 89,
      isViewed: true
    },
    {
      id: '3',
      vendorId: 'vendor3',
      vendor: {
        id: 'vendor3',
        name: 'Tech Gadgets',
        profileImage: undefined
      },
      mediaUrl: '/api/placeholder/150/150',
      mediaType: 'video',
      caption: 'New smartphone accessories in stock',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
      viewCount: 234,
      isViewed: false
    },
    {
      id: '4',
      vendorId: 'vendor4',
      vendor: {
        id: 'vendor4',
        name: 'Fashion Hub',
        profileImage: undefined
      },
      mediaUrl: '/api/placeholder/150/150',
      mediaType: 'image',
      caption: 'Summer collection now available',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString(),
      viewCount: 178,
      isViewed: false
    }
  ]

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <section className="py-8 bg-muted/30">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Vendor Stories</h2>
          <Link
            href="/stories"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4">
          {mockStories.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              className="flex-shrink-0 group"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`relative p-0.5 rounded-full ${
                  story.isViewed
                    ? 'bg-muted'
                    : 'bg-gradient-to-tr from-primary to-secondary'
                }`}>
                  <div className="rounded-full p-0.5 bg-background">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={story.vendor.profileImage} />
                      <AvatarFallback className="text-sm">
                        {getInitials(story.vendor.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Media type indicator */}
                  {story.mediaType === 'video' && (
                    <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                      ▶
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-xs font-medium truncate w-20">
                    {story.vendor.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {/* Add story button for vendors */}
          <div className="flex-shrink-0">
            <Link
              href="/vendor/stories/create"
              className="flex flex-col items-center space-y-2 group"
            >
              <div className="relative p-0.5 rounded-full border-2 border-dashed border-muted-foreground group-hover:border-primary transition-colors">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <span className="text-2xl text-muted-foreground group-hover:text-primary">+</span>
                </div>
              </div>
              <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                Add Story
              </p>
            </Link>
          </div>
        </div>

        {mockStories.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No stories available right now</p>
              <p className="text-sm text-muted-foreground mt-2">
                Check back later for updates from your favorite vendors
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}