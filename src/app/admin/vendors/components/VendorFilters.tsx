'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';

export default function VendorFilters() {
  const [selectedFilters, setSelectedFilters] = useState({
    businessType: '',
    city: '',
    subscriptionPlan: '',
    registrationDate: null as Date | null,
    gstStatus: '',
  });

  const businessTypes = [
    'Restaurant',
    'Grocery Store',
    'Bakery',
    'Sweet Shop',
    'Fast Food',
    'Cafe',
    'Cloud Kitchen',
    'Catering',
  ];

  const cities = [
    'Thiruvananthapuram',
    'Kochi',
    'Kozhikode',
    'Thrissur',
    'Kottayam',
    'Alappuzha',
    'Palakkad',
    'Malappuram',
  ];

  const subscriptionPlans = ['Basic', 'Premium', 'Enterprise'];
  const gstStatuses = ['Verified', 'Pending', 'Not Required'];

  const handleFilterChange = (key: string, value: string | Date | null) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilter = (key: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [key]: key === 'registrationDate' ? null : '',
    }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      businessType: '',
      city: '',
      subscriptionPlan: '',
      registrationDate: null,
      gstStatus: '',
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(selectedFilters).filter((value) => value !== '' && value !== null).length;
  };

  return (
    <div className="border-t pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        {getActiveFilterCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear All ({getActiveFilterCount()})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Business Type */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-2 block">Business Type</label>
          <Select
            value={selectedFilters.businessType}
            onValueChange={(value) => handleFilterChange('businessType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {businessTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-2 block">City</label>
          <Select
            value={selectedFilters.city}
            onValueChange={(value) => handleFilterChange('city', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subscription Plan */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-2 block">Subscription Plan</label>
          <Select
            value={selectedFilters.subscriptionPlan}
            onValueChange={(value) => handleFilterChange('subscriptionPlan', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              {subscriptionPlans.map((plan) => (
                <SelectItem key={plan} value={plan}>
                  {plan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Registration Date */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-2 block">Registration Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedFilters.registrationDate ? (
                  format(selectedFilters.registrationDate, 'PPP')
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedFilters.registrationDate || undefined}
                onSelect={(date) => handleFilterChange('registrationDate', date || null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* GST Status */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-2 block">GST Status</label>
          <Select
            value={selectedFilters.gstStatus}
            onValueChange={(value) => handleFilterChange('gstStatus', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {gstStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-xs font-medium text-gray-700">Active filters:</span>
          {selectedFilters.businessType && (
            <Badge variant="secondary" className="text-xs">
              Type: {selectedFilters.businessType}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => clearFilter('businessType')}
              />
            </Badge>
          )}
          {selectedFilters.city && (
            <Badge variant="secondary" className="text-xs">
              City: {selectedFilters.city}
              <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => clearFilter('city')} />
            </Badge>
          )}
          {selectedFilters.subscriptionPlan && (
            <Badge variant="secondary" className="text-xs">
              Plan: {selectedFilters.subscriptionPlan}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => clearFilter('subscriptionPlan')}
              />
            </Badge>
          )}
          {selectedFilters.registrationDate && (
            <Badge variant="secondary" className="text-xs">
              Date: {format(selectedFilters.registrationDate, 'PP')}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => clearFilter('registrationDate')}
              />
            </Badge>
          )}
          {selectedFilters.gstStatus && (
            <Badge variant="secondary" className="text-xs">
              GST: {selectedFilters.gstStatus}
              <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => clearFilter('gstStatus')} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
