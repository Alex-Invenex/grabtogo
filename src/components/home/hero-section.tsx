'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { getBusinessImage } from '@/lib/images'
import { MapPin, Users, Calendar } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-gray-50 via-white to-primary/5 pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(219, 74, 43) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative container-custom">
        <div className="split-60-40">
          {/* Left Side - Content */}
          <div className="space-y-8">
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-700">DISCOVER LOCAL DEALS & OFFERS</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1]">
              Find the
              <span className="block mt-2">Ultimate</span>
              <span className="block text-primary mt-2">Offers Now!</span>
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-xl leading-relaxed">
              A curated selection of offers and deals in your area with amazing discounts from local businesses.
            </p>

            {/* CTA Button */}
            <div>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-bold text-lg px-10 py-7 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                Discover Places →
              </Button>
            </div>

            {/* Small Feature Icons */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-700">Location-Based</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-700">Verified Vendors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-700">Amazing Discounts</span>
              </div>
            </div>
          </div>

          {/* Right Side - Image with Corner Cut */}
          <div className="relative">
            <div className="relative corner-cut-large overflow-hidden rounded-3xl shadow-2xl">
              <img
                src={getBusinessImage(0, 'storefront')}
                alt="Discover amazing deals and offers from local businesses"
                className="w-full h-[600px] object-cover"
              />
            </div>

            {/* Floating Info Card */}
            <div className="floating-info-card bottom-8 left-8 max-w-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Featured Deals</div>
                  <div className="text-lg font-bold text-gray-900">Kerala Businesses</div>
                </div>
              </div>
            </div>

            {/* Decorative Circles */}
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  )
}