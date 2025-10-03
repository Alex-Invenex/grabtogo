'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getBusinessImage } from '@/lib/images';
import { MapPin, Users, Zap, Star, TrendingUp, Shield, ArrowRight, Search } from 'lucide-react';

export function HeroSection() {
  // Use target values directly to avoid hydration mismatch
  const [stats] = React.useState({
    vendors: 500,
    deals: 1200,
    customers: 10000,
  });

  return (
    <section className="relative bg-gradient-to-br from-gray-50 via-white to-primary/5 pt-4 pb-8 md:pt-8 md:pb-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 hidden md:block">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(219, 74, 43) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative container-custom px-4 md:px-4">
        <div className="flex flex-col md:grid md:grid-cols-[60%_40%] gap-8 md:gap-12">
          {/* Left Side - Content */}
          <div className="space-y-4 md:space-y-8 flex flex-col items-center md:items-start">
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-md border border-primary/20">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-700 tracking-wide">
                Discover Local Deals & Offers
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="font-display text-center md:text-left">
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                Find the Best
              </span>
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight mt-1">
                Offers in Kerala
              </span>
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary leading-[1.1] tracking-tight mt-1 bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                Now!
              </span>
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-xl leading-relaxed text-center md:text-left">
              A curated selection of offers and deals in your area with{' '}
              <span className="font-semibold text-primary">up to 50% discounts</span> from verified
              local businesses.
            </p>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center md:justify-start gap-1.5 sm:gap-2 py-3 overflow-x-auto hide-scrollbar">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap flex-shrink-0">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                {stats.vendors}+ Vendors
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap flex-shrink-0">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                {stats.deals}+ Deals
              </Badge>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap flex-shrink-0">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                {stats.customers}+ Customers
              </Badge>
            </div>

            {/* Search Form */}
            <div className="w-full pt-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for deals, vendors, or products..."
                  className="w-full pl-12 pr-14 py-4 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          console.log('Location:', position.coords.latitude, position.coords.longitude);
                          // Handle location here
                        },
                        (error) => {
                          console.error('Error getting location:', error);
                          alert('Unable to get your location. Please enable location services.');
                        }
                      );
                    } else {
                      alert('Geolocation is not supported by your browser');
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
                  aria-label="Find my location"
                >
                  <MapPin className="w-5 h-5 text-primary" />
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-2 w-full">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-semibold text-sm sm:text-base px-4 py-3 sm:px-8 sm:py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group min-h-[48px] active:scale-95"
                onClick={() => (window.location.href = '/listings')}
              >
                <span className="hidden sm:inline">Discover Places</span>
                <span className="sm:hidden">Discover</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:border-primary hover:bg-primary hover:text-white font-semibold text-sm sm:text-base px-4 py-3 sm:px-8 sm:py-6 rounded-xl transition-all duration-300 min-h-[48px] active:scale-95"
                onClick={() => (window.location.href = '/listings?sortBy=discount')}
              >
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">View Flash Deals</span>
                <span className="sm:hidden">Deals</span>
              </Button>
            </div>

            {/* Feature Icons with Enhanced Design - Hidden on Mobile */}
            <div className="hidden md:flex items-center gap-3 md:gap-6 pt-2 md:pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MapPin className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">Search</div>
                  <div className="text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">Location-Based</div>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">Trust</div>
                  <div className="text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">Verified Vendors</div>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">Savings</div>
                  <div className="text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">Amazing Discounts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Image with Corner Cut */}
          <div className="relative hidden md:block">
            <div className="relative corner-cut-large overflow-hidden rounded-3xl shadow-2xl">
              <img
                src={getBusinessImage(0, 'storefront')}
                alt="Discover amazing deals and offers from local businesses"
                className="w-full h-[600px] object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>

            {/* Floating Info Card - Top Right */}
            <div className="floating-info-card top-8 right-8 max-w-[200px]">
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="w-6 h-6 text-yellow-900 fill-current" />
                </div>
                <div className="text-2xl font-extrabold text-gray-900">4.9/5</div>
                <div className="text-xs text-gray-600 font-medium">Customer Rating</div>
              </div>
            </div>

            {/* Floating Info Card - Bottom Left */}
            <div className="floating-info-card bottom-8 left-8 max-w-xs">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Featured Deals
                  </div>
                  <div className="text-lg font-bold text-gray-900">Kerala Businesses</div>
                  <div className="text-xs text-gray-600 mt-1">500+ Local Vendors</div>
                </div>
              </div>
            </div>

            {/* Decorative Circles */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div
              className="absolute -bottom-8 -left-8 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '1s' }}
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
}
