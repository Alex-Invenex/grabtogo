import { HeroSection } from '@/components/home/hero-section'
import { SearchSection } from '@/components/home/search-section'
import { OffersCarousel } from '@/components/home/offers-carousel'
import { VendorStories } from '@/components/home/vendor-stories'
import { FlashDeals } from '@/components/home/flash-deals'
import { CategoriesSection } from '@/components/home/categories-section'
import { TrendingProducts } from '@/components/home/trending-products'
import { WhyChooseUs } from '@/components/home/why-choose-us'
import { SocialProof } from '@/components/home/social-proof'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section with Enhanced CTAs */}
      <HeroSection />

      {/* Search Bar for Quick Discovery */}
      <SearchSection />

      {/* Promotional Offers Carousel */}
      <OffersCarousel />

      {/* Vendor Stories (Instagram-style) */}
      <VendorStories />

      {/* Flash Deals with Countdown Timer */}
      <FlashDeals />

      {/* Popular Categories */}
      <CategoriesSection />

      {/* Trending Products Section */}
      <TrendingProducts />

      {/* Why Choose Us - Benefits */}
      <WhyChooseUs />

      {/* Customer Testimonials and Reviews */}
      <SocialProof />
    </main>
  )
}