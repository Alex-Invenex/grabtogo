import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin, Clock } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDistance, getImageUrl } from '@/lib/utils'
import { Offer } from '@/types'

interface OfferCardProps {
  offer: Offer
  onFavoriteClick?: (offerId: string) => void
  isFavorited?: boolean
  showDistance?: boolean
  className?: string
}

export function OfferCard({
  offer,
  onFavoriteClick,
  isFavorited = false,
  showDistance = true,
  className
}: OfferCardProps) {
  const discountAmount = offer.originalPrice - offer.discountedPrice
  const timeRemaining = new Date(offer.validUntil).getTime() - new Date().getTime()
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))

  return (
    <Card className={`group overflow-hidden transition-all hover:shadow-lg ${className}`}>
      <div className="relative">
        {/* Offer Image */}
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={getImageUrl(offer.images[0] || '')}
            alt={offer.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Discount Badge */}
          <Badge
            variant="discount"
            className="absolute top-3 left-3 text-sm font-bold"
          >
            {offer.discountPercentage}% OFF
          </Badge>

          {/* Favorite Button */}
          {onFavoriteClick && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.preventDefault()
                onFavoriteClick(offer.id)
              }}
            >
              <Heart
                className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
              />
            </Button>
          )}

          {/* Time Remaining */}
          {daysRemaining <= 3 && daysRemaining > 0 && (
            <Badge variant="warning" className="absolute bottom-3 left-3">
              <Clock className="h-3 w-3 mr-1" />
              {daysRemaining === 1 ? 'Last day!' : `${daysRemaining} days left`}
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          {/* Vendor Name */}
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            {offer.vendor.companyName}
          </p>

          {/* Offer Title */}
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {offer.title}
          </h3>

          {/* Description */}
          {offer.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {offer.description}
            </p>
          )}

          {/* Pricing */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">
                {formatCurrency(offer.discountedPrice)}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(offer.originalPrice)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">You save</p>
              <p className="text-sm font-semibold text-green-600">
                {formatCurrency(discountAmount)}
              </p>
            </div>
          </div>

          {/* Location and Distance */}
          {showDistance && offer.distance !== undefined && (
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{formatDistance(offer.distance)} away</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Link href={`/offers/${offer.id}`} className="w-full">
            <Button className="w-full" variant="gradient">
              View Offer
            </Button>
          </Link>
        </CardFooter>
      </div>
    </Card>
  )
}