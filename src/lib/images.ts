// Image configuration for GrabtoGo - Local Deals & Business Discovery Platform
// All images sourced from local /public/images/ directory - NO external dependencies
export const imageConfig = {
  hero: {
    main: '/images/hero/hero-main.png',
    slider: [
      '/images/hero/hero-main.png',
      '/images/hero/hero-slider-1.png',
      '/images/hero/hero-slider-2.png',
    ],
    pattern: '/images/deals/banner-1.png', // Decorative pattern
  },
  categories: {
    'fashion-apparel': '/images/businesses/storefront-1.png',
    'home-appliances-electronics': '/images/businesses/storefront-2.png',
    'restaurants-cafes': '/images/businesses/storefront-3.png',
    'supermarkets-grocery': '/images/hero/hero-main.png',
    'jewellery-watches': '/images/hero/hero-slider-1.png',
    'furniture-home-decor': '/images/hero/hero-slider-2.png',
    'beauty-wellness': '/images/deals/banner-1.png',
    automotive: '/images/deals/banner-2.png',
  },
  businesses: {
    storefronts: [
      '/images/businesses/storefront-1.png',
      '/images/businesses/storefront-2.png',
      '/images/businesses/storefront-3.png',
    ],
    fashion: [
      '/images/businesses/storefront-1.png',
      '/images/businesses/storefront-2.png',
      '/images/businesses/storefront-3.png',
    ],
    electronics: [
      '/images/businesses/storefront-1.png',
      '/images/businesses/storefront-2.png',
      '/images/businesses/storefront-3.png',
    ],
    restaurants: [
      '/images/businesses/storefront-1.png',
      '/images/businesses/storefront-2.png',
      '/images/businesses/storefront-3.png',
    ],
    grocery: [
      '/images/businesses/storefront-1.png',
      '/images/businesses/storefront-2.png',
      '/images/businesses/storefront-3.png',
    ],
  },
  deals: {
    banners: [
      '/images/deals/banner-1.png',
      '/images/deals/banner-2.png',
      '/images/hero/hero-main.png',
    ],
    promotional: [
      '/images/deals/banner-1.png',
      '/images/deals/banner-2.png',
      '/images/hero/hero-slider-1.png',
    ],
  },
  kerala: {
    landmarks: [
      '/images/hero/hero-main.png',
      '/images/hero/hero-slider-1.png',
      '/images/hero/hero-slider-2.png',
    ],
    culture: [
      '/images/businesses/storefront-1.png',
      '/images/businesses/storefront-2.png',
      '/images/businesses/storefront-3.png',
    ],
  },
  testimonials: [
    '/images/businesses/storefront-1.png',
    '/images/businesses/storefront-2.png',
    '/images/businesses/storefront-3.png',
    '/images/hero/hero-main.png',
  ],
  misc: {
    mapPlaceholder: '/images/hero/hero-slider-2.png',
    businessOwner: '/images/businesses/storefront-1.png',
    handshake: '/images/businesses/storefront-2.png',
    growth: '/images/deals/banner-1.png',
  },
};

export const getRandomImage = (category: keyof typeof imageConfig): string => {
  const images = imageConfig[category];
  if (Array.isArray(images)) {
    return images[Math.floor(Math.random() * images.length)];
  }
  if (typeof images === 'object') {
    const values = Object.values(images).flat();
    return values[Math.floor(Math.random() * values.length)] as string;
  }
  return images;
};

export const getBusinessImage = (
  index: number,
  type: 'storefront' | 'category' = 'storefront'
): string => {
  if (type === 'storefront') {
    const images = imageConfig.businesses.storefronts;
    return images[index % images.length];
  }
  // For category-specific images, cycle through all business images
  const allBusinessImages = Object.values(imageConfig.businesses).flat();
  return allBusinessImages[index % allBusinessImages.length];
};

export const getCategoryImage = (categoryId: string): string => {
  return (
    imageConfig.categories[categoryId as keyof typeof imageConfig.categories] ||
    imageConfig.businesses.storefronts[0]
  );
};

export const getDealImage = (index: number): string => {
  const images = imageConfig.deals.promotional;
  return images[index % images.length];
};
