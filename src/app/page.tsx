import { HeroSection } from '@/components/home/hero-section'
import { VendorStories } from '@/components/home/vendor-stories'
import { FeaturedProducts } from '@/components/home/featured-products'
import { CategoriesSection } from '@/components/home/categories-section'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <VendorStories />
      <FeaturedProducts />
      <CategoriesSection />
    </main>
  )
}