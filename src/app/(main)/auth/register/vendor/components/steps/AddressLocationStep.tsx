'use client';

import { useFormContext } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { MapPin, Navigation, Home, Building2, Map, Milestone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { KERALA_CITIES } from '../../lib/constants';

export default function AddressLocationStep() {
  const { control, setValue, watch } = useFormContext();
  const [isLocating, setIsLocating] = useState(false);
  const [mapError, setMapError] = useState('');

  const coordinates = watch('coordinates');
  const deliveryRadius = watch('deliveryRadius') || 5;

  // Automatically set state to Kerala since we only operate there
  useEffect(() => {
    setValue('state', 'Kerala');
  }, [setValue]);

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    setMapError('');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('coordinates', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setValue('useCurrentLocation', true);
          setIsLocating(false);

          // Reverse geocoding would go here in production
          // For now, we&apos;ll just set a success message
        },
        () => {
          setMapError('Unable to get your location. Please enter manually.');
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      setMapError('Geolocation is not supported by your browser');
      setIsLocating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Business Address & Location</h2>
        <p className="text-gray-600 mt-1">Where is your business located in Kerala?</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="flex items-center gap-2"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} />
            {isLocating ? 'Getting location...' : 'Use Current Location'}
          </Button>
        </div>

        {coordinates && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-700 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location captured: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </p>
          </div>
        )}

        {mapError && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-700 text-sm">{mapError}</p>
          </div>
        )}

        <div className="relative h-[300px] bg-gray-100 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Map className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Interactive map will be displayed here</p>
              {coordinates && (
                <p className="text-sm text-gray-600 mt-2">
                  Location: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>
          {coordinates && (
            <div
              className="absolute inset-0 border-4 border-blue-300 rounded-full opacity-20 animate-pulse"
              style={{
                width: `${deliveryRadius * 20}px`,
                height: `${deliveryRadius * 20}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="addressLine1"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Address Line 1
                </FormLabel>
                <FormControl>
                  <Input placeholder="Street address, building name" {...field} className="h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="addressLine2"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Address Line 2 (Optional)
                </FormLabel>
                <FormControl>
                  <Input placeholder="Apartment, suite, floor" {...field} className="h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select city in Kerala" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {KERALA_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="pinCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PIN Code</FormLabel>
                <FormControl>
                  <Input placeholder="6-digit PIN" maxLength={6} {...field} className="h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="landmark"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Milestone className="w-4 h-4" />
                  Landmark (Optional)
                </FormLabel>
                <FormControl>
                  <Input placeholder="Near..." {...field} className="h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="deliveryRadius"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center justify-between">
                <span>Delivery Radius</span>
                <span className="font-bold text-blue-600">{field.value || 5} km</span>
              </FormLabel>
              <FormControl>
                <Slider
                  min={1}
                  max={10}
                  step={0.5}
                  value={[field.value || 5]}
                  onValueChange={(value) => field.onChange(value[0])}
                  className="mt-2"
                />
              </FormControl>
              <p className="text-sm text-gray-500 mt-1">
                Set the maximum distance for your delivery service
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
