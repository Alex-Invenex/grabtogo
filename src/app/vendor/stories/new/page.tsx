'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Image as ImageIcon, Video, Loader2, X, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
}

export default function NewStoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  // Form state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Fetch vendor products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?vendorOnly=true');
        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image or video file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 50MB for videos, 10MB for images)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `Maximum size is ${isVideo ? '50MB' : '10MB'}`,
        variant: 'destructive',
      });
      return;
    }

    setMediaType(isImage ? 'image' : 'video');
    setMediaFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const toggleProductTag = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mediaFile) {
      toast({
        title: 'Media required',
        description: 'Please upload an image or video',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      // Upload media to Supabase
      const formData = new FormData();
      formData.append('file', mediaFile);
      formData.append('bucket', 'vendor-stories');

      const uploadResponse = await fetch('/api/vendor/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload media');

      const uploadData = await uploadResponse.json();
      const mediaUrl = uploadData.url;

      // Create story
      const storyData = {
        type: mediaType,
        mediaUrl,
        caption: caption.trim() || null,
        productIds: selectedProductIds,
      };

      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create story');
      }

      toast({
        title: 'Success',
        description: 'Story created successfully',
      });

      router.push('/vendor/stories');
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create story',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vendor/stories">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Story</h1>
            <p className="text-gray-600 mt-1">Share a 24-hour story with your customers</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media Upload */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Story Media</CardTitle>
              <CardDescription>Upload an image or video (9:16 aspect ratio recommended)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!mediaPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                      <Video className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Upload Story Media
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Images up to 10MB, Videos up to 50MB
                    </p>
                    <label htmlFor="media-upload">
                      <Button type="button" onClick={() => document.getElementById('media-upload')?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </Button>
                    </label>
                    <input
                      id="media-upload"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaChange}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden max-w-md mx-auto">
                    {mediaType === 'image' ? (
                      <img
                        src={mediaPreview}
                        alt="Story preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={mediaPreview}
                        controls
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-4 right-4"
                    onClick={handleRemoveMedia}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Caption */}
          <Card>
            <CardHeader>
              <CardTitle>Caption</CardTitle>
              <CardDescription>Add a caption to your story (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={200}
                rows={3}
                className="resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">{caption.length}/200 characters</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Story Details */}
          <Card>
            <CardHeader>
              <CardTitle>Story Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Duration</Label>
                <p className="text-sm text-gray-600">24 hours</p>
              </div>
              <div>
                <Label>Type</Label>
                <p className="text-sm text-gray-600 capitalize">{mediaType || 'Not selected'}</p>
              </div>
              <div>
                <Label>Tagged Products</Label>
                <p className="text-sm text-gray-600">{selectedProductIds.length} selected</p>
              </div>
            </CardContent>
          </Card>

          {/* Product Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tag Products</CardTitle>
              <CardDescription>Link products to your story</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-sm">No products available</p>
                  <Link href="/vendor/products/new">
                    <Button variant="link" className="mt-2">Add Products</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedProductIds.includes(product.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleProductTag(product.id)}
                    >
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-sm text-gray-600">₹{product.price.toFixed(2)}</p>
                      </div>
                      {selectedProductIds.includes(product.id) && (
                        <Badge>Tagged</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button type="submit" className="w-full" disabled={creating || !mediaFile}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Story...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Create Story
                </>
              )}
            </Button>
            <Link href="/vendor/stories" className="block">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
