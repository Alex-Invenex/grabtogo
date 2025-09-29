'use client'

import * as React from 'react'
import Link from 'next/link'
import { Star, ShoppingCart, Heart, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductCardSkeleton } from '@/components/ui/loading-states'
import { formatPrice } from '@/lib/utils'

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  rating: number
  reviewCount: number
  vendor: {
    id: string
    name: string
    location: string
  }
  category: {
    id: string
    name: string
  }
  inStock: boolean
  featured: boolean
}

interface FeaturedProductsProps {
  products?: Product[]
  loading?: boolean
}

export function FeaturedProducts({ products = [], loading = false }: FeaturedProductsProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <section className="py-12">
        <div className="container">
          <h2 className="mb-8 text-3xl font-bold">Featured Products</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="py-12">
        <div className="container">
          <h2 className="mb-8 text-3xl font-bold">Featured Products</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Mock data for demonstration
  const mockProducts: Product[] = products.length > 0 ? products : [
    {
      id: '1',
      name: 'Fresh Organic Mangoes',
      description: 'Sweet and juicy organic mangoes from local farms',
      price: 299,
      originalPrice: 399,
      images: ['/api/placeholder/300/300'],
      rating: 4.8,
      reviewCount: 156,
      vendor: {
        id: 'vendor1',
        name: 'Fresh Fruits Co',
        location: 'Mumbai, Maharashtra'
      },
      category: {
        id: 'fruits',
        name: 'Fruits'
      },
      inStock: true,
      featured: true
    },
    {
      id: '2',
      name: 'Artisan Chocolate Croissant',
      description: 'Freshly baked chocolate croissants made daily',
      price: 150,
      images: ['/api/placeholder/300/300'],
      rating: 4.9,
      reviewCount: 89,
      vendor: {
        id: 'vendor2',
        name: 'Baker\'s Delight',
        location: 'Delhi, NCR'
      },
      category: {
        id: 'bakery',
        name: 'Bakery'
      },
      inStock: true,
      featured: true
    },
    {
      id: '3',
      name: 'Wireless Bluetooth Earbuds',
      description: 'High-quality sound with noise cancellation',
      price: 2999,
      originalPrice: 4999,
      images: ['/api/placeholder/300/300'],
      rating: 4.5,
      reviewCount: 234,
      vendor: {
        id: 'vendor3',
        name: 'Tech Gadgets',
        location: 'Bangalore, Karnataka'
      },
      category: {
        id: 'electronics',
        name: 'Electronics'
      },
      inStock: true,
      featured: true
    },
    {
      id: '4',
      name: 'Handwoven Cotton Kurta',
      description: 'Traditional handwoven cotton kurta for men',
      price: 1299,
      originalPrice: 1799,
      images: ['/api/placeholder/300/300'],
      rating: 4.7,
      reviewCount: 178,
      vendor: {
        id: 'vendor4',
        name: 'Fashion Hub',
        location: 'Jaipur, Rajasthan'
      },
      category: {
        id: 'fashion',
        name: 'Fashion'
      },
      inStock: true,
      featured: true
    },
    {
      id: '5',
      name: 'Premium Green Tea',
      description: 'Organic green tea leaves from Himalayan gardens',
      price: 599,
      images: ['/api/placeholder/300/300'],
      rating: 4.6,
      reviewCount: 92,
      vendor: {
        id: 'vendor5',
        name: 'Tea Garden',
        location: 'Darjeeling, West Bengal'
      },
      category: {
        id: 'beverages',
        name: 'Beverages'
      },
      inStock: true,
      featured: true
    },
    {
      id: '6',
      name: 'Handcrafted Pottery Vase',
      description: 'Beautiful handcrafted ceramic vase for home decor',
      price: 899,
      images: ['/api/placeholder/300/300'],
      rating: 4.4,
      reviewCount: 67,
      vendor: {
        id: 'vendor6',
        name: 'Craft Corner',
        location: 'Khurja, Uttar Pradesh'
      },
      category: {
        id: 'home-decor',
        name: 'Home Decor'
      },
      inStock: false,
      featured: true
    },
    {
      id: '7',
      name: 'Organic Honey',
      description: 'Pure organic honey from wildflower meadows',
      price: 450,
      images: ['/api/placeholder/300/300'],
      rating: 4.9,
      reviewCount: 312,
      vendor: {
        id: 'vendor7',
        name: 'Bee Farm',
        location: 'Himachal Pradesh'
      },
      category: {
        id: 'food',
        name: 'Food'
      },
      inStock: true,
      featured: true
    },
    {
      id: '8',
      name: 'Yoga Mat with Strap',
      description: 'Premium non-slip yoga mat with carrying strap',
      price: 1599,
      originalPrice: 2199,
      images: ['/api/placeholder/300/300'],
      rating: 4.5,
      reviewCount: 145,
      vendor: {
        id: 'vendor8',
        name: 'Fitness Store',
        location: 'Pune, Maharashtra'
      },
      category: {
        id: 'sports',
        name: 'Sports & Fitness'
      },
      inStock: true,
      featured: true
    }
  ]

  const handleAddToCart = (productId: string) => {
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', productId)
  }

  const handleToggleWishlist = (productId: string) => {
    // TODO: Implement wishlist functionality
    console.log('Toggle wishlist:', productId)
  }

  return (
    <section className="py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <Link
            href="/products"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all products
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {mockProducts.map((product) => (
            <Card key={product.id} className="group overflow-hidden">
              <div className="relative">
                <Link href={`/products/${product.id}`}>
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                </Link>

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.originalPrice && (
                    <Badge variant="destructive">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </Badge>
                  )}
                  {!product.inStock && (
                    <Badge variant="secondary">Out of Stock</Badge>
                  )}
                </div>

                {/* Wishlist button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
                  onClick={() => handleToggleWishlist(product.id)}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>

              <CardContent className="p-4">
                <div className="mb-2">
                  <Badge variant="outline" className="text-xs">
                    {product.category.name}
                  </Badge>
                </div>

                <Link href={`/products/${product.id}`}>
                  <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>

                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {product.description}
                </p>

                <div className="flex items-center gap-1 mt-2">
                  <div className="flex items-center">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium ml-1">{product.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({product.reviewCount} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{product.vendor.location}</span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span className="text-lg font-bold">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  className="w-full"
                  onClick={() => handleAddToCart(product.id)}
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {mockProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No featured products available</p>
          </div>
        )}
      </div>
    </section>
  )
}