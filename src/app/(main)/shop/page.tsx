'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search, Filter, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  shortDesc: string | null;
  images: { url: string; altText: string | null }[];
  vendor: {
    id: string;
    name: string;
    vendorProfile: {
      storeName: string;
      storeSlug: string;
    } | null;
  };
  category: {
    name: string;
    slug: string;
  } | null;
  _count: {
    reviews: number;
  };
}

interface ProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ProductsResponse['pagination'] | null>(null);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy,
        sortOrder: 'desc',
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (priceRange[0] > 0) {
        params.append('minPrice', priceRange[0].toString());
      }

      if (priceRange[1] < 10000) {
        params.append('maxPrice', priceRange[1].toString());
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      const data: ProductsResponse = await response.json();

      setProducts(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, sortBy, priceRange]);

  // Handle search
  const handleSearch = () => {
    setPage(1); // Reset to first page
    fetchProducts();
  };

  // Get user location
  const getUserLocation = () => {
    setLocationLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationLoading(false);
          // You can now filter products by location here
          // This would require updating the API to support location-based filtering
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
          setLocationLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setLocationLoading(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('createdAt');
    setPriceRange([0, 10000]);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="container-custom py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Shop All Products</h1>
          <p className="text-lg text-gray-600">Discover amazing products from local vendors near you</p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Search and Location Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Search Button */}
            <Button onClick={handleSearch} size="lg" className="h-12 px-6">
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>

            {/* Location Button */}
            <Button
              onClick={getUserLocation}
              variant="outline"
              size="lg"
              className="h-12 px-6"
              disabled={locationLoading}
            >
              <MapPin className="h-5 w-5 mr-2" />
              {locationLoading ? 'Detecting...' : userLocation ? 'Location Set' : 'Near Me'}
            </Button>

            {/* Mobile Filter Toggle */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="lg"
              className="h-12 px-6 md:hidden"
            >
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              Filters
            </Button>
          </div>

          {userLocation && (
            <div className="mt-3 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Showing products near your location
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUserLocation(null)}
                className="text-green-700 hover:text-green-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`${
              showFilters ? 'block' : 'hidden'
            } md:block w-full md:w-64 bg-white rounded-xl shadow-sm p-6 h-fit sticky top-24`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-primary"
              >
                Reset
              </Button>
            </div>

            {/* Sort By */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Newest First</SelectItem>
                  <SelectItem value="price">Price: Low to High</SelectItem>
                  <SelectItem value="name">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Price Range
              </label>
              <Slider
                min={0}
                max={10000}
                step={100}
                value={priceRange}
                onValueChange={setPriceRange}
                className="mb-3"
              />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>₹{priceRange[0]}</span>
                <span>₹{priceRange[1]}</span>
              </div>
            </div>

            {/* Active Filters */}
            {(searchQuery || priceRange[0] > 0 || priceRange[1] < 10000 || userLocation) && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Active Filters</h3>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {searchQuery}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setSearchQuery('');
                          fetchProducts();
                        }}
                      />
                    </Badge>
                  )}
                  {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                    <Badge variant="secondary" className="gap-1">
                      ₹{priceRange[0]} - ₹{priceRange[1]}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setPriceRange([0, 10000])}
                      />
                    </Badge>
                  )}
                  {userLocation && (
                    <Badge variant="secondary" className="gap-1">
                      Near Me
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setUserLocation(null)}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {/* Results Count */}
            {pagination && (
              <div className="mb-4 text-sm text-gray-600">
                Showing {products.length} of {pagination.total} products
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-gray-200 animate-pulse" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search or filters to find what you're looking for
                  </p>
                  <Button onClick={resetFilters} variant="outline">
                    Reset Filters
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group"
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-square relative bg-gray-100">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.images[0].altText || product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                          {product.comparePrice && (
                            <Badge className="absolute top-3 right-3 bg-red-500">
                              {Math.round(
                                ((product.comparePrice - product.price) /
                                  product.comparePrice) *
                                  100
                              )}
                              % OFF
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="mb-2">
                            <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              by {product.vendor.vendorProfile?.storeName || product.vendor.name}
                            </p>
                          </div>
                          {product.shortDesc && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {product.shortDesc}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-bold text-gray-900">
                                ₹{product.price.toLocaleString()}
                              </span>
                              {product.comparePrice && (
                                <span className="text-sm text-gray-500 line-through ml-2">
                                  ₹{product.comparePrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {product._count.reviews > 0 && (
                              <span className="text-sm text-gray-600">
                                ({product._count.reviews} reviews)
                              </span>
                            )}
                          </div>
                          {product.category && (
                            <Badge variant="outline" className="mt-3">
                              {product.category.name}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      onClick={() => setPage(page - 1)}
                      disabled={!pagination.hasPrev}
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      {[...Array(pagination.totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        // Show first, last, current, and adjacent pages
                        if (
                          pageNum === 1 ||
                          pageNum === pagination.totalPages ||
                          (pageNum >= page - 1 && pageNum <= page + 1)
                        ) {
                          return (
                            <Button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              variant={pageNum === page ? 'default' : 'outline'}
                              size="sm"
                            >
                              {pageNum}
                            </Button>
                          );
                        } else if (pageNum === page - 2 || pageNum === page + 2) {
                          return <span key={pageNum}>...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <Button
                      onClick={() => setPage(page + 1)}
                      disabled={!pagination.hasNext}
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
