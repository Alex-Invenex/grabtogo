'use client';

import * as React from 'react';
import { BusinessCard } from './business-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Grid, List, Filter, SlidersHorizontal, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  city: string;
  distance: string;
  rating: number;
  reviewCount: number;
  image: string;
  isOpen: boolean;
  openHours: string;
  phoneNumber: string;
  dealTitle?: string;
  dealDiscount?: number;
  originalPrice?: number;
  finalPrice?: number;
  verified?: boolean;
  featured?: boolean;
}

interface BusinessListProps {
  businesses: Business[];
  loading?: boolean;
  layout?: 'grid' | 'list';
  onLayoutChange?: (layout: 'grid' | 'list') => void;
  showFilters?: boolean;
  showSort?: boolean;
  showDeal?: boolean;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  className?: string;
}

const sortOptions = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Distance', value: 'distance' },
  { label: 'Rating', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Newest', value: 'newest' },
];

const filterOptions = {
  categories: [
    'Fashion & Apparel',
    'Electronics',
    'Restaurants & Cafes',
    'Grocery Stores',
    'Jewelry & Watches',
    'Furniture & Decor',
    'Beauty & Wellness',
    'Automotive',
  ],
  ratings: [
    { label: '4.5+ Stars', value: '4.5' },
    { label: '4.0+ Stars', value: '4.0' },
    { label: '3.5+ Stars', value: '3.5' },
    { label: '3.0+ Stars', value: '3.0' },
  ],
  distance: [
    { label: 'Within 1 km', value: '1' },
    { label: 'Within 2 km', value: '2' },
    { label: 'Within 5 km', value: '5' },
    { label: 'Within 10 km', value: '10' },
  ],
  features: [
    { label: 'Open Now', value: 'open' },
    { label: 'Has Deals', value: 'deals' },
    { label: 'Verified', value: 'verified' },
    { label: 'Featured', value: 'featured' },
  ],
};

export function BusinessList({
  businesses,
  loading = false,
  layout = 'grid',
  onLayoutChange,
  showFilters = true,
  showSort = true,
  showDeal = true,
  title,
  subtitle,
  emptyMessage = 'No businesses found in this area.',
  className = '',
}: BusinessListProps) {
  const [sortBy, setSortBy] = React.useState('relevance');
  const [selectedFilters, setSelectedFilters] = React.useState<Record<string, string[]>>({
    categories: [],
    ratings: [],
    distance: [],
    features: [],
  });

  const featuredBusinesses = businesses.filter((business) => business.featured);
  const regularBusinesses = businesses.filter((business) => !business.featured);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {title && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
          </div>
        )}

        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-gray-600">Loading businesses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        {title && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
          </div>
        )}

        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <MapPin className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Businesses Found</h3>
          <p className="text-gray-600 max-w-md mx-auto">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="text-center">
          {title && <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>}
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
      )}

      {/* Controls */}
      {(showFilters || showSort || onLayoutChange) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b border-gray-200">
          {/* Results Count */}
          <div className="flex items-center gap-4">
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">{businesses.length}</span> businesses
              found
            </p>
            {featuredBusinesses.length > 0 && (
              <Badge className="bg-primary text-white">{featuredBusinesses.length} Featured</Badge>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            {showSort && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Sort: {sortOptions.find((opt) => opt.value === sortBy)?.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={sortBy === option.value ? 'bg-primary/10' : ''}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Filter Dropdown */}
            {showFilters && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Category Filter */}
                  <div className="p-2">
                    <h4 className="font-medium text-sm mb-2">Categories</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {filterOptions.categories.map((category) => (
                        <label key={category} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedFilters.categories.includes(category)}
                            onChange={(e) => {
                              setSelectedFilters((prev) => ({
                                ...prev,
                                categories: e.target.checked
                                  ? [...prev.categories, category]
                                  : prev.categories.filter((c) => c !== category),
                              }));
                            }}
                          />
                          {category}
                        </label>
                      ))}
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Features Filter */}
                  <div className="p-2">
                    <h4 className="font-medium text-sm mb-2">Features</h4>
                    <div className="space-y-1">
                      {filterOptions.features.map((feature) => (
                        <label key={feature.value} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedFilters.features.includes(feature.value)}
                            onChange={(e) => {
                              setSelectedFilters((prev) => ({
                                ...prev,
                                features: e.target.checked
                                  ? [...prev.features, feature.value]
                                  : prev.features.filter((f) => f !== feature.value),
                              }));
                            }}
                          />
                          {feature.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Layout Toggle */}
            {onLayoutChange && (
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onLayoutChange('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    layout === 'grid'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onLayoutChange('list')}
                  className={`p-2 rounded-md transition-colors ${
                    layout === 'list'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Featured Businesses */}
      {featuredBusinesses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900">Featured Businesses</h3>
            <Badge className="bg-primary text-white">Promoted</Badge>
          </div>
          <div
            className={
              layout === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {featuredBusinesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                layout={layout}
                showDeal={showDeal}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Businesses */}
      {regularBusinesses.length > 0 && (
        <div className="space-y-4">
          {featuredBusinesses.length > 0 && (
            <h3 className="text-xl font-bold text-gray-900">All Businesses</h3>
          )}
          <div
            className={
              layout === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {regularBusinesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                layout={layout}
                showDeal={showDeal}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
