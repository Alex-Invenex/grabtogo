'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Search, MapPin, Shield } from 'lucide-react'

export function JourneySection() {
  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 to-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Order Food Made Simple!
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Browse Menus, Order Easily: Enjoy delicious food delivered to your doorstep
            with our seamless ordering experience from search to delivery
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Left Feature Card */}
          <div className="relative">
            <div className="corner-cut-small bg-primary rounded-3xl p-10 text-white shadow-2xl hover:-translate-y-2 transition-all duration-500">
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Browse Restaurants</h3>
                <p className="text-white/90 leading-relaxed mb-6">
                  Discover thousands of local restaurants, cuisines, and exclusive food deals right at your fingertips.
                </p>
                <Button
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-primary font-bold rounded-xl transition-all"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>

          {/* Center - Illustration/Map */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Globe/Map Illustration */}
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-primary/20"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-primary/30"></div>
                </div>

                {/* Center Icon */}
                <div className="relative z-10 w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-2xl">
                  <MapPin className="w-12 h-12 text-white" />
                </div>

                {/* Floating Points */}
                <div className="absolute top-12 right-12 w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                <div className="absolute bottom-20 left-16 w-3 h-3 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-24 left-12 w-3 h-3 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>

          {/* Right Feature Card */}
          <div className="relative">
            <div className="corner-cut-small bg-white rounded-3xl p-10 shadow-2xl border border-gray-100 hover:-translate-y-2 transition-all duration-500">
              <div className="mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Place Your Order</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Safe and secure ordering experience with verified restaurants, real-time tracking, and customer protection.
                </p>
                <Button
                  className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}