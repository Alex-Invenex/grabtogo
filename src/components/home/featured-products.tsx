'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { getBusinessImage } from '@/lib/images'
import { ArrowRight } from 'lucide-react'

export function FeaturedProducts() {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        {/* Large Promotional Banner */}
        <div className="promo-banner">
          {/* Left Side - Image */}
          <div className="relative overflow-hidden">
            <img
              src={getBusinessImage(2, 'storefront')}
              alt="Special Offer"
              className="promo-banner-image"
            />
            {/* Image Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          </div>

          {/* Right Side - Content */}
          <div className="promo-banner-content">
            {/* Discount Badge */}
            <div className="inline-block mb-6">
              <div className="corner-cut-small bg-primary text-white px-8 py-3 rounded-2xl">
                <span className="text-3xl font-extrabold">20% OFF</span>
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              UNLEASH WANDERLUST WITH SKYWINGS
            </h2>

            {/* Description */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
              Explore incredible deals from local businesses. Discover unique products, exclusive offers, and unforgettable experiences right in your neighborhood.
            </p>

            {/* Features List */}
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-lg font-medium text-gray-700">Verified Local Businesses</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-lg font-medium text-gray-700">Exclusive Deals & Offers</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-lg font-medium text-gray-700">Secure Shopping Experience</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-bold text-lg px-10 py-7 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                Book A Flight Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:border-primary hover:text-primary font-bold px-10 py-7 rounded-2xl transition-all duration-300"
              >
                View All Deals
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}