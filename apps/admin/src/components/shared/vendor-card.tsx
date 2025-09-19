import Image from 'next/image'
import Link from 'next/link'
import { Star, Heart, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatDistance, getImageUrl } from '@/lib/utils'
import { Vendor } from '@/types'

interface VendorCardProps {
  vendor: Vendor
  onFavoriteClick?: (vendorId: string) => void
  isFavorited?: boolean
  showDistance?: boolean
  className?: string
}

export function VendorCard({
  vendor,
  onFavoriteClick,
  isFavorited = false,
  showDistance = true,
  className
}: VendorCardProps) {
  const isOpen = checkIfOpen(vendor.hours || null)
  const distance = vendor.location ? calculateDistance(vendor.location) : undefined

  return (
    <Card className={`group overflow-hidden transition-all hover:shadow-lg ${className}`}>
      <div className="relative">
        {/* Cover Image */}
        <div className="relative h-32 w-full overflow-hidden bg-gray-100">
          {vendor.coverImage && (
            <Image
              src={getImageUrl(vendor.coverImage)}
              alt={`${vendor.companyName} cover`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}

          {/* Favorite Button */}
          {onFavoriteClick && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.preventDefault()
                onFavoriteClick(vendor.id)
              }}
            >
              <Heart
                className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
              />
            </Button>
          )}

          {/* Verification Badge */}
          {vendor.isVerified && (
            <Badge variant="success" className="absolute top-2 left-2 text-xs">
              Verified
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          {/* Vendor Logo and Basic Info */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-12 w-12 border-2 border-white -mt-6 bg-white">
              <AvatarImage
                src={getImageUrl(vendor.logo || '')}
                alt={vendor.companyName}
              />
              <AvatarFallback className="bg-primary text-white font-semibold">
                {vendor.companyName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {vendor.companyName}
              </h3>

              {/* Rating and Reviews */}
              <div className="flex items-center gap-1 mb-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">
                  {vendor.stats.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({vendor.stats.totalReviews} reviews)
                </span>
              </div>

              {/* Status and Distance */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isOpen ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className={isOpen ? 'text-green-600' : 'text-red-600'}>
                    {isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                {showDistance && distance !== undefined && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{formatDistance(distance)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {vendor.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {vendor.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{vendor.stats.totalOffers} active offers</span>
            <span>{vendor.stats.totalProducts} products</span>
          </div>
        </CardContent>

        {/* Quick Actions */}
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <Link href={`/vendors/${vendor.id}`} className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                View Store
              </Button>
            </Link>
            <Link href={`/vendors/${vendor.id}/offers`} className="flex-1">
              <Button variant="gradient" className="w-full" size="sm">
                View Offers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Helper functions
function checkIfOpen(hours: Record<string, any> | null): boolean {
  if (!hours) return false

  const now = new Date()
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() // 'monday', 'tuesday', etc.
  const currentTime = now.getHours() * 60 + now.getMinutes() // minutes since midnight

  const dayHours = hours[currentDay]
  if (!dayHours || dayHours.isClosed) return false

  const [openHour, openMin] = dayHours.open.split(':').map(Number)
  const [closeHour, closeMin] = dayHours.close.split(':').map(Number)

  const openTime = openHour * 60 + openMin
  const closeTime = closeHour * 60 + closeMin

  return currentTime >= openTime && currentTime <= closeTime
}

function calculateDistance(_location: Record<string, any>): number {
  // This would normally use the user's current location
  // For now, return a mock distance
  return Math.random() * 10
}