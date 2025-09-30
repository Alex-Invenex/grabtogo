import { HeroSection } from '@/components/home/hero-section'
import { PartnersSection } from '@/components/home/partners-section'
import { SearchSection } from '@/components/home/search-section'
import { VendorStories } from '@/components/home/vendor-stories'
import { CategoriesSection } from '@/components/home/categories-section'
import { JourneySection } from '@/components/home/journey-section'
import { FeaturedProducts } from '@/components/home/featured-products'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <SearchSection />
      <VendorStories />
      <CategoriesSection />
      <PartnersSection />
      <JourneySection />
      <FeaturedProducts />
    </main>
  )
}