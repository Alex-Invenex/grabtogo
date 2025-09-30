'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Flame, Star, ShoppingBag, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  comparePrice: number | null
  shortDesc: string | null
  images: { url: string; altText: string | null }[]
  vendor: {
    name: string
    vendorProfile: {
      storeName: string
      storeSlug: string
    }
  }
  viewCount: number
  _count: {
    reviews: number
  }
}

interface TrendingProductsProps {
  products?: Product[]
  loading?: boolean
}

export function TrendingProducts({ products: initialProducts, loading: initialLoading }: TrendingProductsProps) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts || [])
  const [loading, setLoading] = React.useState(initialLoading || false)

  // Fetch trending products
  React.useEffect(() => {
    if (!initialProducts) {
      setLoading(true)
      fetch('/api/products?limit=8&sortBy=viewCount&sortOrder=desc')
        .then(res => res.json())
        .then(data => {
          setProducts(data.data)
        })
        .catch(err => console.error('Failed to fetch trending products:', err))
        .finally(() => setLoading(false))
    }
  }, [initialProducts])

  const calculateDiscount = (price: number, comparePrice: number | null) => {
    if (!comparePrice || comparePrice <= price) return 0
    return Math.round(((comparePrice - price) / comparePrice) * 100)
  }

  if (products.length === 0 && !loading) {
    return null
  }

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Trending Now
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Most viewed and popular products that everyone's talking about
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-72" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-6 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => {
              const discount = calculateDiscount(product.price, product.comparePrice)
              const imageUrl = product.images[0]?.url || '/placeholder-product.jpg'

              return (
                <HoverCard key={product.id} openDelay={200}>
                  <HoverCardTrigger asChild>
                    <Link href={`/products/${product.slug}`} className="group">
                      <Card className="overflow-hidden border-2 hover:border-orange-500 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 h-full">
                        {/* Product Image */}
                        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                          <Image
                            src={imageUrl}
                            alt={product.images[0]?.altText || product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />

                          {/* Trending Badge */}
                          {index < 3 && (
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold px-3 py-1 shadow-lg">
                                🔥 #{index + 1} Trending
                              </Badge>
                            </div>
                          )}

                          {/* Discount Badge */}
                          {discount > 0 && (
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-green-500 text-white text-sm font-bold px-3 py-1 shadow-lg">
                                {discount}% OFF
                              </Badge>
                            </div>
                          )}

                          {/* Quick View Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <Button
                              className="bg-white text-gray-900 hover:bg-gray-100 font-bold"
                              size="lg"
                            >
                              <Eye className="w-5 h-5 mr-2" />
                              Quick View
                            </Button>
                          </div>

                          {/* View Count */}
                          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-white" />
                            <span className="text-sm font-medium text-white">{product.viewCount}</span>
                          </div>
                        </div>

                        {/* Product Info */}
                        <CardContent className="p-4">
                          {/* Vendor Name */}
                          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                            {product.vendor.vendorProfile.storeName}
                          </p>

                          {/* Product Name */}
                          <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors min-h-[48px]">
                            {product.name}
                          </h3>

                          {/* Price */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl font-extrabold text-gray-900">
                              ₹{product.price.toLocaleString()}
                            </span>
                            {product.comparePrice && product.comparePrice > product.price && (
                              <span className="text-sm text-gray-400 line-through">
                                ₹{product.comparePrice.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Reviews Count */}
                          {product._count.reviews > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              </div>
                              <span>{product._count.reviews} reviews</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </HoverCardTrigger>

                  <HoverCardContent className="w-80" side="top">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">{product.name}</h4>
                      {product.shortDesc && (
                        <p className="text-sm text-gray-600">{product.shortDesc}</p>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-lg font-bold text-primary">
                          ₹{product.price.toLocaleString()}
                        </span>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              )
            })}
          </div>
        )}

        {/* View All Button */}
        <div className="flex justify-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-bold text-lg px-10 py-7 rounded-2xl transition-all duration-300"
            onClick={() => window.location.href = '/listings?sortBy=viewCount'}
          >
            Explore More Trending Products
          </Button>
        </div>
      </div>
    </section>
  )
}