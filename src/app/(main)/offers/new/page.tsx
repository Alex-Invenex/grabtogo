'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sparkles, TrendingUp, Clock, MapPin, Star } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  vendor: string;
  location: string;
  image: string;
  rating: number;
  expiresIn: string;
  category: string;
  isNew: boolean;
}

// Mock data - replace with actual API call
const mockOffers: Offer[] = [
  {
    id: '1',
    title: '50% Off on All Burgers',
    description: 'Get flat 50% discount on all burger combos',
    discount: '50% OFF',
    vendor: 'Burger Palace',
    location: 'Kottayam',
    image: '/images/placeholder-food.jpg',
    rating: 4.5,
    expiresIn: '2 days',
    category: 'Food',
    isNew: true,
  },
  {
    id: '2',
    title: 'Buy 1 Get 1 Free Pizza',
    description: 'Order any large pizza and get another one absolutely free',
    discount: 'BOGO',
    vendor: 'Pizza Corner',
    location: 'Ernakulam',
    image: '/images/placeholder-food.jpg',
    rating: 4.8,
    expiresIn: '5 days',
    category: 'Food',
    isNew: true,
  },
  {
    id: '3',
    title: '30% Off on First Order',
    description: 'New customer special - get 30% off on your first order',
    discount: '30% OFF',
    vendor: 'Spice Route',
    location: 'Thrissur',
    image: '/images/placeholder-food.jpg',
    rating: 4.2,
    expiresIn: '1 week',
    category: 'Food',
    isNew: true,
  },
];

export default function NewOffersPage() {
  const [offers, setOffers] = React.useState<Offer[]>(mockOffers);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-orange-600 text-white py-16">
        <div className="container-custom">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 animate-pulse" />
            <h1 className="font-display text-4xl md:text-5xl font-bold">New Offers</h1>
            <Sparkles className="h-8 w-8 animate-pulse" />
          </div>
          <p className="text-center text-lg text-white/90 max-w-2xl mx-auto">
            Discover the latest deals and exclusive offers from top vendors in your area
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-medium">
              {offers.length} Fresh Offers Available Today
            </span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="container-custom py-8">
        <div className="flex flex-wrap gap-3 mb-8">
          <Button variant="default" size="sm" className="bg-primary text-white">
            All Categories
          </Button>
          <Button variant="outline" size="sm">
            Food & Dining
          </Button>
          <Button variant="outline" size="sm">
            Shopping
          </Button>
          <Button variant="outline" size="sm">
            Services
          </Button>
          <Button variant="outline" size="sm">
            Entertainment
          </Button>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card
              key={offer.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white"
            >
              {/* Image Section */}
              <div className="relative h-48 bg-gradient-to-br from-orange-100 to-yellow-100 overflow-hidden">
                {offer.isNew && (
                  <Badge className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg z-10">
                    <Sparkles className="h-3 w-3 mr-1" />
                    NEW
                  </Badge>
                )}
                <Badge className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-600 text-white text-lg font-bold border-0 shadow-lg z-10 px-4 py-2">
                  {offer.discount}
                </Badge>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Content Section */}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                      {offer.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{offer.vendor}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold text-gray-700">{offer.rating}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-4">
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{offer.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{offer.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Expires in {offer.expiresIn}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Link href={`/offers/${offer.id}`} className="w-full">
                  <Button className="w-full bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-white font-semibold shadow-md">
                    View Offer
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {offers.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No New Offers Yet</h3>
            <p className="text-gray-600 mb-6">
              Check back soon for exciting new deals from your favorite vendors
            </p>
            <Link href="/listings">
              <Button variant="outline">Browse All Listings</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
