'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, SlidersHorizontal, Grid3x3, List, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getBusinessImage } from '@/lib/images';
import Link from 'next/link';

interface Listing {
  id: string;
  name: string;
  storeName: string;
  category: string;
  location: string;
  city: string;
  image: string;
  discount: string;
  priceRange: string;
  rating: number;
  distance: number;
  isOpen: boolean;
  description: string;
}

function ListingsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialLocation = searchParams.get('location') || 'Kottayam';
  const initialCategory = searchParams.get('category') || 'all';

  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [location, setLocation] = React.useState(initialLocation);
  const [category, setCategory] = React.useState(initialCategory);
  const [sortBy, setSortBy] = React.useState('featured');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = React.useState(false);

  // Mock listings data
  const mockListings: Listing[] = [
    {
      id: '1',
      name: 'vettom home appliances',
      storeName: 'Vettom Home Appliances',
      category: 'Home Appliances & Electronics',
      location: 'Kottayam',
      city: 'Kottayam',
      image: getBusinessImage(0, 'storefront'),
      discount: 'Up to ₹5,000',
      priceRange: '₹1,000 - ₹50,000',
      rating: 4.5,
      distance: 2.3,
      isOpen: true,
      description: 'Quality home appliances and electronics at great prices',
    },
    {
      id: '2',
      name: 'Flamin hot chicken',
      storeName: 'Flamin Hot Chicken',
      category: 'Restaurants & Cafes',
      location: 'Kumaranalloor, Kottayam',
      city: 'Kottayam',
      image: getBusinessImage(1, 'storefront'),
      discount: 'Up to ₹200',
      priceRange: '₹150 - ₹500',
      rating: 4.8,
      distance: 3.1,
      isOpen: true,
      description: 'Delicious fried chicken and fast food',
    },
    {
      id: '3',
      name: 'ELSA FASHIONS',
      storeName: 'ELSA FASHIONS',
      category: 'Fashion & Apparel',
      location: 'Kesavanpady, Thrippunithura, Kochi',
      city: 'Kochi',
      image: getBusinessImage(2, 'storefront'),
      discount: 'Up to 40%',
      priceRange: '₹500 - ₹5,000',
      rating: 4.6,
      distance: 15.2,
      isOpen: true,
      description: 'Latest fashion trends and apparel for all',
    },
    {
      id: '4',
      name: 'Greens Supermarket',
      storeName: 'Greens Supermarket',
      category: 'Supermarkets & Grocery Stores',
      location: 'Kottayam',
      city: 'Kottayam',
      image: getBusinessImage(3, 'storefront'),
      discount: '₹5 - ₹25',
      priceRange: '₹50 - ₹5,000',
      rating: 4.4,
      distance: 1.8,
      isOpen: false,
      description: 'Fresh groceries and daily essentials',
    },
    {
      id: '5',
      name: 'Grabtogo Restaurant',
      storeName: 'Grabtogo',
      category: 'Restaurants & Cafes',
      location: 'Thrissur',
      city: 'Thrissur',
      image: getBusinessImage(4, 'storefront'),
      discount: 'Up to ₹2,000',
      priceRange: '₹899',
      rating: 4.7,
      distance: 45.5,
      isOpen: false,
      description: 'Multi-cuisine restaurant with great ambiance',
    },
  ];

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'fashion-apparel', name: 'Fashion & Apparel' },
    { id: 'furniture-home-decor', name: 'Furniture & Home Decor' },
    { id: 'home-appliances-electronics', name: 'Home Appliances & Electronics' },
    { id: 'jewellery-watches', name: 'Jewellery & Watches' },
    { id: 'restaurants-cafes', name: 'Restaurants & Cafes' },
    { id: 'supermarkets-grocery', name: 'Supermarkets & Grocery' },
  ];

  const locations = [
    'All Locations',
    'Kottayam',
    'Kochi',
    'Thrissur',
    'Thiruvananthapuram',
    'Kozhikode',
    'Palakkad',
  ];

  const handleSearch = () => {
    // In a real app, this would trigger an API call
    console.log('Searching...', { searchQuery, location, category, sortBy });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="container-custom py-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Discover Local Deals</h1>
          <p className="text-lg text-gray-600">
            Browse {mockListings.length} amazing offers from local businesses
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-b sticky top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search businesses, deals, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Location Filter */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 min-w-[180px]">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-transparent outline-none text-gray-700 font-medium flex-1 cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-2 border-gray-200 hover:border-primary"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters
            </Button>

            {/* Search Button */}
            <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90 font-bold">
              Search
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-gray-200 outline-none focus:border-primary"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-gray-200 outline-none focus:border-primary"
                  >
                    <option value="featured">Featured</option>
                    <option value="distance">Distance</option>
                    <option value="rating">Rating</option>
                    <option value="discount">Best Discount</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>

                {/* View Mode */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    View Mode
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="flex-1"
                    >
                      <Grid3x3 className="w-4 h-4 mr-2" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="flex-1"
                    >
                      <List className="w-4 h-4 mr-2" />
                      List
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="container-custom py-8">
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'flex flex-col gap-4'
          }
        >
          {mockListings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className={
                viewMode === 'grid'
                  ? 'business-card'
                  : 'flex gap-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-4'
              }
            >
              {/* Image */}
              <div
                className={
                  viewMode === 'grid'
                    ? 'relative h-64 overflow-hidden'
                    : 'w-48 h-48 flex-shrink-0 rounded-xl overflow-hidden'
                }
              >
                <img
                  src={listing.image}
                  alt={listing.storeName}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Discount Badge */}
                <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  {listing.discount}
                </div>
                {/* Open/Closed Badge */}
                <div
                  className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${
                    listing.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}
                >
                  {listing.isOpen ? 'Open Now' : 'Closed'}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{listing.storeName}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {listing.category}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">{listing.description}</p>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{listing.distance} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{listing.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">{listing.priceRange}</span>
                  <span className="text-sm text-gray-500">{listing.location}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {mockListings.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ListingsContent />
    </Suspense>
  );
}
