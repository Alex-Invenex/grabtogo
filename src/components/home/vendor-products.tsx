'use client';

import * as React from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/products/product-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Package, ShoppingBag } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  images?: { url: string; altText: string | null }[];
  vendor?: {
    id?: string;
    vendorProfile?: {
      storeName: string;
      storeSlug: string;
    } | null;
  } | null;
  _count?: {
    reviews: number;
  };
  isFeatured?: boolean;
  quantity?: number;
}

interface VendorProductsProps {
  initialProducts?: Product[];
  initialLoading?: boolean;
}

export function VendorProducts({ initialProducts, initialLoading }: VendorProductsProps) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = React.useState(initialLoading || false);

  // Fetch products from API
  React.useEffect(() => {
    if (!initialProducts) {
      setLoading(true);
      fetch('/api/products?limit=12&sortBy=createdAt&sortOrder=desc')
        .then((res) => res.json())
        .then((data) => {
          setProducts(data?.data || []);
        })
        .catch((err) => {
          console.error('Failed to fetch vendor products:', err);
          setProducts([]);
        })
        .finally(() => setLoading(false));
    }
  }, [initialProducts]);

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 md:mb-12">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                Latest Products
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              Discover the newest arrivals from our verified local vendors. Fresh products added
              daily!
            </p>
          </div>
          <Link href="/shop">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold text-sm px-6 py-6 rounded-xl transition-all duration-300"
            >
              View All Products
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <Skeleton className="h-48 w-full" />
                <div className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600 mb-6">
              There are no products available at the moment. Check back soon!
            </p>
            <Link href="/auth/register/vendor">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-6 rounded-xl"
              >
                Become a Vendor
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
