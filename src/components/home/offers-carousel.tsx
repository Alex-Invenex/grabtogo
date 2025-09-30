'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Tag, Clock, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getBusinessImage } from '@/lib/images';

interface Offer {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  discount: string;
  code?: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  backgroundColor: string;
  textColor: string;
  endDate?: Date;
}

const offers: Offer[] = [
  {
    id: '1',
    title: 'Weekend Flash Sale',
    subtitle: 'Limited Time Offer',
    description: 'Get exclusive discounts on all electronics and home appliances',
    discount: 'UP TO 50% OFF',
    code: 'WEEKEND50',
    imageUrl: getBusinessImage(0, 'storefront'),
    ctaText: 'Shop Now',
    ctaLink: '/listings?category=home-appliances-electronics',
    backgroundColor: 'from-purple-600 to-blue-600',
    textColor: 'text-white',
  },
  {
    id: '2',
    title: 'Fashion Fiesta',
    subtitle: 'New Arrivals',
    description: 'Discover the latest trends in fashion and apparel with amazing deals',
    discount: '40% OFF',
    code: 'FASHION40',
    imageUrl: getBusinessImage(1, 'storefront'),
    ctaText: 'Explore Collection',
    ctaLink: '/listings?category=fashion-apparel',
    backgroundColor: 'from-pink-600 to-rose-600',
    textColor: 'text-white',
  },
  {
    id: '3',
    title: 'Food Festival',
    subtitle: 'Best Local Eats',
    description: 'Order from your favorite restaurants and cafes with special offers',
    discount: '₹200 OFF',
    code: 'FOOD200',
    imageUrl: getBusinessImage(2, 'storefront'),
    ctaText: 'Order Now',
    ctaLink: '/listings?category=restaurants-cafes',
    backgroundColor: 'from-orange-600 to-red-600',
    textColor: 'text-white',
  },
  {
    id: '4',
    title: 'Home Makeover',
    subtitle: 'Furniture & Decor',
    description: 'Transform your space with stunning furniture and home decor items',
    discount: '35% OFF',
    code: 'HOME35',
    imageUrl: getBusinessImage(3, 'storefront'),
    ctaText: 'Shop Collection',
    ctaLink: '/listings?category=furniture-home-decor',
    backgroundColor: 'from-teal-600 to-cyan-600',
    textColor: 'text-white',
  },
  {
    id: '5',
    title: 'Jewelry Extravaganza',
    subtitle: 'Premium Collection',
    description: 'Shine bright with our exclusive jewelry and watches collection',
    discount: '30% OFF',
    code: 'JEWEL30',
    imageUrl: getBusinessImage(4, 'storefront'),
    ctaText: 'View Collection',
    ctaLink: '/listings?category=jewellery-watches',
    backgroundColor: 'from-yellow-600 to-amber-600',
    textColor: 'text-white',
  },
];

export function OffersCarousel() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true);

  const nextSlide = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  }, []);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play carousel
  React.useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const currentOffer = offers[currentIndex];

  return (
    <section className="py-8 bg-gray-50">
      <div className="container-custom">
        <Card
          className="relative overflow-hidden shadow-2xl"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Carousel Content */}
          <div
            className={`relative bg-gradient-to-r ${currentOffer.backgroundColor} overflow-hidden`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '32px 32px',
                }}
              />
            </div>

            <div className="relative grid lg:grid-cols-2 gap-8 p-8 md:p-12 lg:p-16 items-center min-h-[400px]">
              {/* Left Side - Content */}
              <div className={`space-y-6 ${currentOffer.textColor} z-10`}>
                {/* Subtitle Badge */}
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 text-sm font-semibold">
                  <Tag className="w-4 h-4 mr-2" />
                  {currentOffer.subtitle}
                </Badge>

                {/* Main Title */}
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                  {currentOffer.title}
                </h2>

                {/* Description */}
                <p className="text-lg md:text-xl opacity-90 max-w-xl leading-relaxed">
                  {currentOffer.description}
                </p>

                {/* Discount Badge */}
                <div className="inline-block">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 border-2 border-white/30">
                    <p className="text-3xl md:text-4xl font-extrabold">{currentOffer.discount}</p>
                  </div>
                </div>

                {/* Promo Code */}
                {currentOffer.code && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium opacity-80">Use Code:</span>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border-2 border-white/30 border-dashed">
                      <code className="text-xl font-bold tracking-wider">{currentOffer.code}</code>
                    </div>
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    size="lg"
                    className="bg-white text-gray-900 hover:bg-gray-100 font-bold text-lg px-10 py-7 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    onClick={() => (window.location.href = currentOffer.ctaLink)}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {currentOffer.ctaText}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/50 text-white hover:bg-white/20 font-bold px-10 py-7 rounded-2xl backdrop-blur-sm transition-all duration-300"
                    onClick={() => (window.location.href = '/listings')}
                  >
                    View All Offers
                  </Button>
                </div>
              </div>

              {/* Right Side - Image */}
              <div className="relative hidden lg:block">
                <div className="relative aspect-square max-w-lg mx-auto">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl transform rotate-6"></div>
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                    <Image
                      src={currentOffer.imageUrl}
                      alt={currentOffer.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {/* Floating Info Card */}
                  <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-2xl p-6 max-w-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase">
                          Limited Time
                        </div>
                        <div className="text-lg font-bold text-gray-900">Offer Ends Soon!</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 text-white z-20"
              aria-label="Previous offer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 text-white z-20"
              aria-label="Next offer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {offers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
