'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getBusinessImage } from '@/lib/images';
import { MapPin, Users, Zap, Star, TrendingUp, Shield, ArrowRight, Sparkles } from 'lucide-react';

export function HeroSectionModern() {
  const [stats] = React.useState({
    vendors: 500,
    deals: 1200,
    customers: 10000,
  });

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container-custom relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-16 lg:py-24">
          {/* Left Column - Content */}
          <div className="space-y-8 fade-in-up">
            {/* Badge */}
            <Badge
              variant="outline"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/80 backdrop-blur-sm border-orange-200 text-orange-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              Discover Local Deals & Offers
            </Badge>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              <span className="block text-gray-900 slide-in-left">Find the</span>
              <span className="block bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-gradient slide-in-left animation-delay-200">
                Ultimate
              </span>
              <span className="block text-gray-900 slide-in-left animation-delay-400">Offers Now!</span>
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-600 max-w-xl fade-in animation-delay-600">
              A curated selection of offers and deals in your area with up to 50% discounts from verified local businesses.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 pt-4 fade-in animation-delay-800">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900">{stats.vendors}+ Verified Vendors</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">{stats.deals.toLocaleString()}+ Active Deals</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900">{stats.customers.toLocaleString()}+ Happy Customers</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4 fade-in animation-delay-1000">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <span className="flex items-center gap-2">
                  Discover Places
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-orange-600 text-orange-600 hover:bg-orange-50 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Zap className="w-5 h-5 mr-2" />
                View Flash Deals
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-4 pt-8 fade-in animation-delay-1200">
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all duration-300 hover:scale-105">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">Search</p>
                  <p className="text-xs text-gray-600">Location-Based</p>
                </div>
              </div>
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all duration-300 hover:scale-105">
                <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">Trust</p>
                  <p className="text-xs text-gray-600">Verified Vendors</p>
                </div>
              </div>
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all duration-300 hover:scale-105">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">Savings</p>
                  <p className="text-xs text-gray-600">Amazing Discounts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative fade-in animation-delay-400">
            {/* Main Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
              <img
                src={getBusinessImage(1)}
                alt="Discover amazing deals and offers from local businesses"
                className="w-full h-[500px] object-cover"
              />

              {/* Floating Badge - Rating */}
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl hover:scale-110 transition-transform duration-300 float-animation">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900">4.9/5</span>
                </div>
                <p className="text-sm text-gray-600">Customer Rating</p>
              </div>

              {/* Floating Badge - Featured */}
              <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl hover:scale-110 transition-transform duration-300 float-animation animation-delay-1000">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-900">Featured Deals</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>Kerala Businesses</p>
                  <p className="font-semibold text-gray-900">500+ Local Vendors</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
