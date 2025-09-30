'use client';

import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { Upload, Image, Type, X, Camera } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function LogoBrandingStep() {
  const { control, setValue, watch } = useFormContext();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Watch form fields (unused but kept for future use)
  // const logo = watch('logo')
  // const banner = watch('banner')
  const tagline = watch('tagline');

  const handleImageUpload = (
    file: File | null,
    fieldName: 'logo' | 'banner',
    setPreview: (url: string | null) => void
  ) => {
    if (!file) {
      setValue(fieldName, null);
      setPreview(null);
      return;
    }

    setValue(fieldName, file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Logo & Branding</h2>
        <p className="text-gray-600 mt-1">Create your brand identity</p>
      </div>

      <div className="space-y-6">
        <FormField
          control={control}
          name="logo"
          render={() => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Business Logo <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <div>
                  {!logoPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Image className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload logo</span>
                        </p>
                        <p className="text-xs text-gray-500">Square image (min 500x500px)</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG (MAX. 2MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={(e) =>
                          handleImageUpload(e.target.files?.[0] || null, 'logo', setLogoPreview)
                        }
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <div className="w-48 h-48 mx-auto relative group">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-cover rounded-lg border-2 border-gray-300"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setValue('logo', null);
                              setLogoPreview(null);
                            }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                      <p className="text-center text-sm text-gray-500 mt-2">
                        Your logo will be displayed as shown above
                      </p>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="banner"
          render={() => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Store Banner (Optional)
              </FormLabel>
              <FormControl>
                <div>
                  {!bannerPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Upload banner image</span>
                        </p>
                        <p className="text-xs text-gray-500">Recommended: 1920x400px (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={(e) =>
                          handleImageUpload(e.target.files?.[0] || null, 'banner', setBannerPreview)
                        }
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setValue('banner', null);
                          setBannerPreview(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
            {bannerPreview && (
              <img src={bannerPreview} alt="Banner" className="w-full h-24 object-cover" />
            )}
            <div className="p-4 flex items-center gap-4">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
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
