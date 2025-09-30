'use client';

import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { Star, Check, X, Plus } from 'lucide-react';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PACKAGES, ADD_ONS } from '../../lib/constants';

export default function PackageSelectionStep() {
  const { control, setValue, watch } = useFormContext();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const selectedPackage = watch('selectedPackage');
  const addOns = watch('addOns') || [];

  const handlePackageSelect = (packageId: string) => {
    setValue('selectedPackage', packageId);
    setValue('billingCycle', billingCycle);
  };

  const handleAddOnToggle = (addOnId: string, checked: boolean) => {
    const currentAddOns = addOns || [];
    const newAddOns = checked
      ? [...currentAddOns, addOnId]
      : currentAddOns.filter((id: string) => id !== addOnId);
    setValue('addOns', newAddOns);
  };

  const calculateTotal = () => {
    if (!selectedPackage) return 0;

    const packagePrice =
      billingCycle === 'yearly'
        ? PACKAGES[selectedPackage as keyof typeof PACKAGES].yearly
        : PACKAGES[selectedPackage as keyof typeof PACKAGES].monthly;

    const addOnTotal = addOns.reduce((total: number, addOnId: string) => {
      const addOn = ADD_ONS.find((a) => a.id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);

    return packagePrice + addOnTotal;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Select Your Package</h2>
        <p className="text-gray-600 mt-1">Choose the plan that fits your business needs</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span
          className={`text-sm ${billingCycle === 'monthly' ? 'font-semibold' : 'text-gray-500'}`}
        >
          Monthly
        </span>
        <Switch
          checked={billingCycle === 'yearly'}
          onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
        />
        <span
          className={`text-sm ${billingCycle === 'yearly' ? 'font-semibold' : 'text-gray-500'}`}
        >
          Yearly
        </span>
        {billingCycle === 'yearly' && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Save up to ₹589!
          </Badge>
        )}
      </div>

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(PACKAGES).map(([packageId, pkg]) => (
          <div
            key={packageId}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
              selectedPackage === packageId
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            } ${'recommended' in pkg && pkg.recommended ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => handlePackageSelect(packageId)}
          >
            {'recommended' in pkg && pkg.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Recommended
                </Badge>
              </div>
            )}

            <div className="text-center mb-4">
              <h3 className="text-xl font-bold">{pkg.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  ₹{billingCycle === 'yearly' ? pkg.yearly : pkg.monthly}
                </span>
                <span className="text-gray-500">
                  /{billingCycle === 'yearly' ? 'year' : 'month'}
                </span>
              </div>
              {billingCycle === 'yearly' && pkg.savings && (
                <p className="text-green-600 text-sm font-medium mt-1">Save ₹{pkg.savings}!</p>
              )}
            </div>

            <div className="space-y-3">
              {pkg.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  {feature.included ? (
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${feature.included ? 'text-gray-900' : 'text-gray-400'}`}
                  >
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant={selectedPackage === packageId ? 'default' : 'outline'}
              className="w-full mt-6"
              onClick={() => handlePackageSelect(packageId)}
            >
              {selectedPackage === packageId ? 'Selected' : 'Choose Plan'}
            </Button>
          </div>
        ))}
      </div>

      {/* Add-ons */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Pay-As-You-Go Add-ons
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ADD_ONS.map((addOn) => (
            <div
              key={addOn.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={addOns.includes(addOn.id)}
                  onCheckedChange={(checked) => handleAddOnToggle(addOn.id, checked as boolean)}
                />
                <div>
                  <p className="font-medium">{addOn.name}</p>
                  {addOn.note && <p className="text-sm text-gray-500">{addOn.note}</p>}
                </div>
              </div>
              <span className="font-bold text-blue-600">₹{addOn.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {selectedPackage && (
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Package Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>
                {PACKAGES[selectedPackage as keyof typeof PACKAGES].name} Package ({billingCycle})
              </span>
              <span className="font-medium">
                ₹
                {billingCycle === 'yearly'
                  ? PACKAGES[selectedPackage as keyof typeof PACKAGES].yearly
                  : PACKAGES[selectedPackage as keyof typeof PACKAGES].monthly}
              </span>
            </div>
            {addOns.map((addOnId: string) => {
              const addOn = ADD_ONS.find((a) => a.id === addOnId);
              return addOn ? (
                <div key={addOnId} className="flex justify-between text-sm">
                  <span>{addOn.name}</span>
                  <span>₹{addOn.price}</span>
                </div>
              ) : null;
            })}
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-blue-600">₹{calculateTotal()}</span>
            </div>
          </div>
        </div>
      )}

      <FormField
        control={control}
        name="selectedPackage"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
