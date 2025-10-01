'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: { url: string; altText: string | null }[];
  vendor: {
    vendorProfile: {
      storeName: string;
      storeSlug: string;
    };
  };
}

interface FlashDealsProps {
  products?: Product[];
  loading?: boolean;
}

export function FlashDeals({
  products: initialProducts,
  loading: initialLoading,
}: FlashDealsProps) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = React.useState(initialLoading || false);
  const [timeLeft, setTimeLeft] = React.useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Fetch products with discounts
  React.useEffect(() => {
    if (!initialProducts) {
      setLoading(true);
      fetch('/api/products?limit=6&sortBy=createdAt&sortOrder=desc')
        .then((res) => res.json())
        .then((data) => {
          // Filter products with discounts
          const productsList = data?.data || [];
          const discountedProducts = productsList.filter(
            (p: Product) => p.comparePrice && p.comparePrice > p.price
          );
          setProducts(discountedProducts.slice(0, 6));
        })
        .catch((err) => {
          console.error('Failed to fetch flash deals:', err);
          setProducts([]);
        })
        .finally(() => setLoading(false));
    }
  }, [initialProducts]);

  // Countdown timer to end of day
  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const difference = endOfDay.getTime() - now.getTime();

      return {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const calculateDiscount = (price: number, comparePrice: number | null) => {
    if (!comparePrice || comparePrice <= price) return 0;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  };

  if (products.length === 0 && !loading) {
    return null;
  }

  return (
    <section className="section-padding bg-gradient-to-br from-primary/5 via-white to-primary/5">
      <div className="container-custom">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">Flash Deals</h2>
                <p className="text-lg text-gray-600 mt-1">
                  Limited time offers - Grab them before they're gone!
                </p>
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="hidden md:flex items-center gap-4 bg-white rounded-2xl shadow-lg px-6 py-4">
            <Clock className="w-6 h-6 text-primary" />
            <div className="flex items-center gap-2">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500 font-medium">Hours</div>
              </div>
              <div className="text-2xl font-bold text-gray-400">:</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500 font-medium">Mins</div>
              </div>
              <div className="text-2xl font-bold text-gray-400">:</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500 font-medium">Secs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-64" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-6 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const discount = calculateDiscount(product.price, product.comparePrice);
              const imageUrl = product.images[0]?.url || '/placeholder-product.jpg';

              return (
                <Link key={product.id} href={`/products/${product.slug}`} className="group">
                  <Card className="overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-2xl h-full">
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <Image
                        src={imageUrl}
                        alt={product.images[0]?.altText || product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />

                      {/* Discount Badge */}
                      {discount > 0 && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-primary text-white text-lg font-bold px-3 py-1 shadow-lg">
                            {discount}% OFF
                          </Badge>
                        </div>
                      )}

                      {/* Flash Deal Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-yellow-500 text-gray-900 text-sm font-bold px-3 py-1 shadow-lg animate-pulse">
                          ⚡ FLASH DEAL
                        </Badge>
                      </div>
                    </div>

                    {/* Product Info */}
                    <CardContent className="p-5">
                      {/* Vendor Name */}
                      <p className="text-sm text-gray-500 mb-2 font-medium">
                        {product.vendor.vendorProfile.storeName}
                      </p>

                      {/* Product Name */}
                      <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>

                      {/* Price */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl font-extrabold text-primary">
                          ₹{product.price.toLocaleString()}
                        </span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="text-lg text-gray-400 line-through">
                            ₹{product.comparePrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* CTA Button */}
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
                        size="lg"
                      >
                        View Deal →
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* View All Button */}
        <div className="flex justify-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold text-lg px-10 py-7 rounded-2xl transition-all duration-300"
            onClick={() => (window.location.href = '/listings?sortBy=discount')}
          >
            View All Deals
          </Button>
        </div>
      </div>
    </section>
  );
}
