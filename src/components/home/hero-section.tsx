'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, MapPin, Truck, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SearchBar } from '@/components/ui/search-bar'

export function HeroSection() {
  const handleSearch = (query: string) => {
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`
    }
  }

  return (
    <section className="relative bg-gradient-to-r from-primary/10 via-background to-secondary/10 py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Discover Amazing Products from
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {' '}Local Vendors
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Connect with trusted vendors in your area. Shop for fresh products,
            unique items, and local specialties with fast delivery and secure payments.
          </p>

          {/* Search Bar */}
          <div className="mt-10 flex justify-center">
            <div className="w-full max-w-lg">
              <SearchBar
                placeholder="Search for products, vendors, or categories..."
                onSearch={handleSearch}
                className="h-12 text-base"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/products">
                <Search className="mr-2 h-4 w-4" />
                Browse Products
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/vendors">
                <MapPin className="mr-2 h-4 w-4" />
                Find Vendors
              </Link>
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card className="bg-background/50 backdrop-blur">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Fast Delivery</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get your orders delivered quickly from local vendors in your area.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/50 backdrop-blur">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Secure Payments</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Shop with confidence using our secure payment system powered by Razorpay.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/50 backdrop-blur">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Local Vendors</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Support local businesses and discover unique products in your neighborhood.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}