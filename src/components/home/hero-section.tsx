'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getBusinessImage } from '@/lib/images'
import { MapPin, Users, Zap, Star, TrendingUp, Shield, ArrowRight } from 'lucide-react'

export function HeroSection() {
  const [stats, setStats] = React.useState({
    vendors: 0,
    deals: 0,
    customers: 0
  })

  // Animated counter effect
  React.useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = {
      vendors: 500 / steps,
      deals: 1200 / steps,
      customers: 10000 / steps
    }

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      setStats({
        vendors: Math.min(Math.floor(increment.vendors * currentStep), 500),
        deals: Math.min(Math.floor(increment.deals * currentStep), 1200),
        customers: Math.min(Math.floor(increment.customers * currentStep), 10000)
      })

      if (currentStep >= steps) clearInterval(interval)
    }, duration / steps)

    return () => clearInterval(interval)
  }, [])

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
            <div className="inline-flex items-center gap-2 bg-white px-5 py-3 rounded-full shadow-lg border-2 border-primary/10">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">🔥 Discover Local Deals & Offers</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1]">
              Find the
              <span className="block mt-2">Ultimate</span>
              <span className="block text-primary mt-2 bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                Offers Now!
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-xl leading-relaxed">
              A curated selection of offers and deals in your area with <strong className="text-primary">up to 50% discounts</strong> from verified local businesses.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-4 py-4">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-4 py-2 text-sm font-bold">
                <Shield className="w-4 h-4 mr-2" />
                {stats.vendors}+ Verified Vendors
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-4 py-2 text-sm font-bold">
                <Zap className="w-4 h-4 mr-2" />
                {stats.deals}+ Active Deals
              </Badge>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 px-4 py-2 text-sm font-bold">
                <Users className="w-4 h-4 mr-2" />
                {stats.customers}+ Happy Customers
              </Badge>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-bold text-lg px-10 py-7 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
                onClick={() => window.location.href = '/listings'}
              >
                Discover Places
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:border-primary hover:bg-primary hover:text-white font-bold text-lg px-10 py-7 rounded-2xl transition-all duration-300"
                onClick={() => window.location.href = '/listings?sortBy=discount'}
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                View Flash Deals
              </Button>
            </div>

            {/* Feature Icons with Enhanced Design */}
            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Search</div>
                  <div className="text-sm font-bold text-gray-900">Location-Based</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Trust</div>
                  <div className="text-sm font-bold text-gray-900">Verified Vendors</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Savings</div>
                  <div className="text-sm font-bold text-gray-900">Amazing Discounts</div>
                </div>
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
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Featured Deals</div>
                  <div className="text-lg font-bold text-gray-900">Kerala Businesses</div>
                  <div className="text-xs text-gray-600 mt-1">500+ Local Vendors</div>
                </div>
              </div>
            </div>

            {/* Decorative Circles */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    </section>
  )
}