'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Heart, ShoppingCart, Store, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getBusinessImage } from '@/lib/images';

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

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
  className?: string;
}

export function ProductCard({ product, layout = 'grid', className = '' }: ProductCardProps) {
  const [isLiked, setIsLiked] = React.useState(false);

  // Calculate discount percentage
  const calculateDiscount = () => {
    if (!product.comparePrice || product.comparePrice <= product.price) return 0;
    return Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
  };

  const discount = calculateDiscount();
  const productImage =
    product.images && product.images.length > 0
      ? product.images[0].url
      : getBusinessImage(0, 'storefront');
  const storeName = product.vendor?.vendorProfile?.storeName || 'Unknown Vendor';
  const storeSlug = product.vendor?.vendorProfile?.storeSlug || '';
  const reviewCount = product._count?.reviews || 0;
  const isOutOfStock = product.quantity !== undefined && product.quantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', product.id);
  };

  // Grid Layout (default)
  return (
    <Link href={`/shop/${product.slug}`}>
      <div className={`business-card group relative ${className}`}>
        {/* Image Container */}
        <div className="relative h-48 overflow-hidden rounded-t-2xl">
          <Image
            src={productImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isFeatured && (
              <Badge className="bg-primary text-white border-0 px-2 py-1 text-xs">Featured</Badge>
            )}
            {discount > 0 && (
              <Badge className="bg-red-500 text-white border-0 px-2 py-1 text-xs font-bold">
                {discount}% OFF
              </Badge>
            )}
            {isOutOfStock && (
              <Badge className="bg-gray-800 text-white border-0 px-2 py-1 text-xs">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Like Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Heart
              className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>

          {/* Add to Cart Button (hover) */}
          {!isOutOfStock && (
            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <Button
                size="sm"
                onClick={handleAddToCart}
                className="w-full glass-dark backdrop-blur-md text-white border-white/30 hover:bg-white/20"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Vendor Name */}
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-3 h-3 text-gray-400" />
            <Link
              href={`/vendor/${storeSlug}`}
              className="text-xs text-gray-500 hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {storeName}
            </Link>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Price Section */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl font-bold text-gray-900 rupee-symbol">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-sm text-gray-500 line-through rupee-symbol">
                ₹{product.comparePrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Reviews */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">4.5</span>
              <span className="text-gray-400">({reviewCount} reviews)</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
