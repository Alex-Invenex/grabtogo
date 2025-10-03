'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Eye, Trash2, Loader2, Image as ImageIcon, Play, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';

interface Story {
  id: string;
  type: 'image' | 'video';
  mediaUrl: string;
  caption?: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  viewCount: number;
  productIds: string[];
}

export default function VendorStoriesPage() {
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories?activeOnly=false');
      if (!response.ok) throw new Error('Failed to fetch stories');

      const data = await response.json();
      // Extract stories from vendor stories
      const allStories = data.data.flatMap((vendor: any) => vendor.stories);
      setStories(allStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load stories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!storyToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/stories/${storyToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete story');

      toast({
        title: 'Success',
        description: 'Story deleted successfully',
      });

      setDeleteDialogOpen(false);
      setStoryToDelete(null);
      fetchStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete story',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff < 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading stories...</p>
        </div>
      </div>
    );
  }

  const activeStories = stories.filter((s) => !isExpired(s.expiresAt));
  const expiredStories = stories.filter((s) => isExpired(s.expiresAt));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stories</h1>
          <p className="text-gray-600 mt-1">Share updates with your customers (24-hour duration)</p>
        </div>
        <Link href="/vendor/stories/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Story
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stories</p>
                <p className="text-2xl font-bold">{stories.length}</p>
              </div>
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeStories.length}</p>
              </div>
              <Clock className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-primary">
                  {stories.reduce((sum, s) => sum + s.viewCount, 0).toLocaleString()}
                </p>
              </div>
              <Eye className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Views</p>
                <p className="text-2xl font-bold">
                  {stories.length > 0
                    ? Math.round(stories.reduce((sum, s) => sum + s.viewCount, 0) / stories.length)
                    : 0}
                </p>
              </div>
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Stories */}
      {activeStories.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Stories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {activeStories.map((story) => (
              <Card key={story.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                <div className="relative aspect-[9/16]">
                  {story.type === 'image' ? (
                    <img
                      src={story.mediaUrl}
                      alt={story.caption || 'Story'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full bg-black">
                      <video
                        src={story.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white opacity-80" />
                      </div>
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                      {story.caption && (
                        <p className="text-white text-xs line-clamp-2">{story.caption}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-white text-xs">
                          <Eye className="w-3 h-3" />
                          {story.viewCount}
                        </div>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStoryToDelete(story.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Time Badge */}
                  <Badge className="absolute top-2 right-2 text-xs">
                    {getTimeRemaining(story.expiresAt)}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Expired Stories */}
      {expiredStories.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Expired Stories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {expiredStories.map((story) => (
              <Card key={story.id} className="overflow-hidden opacity-60">
                <div className="relative aspect-[9/16]">
                  {story.type === 'image' ? (
                    <img
                      src={story.mediaUrl}
                      alt={story.caption || 'Story'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full bg-black">
                      <video
                        src={story.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                    </div>
                  )}

                  {/* Expired Badge */}
                  <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                    Expired
                  </Badge>

                  {/* Views */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs bg-black/50 px-2 py-1 rounded">
                    <Eye className="w-3 h-3" />
                    {story.viewCount}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stories.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No stories yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first story to engage with customers
              </p>
              <Link href="/vendor/stories/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Story
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your story.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStory}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
