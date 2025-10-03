'use client';

import { HeroSection } from '@/components/home/hero-section';
import { VendorStories } from '@/components/home/vendor-stories';
import { VendorProducts } from '@/components/home/vendor-products';
import { FlashDeals } from '@/components/home/flash-deals';
import { CategoriesSection } from '@/components/home/categories-section';
import { WhyChooseUs } from '@/components/home/why-choose-us';
import { SocialProof } from '@/components/home/social-proof';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Vendor Stories */}
      <VendorStories />

      {/* Hero Section */}
      <HeroSection />

      {/* Latest Vendor Products */}
      <VendorProducts />

      {/* Flash Deals with Countdown Timer */}
      <FlashDeals />

      {/* Popular Categories */}
      <CategoriesSection />

      {/* Why Choose Us - Benefits */}
      <WhyChooseUs />

      {/* Customer Testimonials and Reviews */}
      <SocialProof />
    </main>
  );
}
