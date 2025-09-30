'use client'

import * as React from 'react'
import Link from 'next/link'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { getCategoryImage } from '@/lib/images'

interface Category {
  id: string
  name: string
  image: string
  price: string
  rating: number
}

const categories: Category[] = [
  {
    id: 'fashion-apparel',
    name: 'Fashion & Apparel',
    image: getCategoryImage('fashion-apparel'),
    price: '$7K-Lux',
    rating: 4.8
  },
  {
    id: 'home-appliances-electronics',
    name: 'Electronics',
    image: getCategoryImage('home-appliances-electronics'),
    price: '$5K-Pro',
    rating: 4.7
  },
  {
    id: 'restaurants-cafes',
    name: 'Restaurants',
    image: getCategoryImage('restaurants-cafes'),
    price: '$2K-Dlx',
    rating: 4.9
  },
  {
    id: 'supermarkets-grocery',
    name: 'Grocery',
    image: getCategoryImage('supermarkets-grocery'),
    price: '$1K-Eco',
    rating: 4.6
  },
  {
    id: 'jewellery-watches',
    name: 'Jewelry',
    image: getCategoryImage('jewellery-watches'),
    price: '$10K-Lux',
    rating: 4.9
  },
  {
    id: 'furniture-home-decor',
    name: 'Furniture',
    image: getCategoryImage('furniture-home-decor'),
    price: '$3K-Com',
    rating: 4.7
  }
]

export function CategoriesSection() {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(true)

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  React.useEffect(() => {
    checkScrollButtons()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollButtons)
      window.addEventListener('resize', checkScrollButtons)
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScrollButtons)
      }
      window.removeEventListener('resize', checkScrollButtons)
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
              Popular Destination
            </h2>
            <p className="text-lg text-gray-600">
              Explore trending categories and deals
            </p>
          </div>

          {/* Navigation Arrows - Desktop Only */}
          <div className="hidden md:flex items-center gap-2">
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-300 shadow-md"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-300 shadow-md"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Destination Cards - Horizontal Scroll */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="flex-shrink-0 w-80"
              >
                <div className="destination-card h-96">
                  {/* Price Badge - Circular */}
                  <div className="price-badge-circle">
                    <span className="leading-tight">
                      {category.price}
                    </span>
                  </div>

                  {/* Image */}
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay Content */}
                  <div className="destination-card-overlay">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-bold text-white">{category.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Scroll Indicators */}
        <div className="flex md:hidden justify-center gap-2 mt-6">
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-300"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-300"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}