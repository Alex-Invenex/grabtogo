'use client';

import * as React from 'react';
import { Search, MapPin, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/ui/search-bar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SearchFilters {
  query: string;
  location: string;
  category: string;
  rating: string;
  distance: string;
  features: string[];
  sortBy: string;
}

interface BusinessSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: (query: string) => void;
  className?: string;
}

const keralaCities = [
  'All Kerala',
  'Kottayam',
  'Kochi',
  'Thrissur',
  'Thiruvananthapuram',
  'Kozhikode',
  'Kannur',
  'Kollam',
  'Palakkad',
  'Alappuzha',
  'Malappuram',
  'Kasaragod',
  'Pathanamthitta',
  'Idukki',
];

const categories = [
  'All Categories',
  'Fashion & Apparel',
  'Electronics',
  'Restaurants & Cafes',
  'Grocery Stores',
  'Jewelry & Watches',
  'Furniture & Decor',
  'Beauty & Wellness',
  'Automotive',
  'Healthcare',
  'Education',
  'Real Estate',
  'Travel & Tourism',
];

const ratings = [
  { label: 'Any Rating', value: '' },
  { label: '4.5+ Stars', value: '4.5' },
  { label: '4.0+ Stars', value: '4.0' },
  { label: '3.5+ Stars', value: '3.5' },
  { label: '3.0+ Stars', value: '3.0' },
];

const distances = [
  { label: 'Any Distance', value: '' },
  { label: 'Within 1 km', value: '1' },
  { label: 'Within 2 km', value: '2' },
  { label: 'Within 5 km', value: '5' },
  { label: 'Within 10 km', value: '10' },
  { label: 'Within 25 km', value: '25' },
];

const features = [
  { label: 'Open Now', value: 'open' },
  { label: 'Has Deals', value: 'deals' },
  { label: 'Verified Business', value: 'verified' },
  { label: 'Featured', value: 'featured' },
  { label: 'Accepts Cards', value: 'cards' },
  { label: 'Home Delivery', value: 'delivery' },
];

const sortOptions = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Distance', value: 'distance' },
  { label: 'Rating', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

export function BusinessSearch({
  filters,
  onFiltersChange,
  onSearch,
  className = '',
}: BusinessSearchProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleFeature = (feature: string) => {
    const newFeatures = filters.features.includes(feature)
      ? filters.features.filter((f) => f !== feature)
      : [...filters.features, feature];

    updateFilter('features', newFeatures);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      query: '',
      location: 'All Kerala',
      category: 'All Categories',
      rating: '',
      distance: '',
      features: [],
      sortBy: 'relevance',
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category !== 'All Categories') count++;
    if (filters.rating) count++;
    if (filters.distance) count++;
    if (filters.features.length > 0) count += filters.features.length;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <SearchBar
              placeholder="Search businesses, deals, or products..."
              onSearch={onSearch}
              value={filters.query}
              className="h-12 text-base border-gray-300 focus:border-primary"
            />
          </div>

          {/* Location Selector */}
          <div className="lg:w-64">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-between text-left font-normal border-gray-300"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{filters.location}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel>Select Location</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {keralaCities.map((city) => (
                  <DropdownMenuItem
                    key={city}
                    onClick={() => updateFilter('location', city)}
                    className={filters.location === city ? 'bg-primary/10' : ''}
                  >
                    {city}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="h-12 px-4 border-gray-300 relative"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 min-w-[20px] h-5">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  >
                    <span className="truncate">{filters.category}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="start">
                  <DropdownMenuLabel>Select Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => updateFilter('category', category)}
                      className={filters.category === category ? 'bg-primary/10' : ''}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Rating</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  >
                    <span className="truncate">
                      {ratings.find((r) => r.value === filters.rating)?.label || 'Any Rating'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="start">
                  <DropdownMenuLabel>Minimum Rating</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ratings.map((rating) => (
                    <DropdownMenuItem
                      key={rating.value}
                      onClick={() => updateFilter('rating', rating.value)}
                      className={filters.rating === rating.value ? 'bg-primary/10' : ''}
                    >
                      {rating.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Distance Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Distance</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  >
                    <span className="truncate">
                      {distances.find((d) => d.value === filters.distance)?.label || 'Any Distance'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="start">
                  <DropdownMenuLabel>Maximum Distance</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {distances.map((distance) => (
                    <DropdownMenuItem
                      key={distance.value}
                      onClick={() => updateFilter('distance', distance.value)}
                      className={filters.distance === distance.value ? 'bg-primary/10' : ''}
                    >
                      {distance.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sort By</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  >
                    <span className="truncate">
                      {sortOptions.find((s) => s.value === filters.sortBy)?.label || 'Relevance'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="start">
                  <DropdownMenuLabel>Sort Results</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => updateFilter('sortBy', option.value)}
                      className={filters.sortBy === option.value ? 'bg-primary/10' : ''}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Features Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Features</label>
            <div className="flex flex-wrap gap-2">
              {features.map((feature) => {
                const isSelected = filters.features.includes(feature.value);
                return (
                  <Button
                    key={feature.value}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleFeature(feature.value)}
                    className={isSelected ? 'bg-primary text-white' : ''}
                  >
                    {feature.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700">Active Filters:</label>
              <div className="flex flex-wrap gap-2">
                {filters.category !== 'All Categories' && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.category}
                    <button
                      onClick={() => updateFilter('category', 'All Categories')}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.rating && (
                  <Badge variant="secondary" className="gap-1">
                    {ratings.find((r) => r.value === filters.rating)?.label}
                    <button
                      onClick={() => updateFilter('rating', '')}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.distance && (
                  <Badge variant="secondary" className="gap-1">
                    {distances.find((d) => d.value === filters.distance)?.label}
                    <button
                      onClick={() => updateFilter('distance', '')}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="gap-1">
                    {features.find((f) => f.value === feature)?.label}
                    <button
                      onClick={() => toggleFeature(feature)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
