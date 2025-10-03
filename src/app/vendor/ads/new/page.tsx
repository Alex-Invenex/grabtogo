'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Loader2, X, Megaphone, Calendar, DollarSign, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Link from 'next/link';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const AD_TYPE_PRICING = {
  HOMEPAGE_BANNER: { min: 500, perDay: 100, description: 'Premium banner on homepage' },
  SEARCH_AD: { min: 300, perDay: 50, description: 'Promoted listing in search results' },
  POPUP: { min: 200, perDay: 30, description: 'Popup advertisement' },
};

export default function NewAdCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [adType, setAdType] = useState<'HOMEPAGE_BANNER' | 'SEARCH_AD' | 'POPUP'>('HOMEPAGE_BANNER');
  const [targetUrl, setTargetUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dailyBudget, setDailyBudget] = useState('');

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Set default dates
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const weekLater = new Date(tomorrow);
    weekLater.setDate(weekLater.getDate() + 7);

    setStartDate(tomorrow.toISOString().slice(0, 16));
    setEndDate(weekLater.toISOString().slice(0, 16));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum size is 5MB',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const calculateDuration = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateTotalBudget = () => {
    const duration = calculateDuration();
    const daily = parseFloat(dailyBudget) || 0;
    return duration * daily;
  };

  const handlePayment = async (orderId: string, amount: number, campaignId: string) => {
    if (!scriptLoaded || !window.Razorpay) {
      toast({
        title: 'Payment system not ready',
        description: 'Please wait a moment and try again',
        variant: 'destructive',
      });
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      name: 'GrabtoGo',
      description: `Ad Campaign: ${title}`,
      order_id: orderId,
      handler: async function (response: any) {
        try {
          // Verify payment
          const verifyResponse = await fetch('/api/vendor/ads/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });

          if (!verifyResponse.ok) throw new Error('Payment verification failed');

          toast({
            title: 'Success',
            description: 'Campaign created and payment successful',
          });

          router.push('/vendor/ads');
        } catch (error) {
          console.error('Payment verification error:', error);
          toast({
            title: 'Payment verification failed',
            description: 'Please contact support',
            variant: 'destructive',
          });
        }
      },
      prefill: {
        name: '',
        email: '',
        contact: '',
      },
      theme: {
        color: '#10B981',
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a campaign title',
        variant: 'destructive',
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: 'Description required',
        description: 'Please enter a campaign description',
        variant: 'destructive',
      });
      return;
    }

    if (!targetUrl.trim()) {
      toast({
        title: 'Target URL required',
        description: 'Please enter a target URL for your ad',
        variant: 'destructive',
      });
      return;
    }

    if (!imageFile) {
      toast({
        title: 'Image required',
        description: 'Please upload an ad image',
        variant: 'destructive',
      });
      return;
    }

    const daily = parseFloat(dailyBudget);
    const minBudget = AD_TYPE_PRICING[adType].perDay;

    if (!daily || daily < minBudget) {
      toast({
        title: 'Invalid budget',
        description: `Minimum daily budget for ${adType} is ₹${minBudget}`,
        variant: 'destructive',
      });
      return;
    }

    const duration = calculateDuration();
    if (duration < 1) {
      toast({
        title: 'Invalid dates',
        description: 'End date must be after start date',
        variant: 'destructive',
      });
      return;
    }

    const totalBudget = calculateTotalBudget();
    const minTotal = AD_TYPE_PRICING[adType].min;

    if (totalBudget < minTotal) {
      toast({
        title: 'Budget too low',
        description: `Minimum total budget for ${adType} is ₹${minTotal}`,
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      // Upload image
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('bucket', 'ad-campaigns');

      const uploadResponse = await fetch('/api/vendor/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload image');

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.url;

      // Create campaign
      const campaignData = {
        title: title.trim(),
        description: description.trim(),
        adType,
        targetUrl: targetUrl.trim(),
        imageUrl,
        budget: totalBudget,
        dailyBudget: daily,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      };

      const response = await fetch('/api/vendor/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      const data = await response.json();

      // Initiate payment
      await handlePayment(data.orderId, totalBudget, data.campaignId);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create campaign',
        variant: 'destructive',
      });
      setCreating(false);
    }
  };

  const duration = calculateDuration();
  const totalBudget = calculateTotalBudget();
  const pricing = AD_TYPE_PRICING[adType];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vendor/ads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Ad Campaign</h1>
            <p className="text-gray-600 mt-1">Promote your business with targeted ads</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Basic information about your ad campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Summer Sale 2025"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your campaign..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="target-url">Target URL *</Label>
                <Input
                  id="target-url"
                  type="url"
                  placeholder="https://your-store-url.com"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Where should users go when they click your ad?
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ad Type */}
          <Card>
            <CardHeader>
              <CardTitle>Ad Type</CardTitle>
              <CardDescription>Choose where your ad will appear</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={adType} onValueChange={(value) => setAdType(value as any)}>
                {Object.entries(AD_TYPE_PRICING).map(([type, info]) => (
                  <div
                    key={type}
                    className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => setAdType(type as any)}
                  >
                    <RadioGroupItem value={type} id={type} />
                    <div className="flex-1">
                      <Label htmlFor={type} className="font-semibold cursor-pointer">
                        {type.replace(/_/g, ' ')}
                      </Label>
                      <p className="text-sm text-gray-600">{info.description}</p>
                      <p className="text-sm font-medium text-primary mt-1">
                        ₹{info.perDay}/day (Min: ₹{info.min} total)
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Ad Image */}
          <Card>
            <CardHeader>
              <CardTitle>Ad Image</CardTitle>
              <CardDescription>Upload an eye-catching image (1200x630px recommended)</CardDescription>
            </CardHeader>
            <CardContent>
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Ad Image</h3>
                    <p className="text-gray-600 mb-4">Maximum size: 5MB</p>
                    <label htmlFor="image-upload">
                      <Button type="button" onClick={() => document.getElementById('image-upload')?.click()}>
                        Choose File
                      </Button>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Ad preview"
                    className="w-full rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule & Budget */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Budget</CardTitle>
              <CardDescription>Set your campaign duration and budget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date *</Label>
                  <Input
                    id="start-date"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date *</Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="daily-budget">Daily Budget (₹) *</Label>
                <Input
                  id="daily-budget"
                  type="number"
                  min={pricing.perDay}
                  step="10"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                  placeholder={`Minimum ₹${pricing.perDay}`}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Minimum: ₹{pricing.perDay}/day
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Megaphone className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">Ad Type:</span>
                  <span className="font-medium ml-auto">{adType.replace(/_/g, ' ')}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium ml-auto">{duration} days</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">Daily Budget:</span>
                  <span className="font-medium ml-auto">₹{dailyBudget || 0}/day</span>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-gray-600">Total Budget:</span>
                    <span className="text-xl font-bold text-primary ml-auto">
                      ₹{totalBudget.toFixed(2)}
                    </span>
                  </div>
                </div>

                {totalBudget < pricing.min && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Minimum budget required: ₹{pricing.min}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button type="submit" className="w-full" disabled={creating || totalBudget < pricing.min}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Pay ₹{totalBudget.toFixed(2)} & Launch
                </>
              )}
            </Button>
            <Link href="/vendor/ads" className="block">
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
