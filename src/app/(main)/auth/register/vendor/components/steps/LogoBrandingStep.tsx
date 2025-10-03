'use client';

import { useFormContext } from 'react-hook-form';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Image, Type, X, Camera, Loader2, Check } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { nanoid } from 'nanoid';

interface UploadState {
  progress: number;
  uploading: boolean;
  error: string | null;
}

export default function LogoBrandingStep() {
  const { control, setValue, watch } = useFormContext();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoUploadState, setLogoUploadState] = useState<UploadState>({ progress: 0, uploading: false, error: null });
  const [bannerUploadState, setBannerUploadState] = useState<UploadState>({ progress: 0, uploading: false, error: null });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Watch form fields to sync with state
  const logo = watch('logo');
  const banner = watch('banner');
  const tagline = watch('tagline');

  // Sync preview state with form values on mount
  useEffect(() => {
    if (logo && typeof logo === 'string' && !logoPreview) {
      setLogoPreview(logo);
    }
  }, [logo, logoPreview]);

  useEffect(() => {
    if (banner && typeof banner === 'string' && !bannerPreview) {
      setBannerPreview(banner);
    }
  }, [banner, bannerPreview]);

  const handleLogoUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] || null;

      if (!file) {
        setValue('logo', null);
        setLogoPreview(null);
        return;
      }

      // Validate file size (2MB max for logos)
      if (file.size > 2 * 1024 * 1024) {
        setLogoUploadState({ progress: 0, uploading: false, error: 'Logo must be less than 2MB' });
        event.target.value = '';
        return;
      }

      // Generate temporary vendor ID
      const tempVendorId = nanoid();

      // Set uploading state
      setLogoUploadState({ progress: 0, uploading: true, error: null });

      try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', 'logo');
        formData.append('vendorId', tempVendorId);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setLogoUploadState((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + Math.random() * 15, 90),
          }));
        }, 200);

        // Upload to API
        const response = await fetch('/api/vendor/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();

        // Store Supabase URL
        setValue('logo', result.url);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Complete upload
        setLogoUploadState({ progress: 100, uploading: false, error: null });
      } catch (error) {
        console.error('Logo upload error:', error);
        setLogoUploadState({
          progress: 0,
          uploading: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
        setValue('logo', null);
        setLogoPreview(null);
      }

      // Reset input
      event.target.value = '';
    },
    [setValue]
  );

  const handleBannerUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] || null;

      if (!file) {
        setValue('banner', null);
        setBannerPreview(null);
        return;
      }

      // Validate file size (5MB max for banners)
      if (file.size > 5 * 1024 * 1024) {
        setBannerUploadState({ progress: 0, uploading: false, error: 'Banner must be less than 5MB' });
        event.target.value = '';
        return;
      }

      // Generate temporary vendor ID
      const tempVendorId = nanoid();

      // Set uploading state
      setBannerUploadState({ progress: 0, uploading: true, error: null });

      try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', 'image');
        formData.append('vendorId', tempVendorId);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setBannerUploadState((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + Math.random() * 15, 90),
          }));
        }, 200);

        // Upload to API
        const response = await fetch('/api/vendor/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();

        // Store Supabase URL
        setValue('banner', result.url);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setBannerPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Complete upload
        setBannerUploadState({ progress: 100, uploading: false, error: null });
      } catch (error) {
        console.error('Banner upload error:', error);
        setBannerUploadState({
          progress: 0,
          uploading: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
        setValue('banner', null);
        setBannerPreview(null);
      }

      // Reset input
      event.target.value = '';
    },
    [setValue]
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Logo & Branding</h2>
        <p className="text-gray-600 mt-1">Upload to Supabase Storage and create your brand identity</p>
      </div>

      <div className="space-y-6">
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Business Logo <span className="text-red-500">*</span>
          </FormLabel>
          <FormControl>
            <div>
              {!logo && !logoPreview ? (
                <label
                  htmlFor="logo-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Image className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload logo</span>
                    </p>
                    <p className="text-xs text-gray-500">Square image (min 500x500px)</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG (MAX. 2MB)</p>
                  </div>
                  <input
                    id="logo-upload"
                    ref={logoInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoUpload}
                    disabled={logoUploadState.uploading}
                  />
                </label>
              ) : (
                <div className="relative">
                  <div className="w-48 h-48 mx-auto relative group">
                    <img
                      src={logoPreview || logo}
                      alt="Logo preview"
                      className="w-full h-full object-cover rounded-lg border-2 border-gray-300"
                    />
                    {!logoUploadState.uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setValue('logo', null);
                            setLogoPreview(null);
                            setLogoUploadState({ progress: 0, uploading: false, error: null });
                            if (logoInputRef.current) {
                              logoInputRef.current.value = '';
                            }
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                  {logoUploadState.uploading && (
                    <div className="mt-3 space-y-2">
                      <Progress value={logoUploadState.progress} className="h-2" />
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Uploading to Supabase... {logoUploadState.progress}%</span>
                      </div>
                    </div>
                  )}
                  {logoUploadState.progress === 100 && !logoUploadState.uploading && (
                    <div className="flex items-center justify-center gap-2 mt-2 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Uploaded to Supabase Storage</span>
                    </div>
                  )}
                  {logoUploadState.error && (
                    <div className="mt-2 text-center text-sm text-red-600">{logoUploadState.error}</div>
                  )}
                  {!logoUploadState.uploading && (
                    <p className="text-center text-sm text-gray-500 mt-2">
                      Your logo will be displayed as shown above
                    </p>
                  )}
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Store Banner (Optional)
          </FormLabel>
          <FormControl>
            <div>
              {!banner && !bannerPreview ? (
                <label
                  htmlFor="banner-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Upload banner image</span>
                    </p>
                    <p className="text-xs text-gray-500">Recommended: 1920x400px (MAX. 5MB)</p>
                  </div>
                  <input
                    id="banner-upload"
                    ref={bannerInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleBannerUpload}
                    disabled={bannerUploadState.uploading}
                  />
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={bannerPreview || banner}
                    alt="Banner preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {!bannerUploadState.uploading && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setValue('banner', null);
                        setBannerPreview(null);
                        setBannerUploadState({ progress: 0, uploading: false, error: null });
                        if (bannerInputRef.current) {
                          bannerInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  {bannerUploadState.uploading && (
                    <div className="mt-3 space-y-2">
                      <Progress value={bannerUploadState.progress} className="h-2" />
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Uploading to Supabase... {bannerUploadState.progress}%</span>
                      </div>
                    </div>
                  )}
                  {bannerUploadState.progress === 100 && !bannerUploadState.uploading && (
                    <div className="flex items-center justify-center gap-2 mt-2 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Uploaded to Supabase Storage</span>
                    </div>
                  )}
                  {bannerUploadState.error && (
                    <div className="mt-2 text-center text-sm text-red-600">{bannerUploadState.error}</div>
                  )}
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormField
          control={control}
          name="tagline"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Business Tagline (Optional)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a catchy tagline for your business..."
                  {...field}
                  maxLength={60}
                  className="resize-none"
                />
              </FormControl>
              <div className="flex justify-between text-sm text-gray-500">
                <span>A short phrase that describes your business</span>
                <span>{field.value?.length || 0}/60</span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preview Card */}
        <div className="p-6 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {(banner || bannerPreview) && (
              <img
                src={bannerPreview || banner}
                alt="Banner"
                className="w-full h-24 object-cover"
              />
            )}
            <div className="p-4 flex items-center gap-4">
              {logo || logoPreview ? (
                <img
                  src={logoPreview || logo}
                  alt="Logo"
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <h4 className="font-semibold text-lg">
                  {watch('companyName') || 'Your Business Name'}
                </h4>
                {tagline && <p className="text-sm text-gray-600 italic">"{tagline}"</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
