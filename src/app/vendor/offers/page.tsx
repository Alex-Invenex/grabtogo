'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Tag, Clock, TrendingUp, Percent, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';

interface Offer {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: { url: string }[];
  };
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  stockLimit: number;
  stockSold: number;
  isActive: boolean;
}

export default function VendorOffersPage() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/vendor/offers');
      if (!response.ok) throw new Error('Failed to fetch offers');

      const data = await response.json();
      setOffers(data.offers || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load offers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isOfferExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const getOfferProgress = (stockSold: number, stockLimit: number) => {
    return (stockSold / stockLimit) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offers & Flash Sales</h1>
          <p className="text-gray-600 mt-1">Create limited-time offers to boost sales</p>
        </div>
        <Link href="/vendor/offers/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Offer
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Offers</p>
                <p className="text-2xl font-bold">{offers.length}</p>
              </div>
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {offers.filter((o) => o.isActive && !isOfferExpired(o.endDate)).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-600">
                  {offers.filter((o) => isOfferExpired(o.endDate)).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{offers.reduce((sum, o) => sum + (o.stockSold * o.product.price * (100 - o.discountValue) / 100), 0).toFixed(0)}
                </p>
              </div>
              <Percent className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offers Grid */}
      {offers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No offers yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first flash sale to attract customers
              </p>
              <Link href="/vendor/offers/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Offer
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => {
            const expired = isOfferExpired(offer.endDate);
            const progress = getOfferProgress(offer.stockSold, offer.stockLimit);

            return (
              <Card key={offer.id} className={expired ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">
                        {offer.product.name}
                      </CardTitle>
                      <CardDescription>
                        {offer.discountType === 'percentage'
                          ? `${offer.discountValue}% OFF`
                          : `₹${offer.discountValue} OFF`}
                      </CardDescription>
                    </div>
                    <Badge variant={expired ? 'secondary' : 'default'}>
                      {expired ? 'Expired' : offer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Product Image */}
                  {offer.product.images && offer.product.images.length > 0 && (
                    <img
                      src={offer.product.images[0].url}
                      alt={offer.product.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}

                  {/* Pricing */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      ₹
                      {offer.discountType === 'percentage'
                        ? (offer.product.price * (100 - offer.discountValue) / 100).toFixed(2)
                        : (offer.product.price - offer.discountValue).toFixed(2)}
                    </span>
                    <span className="text-gray-500 line-through">
                      ₹{offer.product.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Time Remaining */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {expired
                      ? `Ended ${formatDistanceToNow(new Date(offer.endDate), { addSuffix: true })}`
                      : `Ends ${formatDistanceToNow(new Date(offer.endDate), { addSuffix: true })}`}
                  </div>

                  {/* Stock Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Stock Sold</span>
                      <span className="font-medium">
                        {offer.stockSold} / {offer.stockLimit}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" size="sm">
                      Edit
                    </Button>
                    <Button
                      variant={offer.isActive ? 'destructive' : 'default'}
                      className="flex-1"
                      size="sm"
                    >
                      {offer.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
