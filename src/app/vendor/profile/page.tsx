'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, MapPin, Clock, Globe, Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import GoogleMapsLocationPicker from '@/components/vendor/GoogleMapsLocationPicker';
import BusinessHoursEditor from '@/components/vendor/BusinessHoursEditor';
import SocialMediaLinks from '@/components/vendor/SocialMediaLinks';

const profileSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  tagline: z.string().max(100, 'Tagline must be less than 100 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),

  // Address
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pinCode: z.string().min(6, 'PIN code must be 6 digits'),
  landmark: z.string().optional(),

  // Location
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deliveryRadius: z.number().min(1, 'Delivery radius must be at least 1 km').max(50),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface BusinessHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  whatsapp?: string;
}

export default function VendorProfilePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [menuFiles, setMenuFiles] = useState<File[]>([]);
  const [brochureFiles, setBrochureFiles] = useState<File[]>([]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      deliveryRadius: 10,
    },
  });

  // Fetch vendor profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/vendor/profile');
        if (!response.ok) throw new Error('Failed to fetch profile');

        const data = await response.json();

        if (data.profile) {
          // Set form values
          form.reset({
            storeName: data.profile.storeName || '',
            tagline: data.profile.tagline || '',
            description: data.profile.description || '',
            phone: data.profile.phone || '',
            email: data.profile.email || '',
            website: data.profile.website || '',
            addressLine1: data.profile.addressLine1 || '',
            addressLine2: data.profile.addressLine2 || '',
            city: data.profile.city || '',
            state: data.profile.state || '',
            pinCode: data.profile.pinCode || '',
            landmark: data.profile.landmark || '',
            latitude: data.profile.latitude,
            longitude: data.profile.longitude,
            deliveryRadius: data.profile.deliveryRadius || 10,
          });

          // Set images
          if (data.profile.logoUrl) setLogoPreview(data.profile.logoUrl);
          if (data.profile.bannerUrl) setBannerPreview(data.profile.bannerUrl);

          // Set business hours
          if (data.profile.businessHours) {
            setBusinessHours(JSON.parse(data.profile.businessHours));
          }

          // Set social links
          if (data.profile.socialLinks) {
            setSocialLinks(JSON.parse(data.profile.socialLinks));
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [form, toast]);

  // Handle logo upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Logo file size must be less than 2MB',
          variant: 'destructive',
        });
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Handle banner upload
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Banner file size must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  // Handle location selection
  const handleLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    form.setValue('latitude', location.lat);
    form.setValue('longitude', location.lng);
    if (location.address) {
      // Parse address if provided by geocoder
      const parts = location.address.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        form.setValue('city', parts[parts.length - 3] || '');
        form.setValue('state', parts[parts.length - 2] || '');
        form.setValue('pinCode', parts[parts.length - 1] || '');
      }
    }
  };

  // Submit form
  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);

    try {
      // Upload images first if changed
      let logoUrl = logoPreview;
      let bannerUrl = bannerPreview;

      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);
        logoFormData.append('bucket', 'vendor-logos');

        const logoResponse = await fetch('/api/vendor/upload', {
          method: 'POST',
          body: logoFormData,
        });

        if (!logoResponse.ok) throw new Error('Failed to upload logo');
        const logoData = await logoResponse.json();
        logoUrl = logoData.url;
      }

      if (bannerFile) {
        const bannerFormData = new FormData();
        bannerFormData.append('file', bannerFile);
        bannerFormData.append('bucket', 'vendor-photos');

        const bannerResponse = await fetch('/api/vendor/upload', {
          method: 'POST',
          body: bannerFormData,
        });

        if (!bannerResponse.ok) throw new Error('Failed to upload banner');
        const bannerData = await bannerResponse.json();
        bannerUrl = bannerData.url;
      }

      // Save profile
      const profileData = {
        ...data,
        logoUrl,
        bannerUrl,
        businessHours: JSON.stringify(businessHours),
        socialLinks: JSON.stringify(socialLinks),
      };

      const response = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) throw new Error('Failed to save profile');

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your business information, location, and operating hours
          </p>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList>
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="location">Location & Hours</TabsTrigger>
              <TabsTrigger value="branding">Branding & Media</TabsTrigger>
              <TabsTrigger value="social">Social & Contact</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Details</CardTitle>
                  <CardDescription>
                    Basic information about your business
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="storeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your store name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tagline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tagline</FormLabel>
                          <FormControl>
                            <Input placeholder="Your store's catchphrase" {...field} />
                          </FormControl>
                          <FormDescription>
                            A short memorable phrase (max 100 characters)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>About Your Business</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell customers about your business..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe your products, services, and what makes you unique
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 98765 43210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="store@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://yourwebsite.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Location & Hours Tab */}
            <TabsContent value="location" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Address</CardTitle>
                  <CardDescription>
                    Your physical location and service area
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address Line 1 *</FormLabel>
                          <FormControl>
                            <Input placeholder="Street address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addressLine2"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl>
                            <Input placeholder="Apartment, suite, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="landmark"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Landmark</FormLabel>
                          <FormControl>
                            <Input placeholder="Nearby landmark" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="City name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <FormControl>
                            <Input placeholder="State name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pinCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PIN Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label className="mb-3 block">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Set Your Exact Location
                    </Label>
                    <GoogleMapsLocationPicker
                      onLocationSelect={handleLocationSelect}
                      initialLocation={
                        form.watch('latitude') && form.watch('longitude')
                          ? {
                              lat: form.watch('latitude')!,
                              lng: form.watch('longitude')!,
                            }
                          : undefined
                      }
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Drag the marker to your exact business location
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="deliveryRadius"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Radius (km) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          How far will you deliver from your location?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Clock className="w-5 h-5 inline mr-2" />
                    Business Hours
                  </CardTitle>
                  <CardDescription>
                    Set your operating hours for each day of the week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BusinessHoursEditor
                    businessHours={businessHours}
                    onChange={setBusinessHours}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding & Media Tab */}
            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Store Branding</CardTitle>
                  <CardDescription>
                    Upload your logo and banner images
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Upload */}
                  <div>
                    <Label className="mb-3 block">Store Logo</Label>
                    <div className="flex items-start gap-6">
                      {logoPreview ? (
                        <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="mb-2"
                        />
                        <p className="text-sm text-gray-500">
                          Recommended: Square image, at least 200x200px. Max 2MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Banner Upload */}
                  <div>
                    <Label className="mb-3 block">Store Banner</Label>
                    <div className="space-y-4">
                      {bannerPreview ? (
                        <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={bannerPreview}
                            alt="Banner preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerChange}
                          className="mb-2"
                        />
                        <p className="text-sm text-gray-500">
                          Recommended: 1200x400px. Max 5MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social & Contact Tab */}
            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Globe className="w-5 h-5 inline mr-2" />
                    Social Media Links
                  </CardTitle>
                  <CardDescription>
                    Connect your social media profiles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SocialMediaLinks
                    socialLinks={socialLinks}
                    onChange={setSocialLinks}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Sticky Save Button (Mobile) */}
          <div className="md:hidden fixed bottom-6 right-6 z-50">
            <Button
              type="submit"
              size="lg"
              className="shadow-lg"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
