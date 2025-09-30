'use client';

import * as React from 'react';
import Link from 'next/link';
import { Star, Heart, MapPin, Clock, Phone, Navigation, Store, Badge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge as BadgeComponent } from '@/components/ui/badge';

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

interface BusinessCardProps {
  business: Business;
  layout?: 'grid' | 'list';
  showDeal?: boolean;
  className?: string;
}

export function BusinessCard({
  business,
  layout = 'grid',
  showDeal = true,
  className = '',
}: BusinessCardProps) {
  const [isLiked, setIsLiked] = React.useState(false);

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(`tel:${business.phoneNumber}`, '_self');
  };

  const handleDirections = (e: React.MouseEvent) => {
    e.preventDefault();
    const encodedLocation = encodeURIComponent(`${business.name}, ${business.location}`);
    window.open(`https://maps.google.com/?q=${encodedLocation}`, '_blank');
  };

  if (layout === 'list') {
    return (
      <Link href={`/business/${business.id}`}>
        <div className={`business-card group flex gap-4 p-4 ${className}`}>
          {/* Image */}
          <div className="relative w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={business.image}
              alt={business.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {business.featured && (
              <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-semibold">
                Featured
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-gray-900 truncate">{business.name}</h3>
                  {business.verified && (
                    <BadgeComponent className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
                      ✓ Verified
                    </BadgeComponent>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-1">{business.description}</p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsLiked(!isLiked);
                }}
                className="ml-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                />
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>
                  {business.location} • {business.distance}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-current text-yellow-500" />
                <span className="font-medium">{business.rating}</span>
                <span>({business.reviewCount})</span>
              </div>
            </div>

            {showDeal && business.dealTitle && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-primary px-3 py-2 rounded-r-lg mb-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary text-sm">{business.dealTitle}</span>
                  {business.dealDiscount && (
                    <BadgeComponent className="deal-badge">
                      {business.dealDiscount}% OFF
                    </BadgeComponent>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div
                className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
                  business.isOpen ? 'store-status-open' : 'store-status-closed'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{business.isOpen ? 'Open' : 'Closed'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCall}
                  className="text-primary border-primary hover:bg-primary hover:text-white"
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
                <Button size="sm" onClick={handleDirections} className="btn-gradient">
                  <Navigation className="w-4 h-4 mr-1" />
                  Directions
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid Layout (default)
  return (
    <Link href={`/business/${business.id}`}>
      <div className={`business-card group relative ${className}`}>
        {/* Image Container */}
        <div className="relative h-48 overflow-hidden rounded-t-2xl">
          <img
            src={business.image}
            alt={business.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {business.featured && (
              <BadgeComponent className="bg-primary text-white border-0 px-2 py-1 text-xs">
                Featured
              </BadgeComponent>
            )}
            {business.verified && (
              <BadgeComponent className="bg-green-500 text-white border-0 px-2 py-1 text-xs">
                ✓ Verified
              </BadgeComponent>
            )}
          </div>

          {/* Like Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Heart
              className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>

          {/* Quick Actions (hover) */}
          <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCall}
              className="flex-1 glass-dark backdrop-blur-md text-white border-white/30 hover:bg-white/20"
            >
              <Phone className="w-4 h-4 mr-1" />
              Call
            </Button>
            <Button
              size="sm"
              onClick={handleDirections}
              className="flex-1 glass-dark backdrop-blur-md text-white border-white/30 hover:bg-white/20"
            >
              <Navigation className="w-4 h-4 mr-1" />
              Directions
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                {business.category}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 fill-green-600 text-green-600" />
              <span className="text-sm font-semibold text-green-700">{business.rating}</span>
              <span className="text-xs text-gray-500">({business.reviewCount})</span>
            </div>
          </div>

          {/* Business Name */}
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{business.name}</h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4" />
            <span>
              {business.location} • {business.distance}
            </span>
          </div>

          {/* Deal Section */}
          {showDeal && business.dealTitle && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-primary px-3 py-2 rounded-r-lg mb-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-primary text-sm">{business.dealTitle}</h4>
                {business.dealDiscount && (
                  <BadgeComponent className="deal-badge text-xs">
                    {business.dealDiscount}% OFF
                  </BadgeComponent>
                )}
              </div>
              {business.finalPrice && business.originalPrice && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-gray-900 rupee-symbol">
                    {business.finalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-gray-500 line-through rupee-symbol">
                    {business.originalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{business.description}</p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div
              className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
                business.isOpen ? 'store-status-open' : 'store-status-closed'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{business.isOpen ? 'Open' : 'Closed'}</span>
            </div>
            <span className="text-xs text-gray-500">{business.openHours}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
