'use client'

import * as React from 'react'
import { MapPin, Navigation, Phone, Star, Clock, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Business {
  id: string
  name: string
  description: string
  category: string
  location: string
  city: string
  latitude: number
  longitude: number
  rating: number
  reviewCount: number
  image: string
  isOpen: boolean
  openHours: string
  phoneNumber: string
  dealTitle?: string
  dealDiscount?: number
  verified?: boolean
  featured?: boolean
}

interface BusinessMapProps {
  businesses: Business[]
  center?: { lat: number; lng: number }
  zoom?: number
  selectedBusinessId?: string
  onBusinessSelect?: (business: Business) => void
  height?: string
  showControls?: boolean
  className?: string
}

// Mock map data for Kerala locations
const keralaCenter = { lat: 9.9312, lng: 76.2673 } // Kottayam coordinates

export function BusinessMap({
  businesses,
  center = keralaCenter,
  zoom = 12,
  selectedBusinessId,
  onBusinessSelect,
  height = '400px',
  showControls = true,
  className = ''
}: BusinessMapProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedBusiness, setSelectedBusiness] = React.useState<Business | null>(null)
  const [mapCenter, setMapCenter] = React.useState(center)
  const [mapZoom, setMapZoom] = React.useState(zoom)

  React.useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  React.useEffect(() => {
    if (selectedBusinessId) {
      const business = businesses.find(b => b.id === selectedBusinessId)
      if (business) {
        setSelectedBusiness(business)
        setMapCenter({ lat: business.latitude, lng: business.longitude })
      }
    }
  }, [selectedBusinessId, businesses])

  const handleBusinessClick = (business: Business) => {
    setSelectedBusiness(business)
    setMapCenter({ lat: business.latitude, lng: business.longitude })
    onBusinessSelect?.(business)
  }

  const handleCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self')
  }

  const handleDirections = (business: Business) => {
    const encodedLocation = encodeURIComponent(`${business.name}, ${business.location}`)
    window.open(`https://maps.google.com/?q=${encodedLocation}`, '_blank')
  }

  const zoomIn = () => {
    setMapZoom(prev => Math.min(prev + 1, 18))
  }

  const zoomOut = () => {
    setMapZoom(prev => Math.max(prev - 1, 8))
  }

  const resetView = () => {
    setMapCenter(center)
    setMapZoom(zoom)
    setSelectedBusiness(null)
  }

  if (isLoading) {
    return (
      <div
        className={`bg-gray-100 rounded-2xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-gray-100 rounded-2xl overflow-hidden ${className}`} style={{ height }}>
      {/* Mock Map Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
        {/* Grid pattern to simulate map */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#000" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Road lines */}
        <svg className="absolute inset-0 w-full h-full">
          <line x1="20%" y1="30%" x2="80%" y2="70%" stroke="#10b981" strokeWidth="3" />
          <line x1="10%" y1="60%" x2="90%" y2="40%" stroke="#10b981" strokeWidth="2" />
          <line x1="40%" y1="10%" x2="60%" y2="90%" stroke="#10b981" strokeWidth="2" />
        </svg>
      </div>

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={zoomIn}
            className="bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={zoomOut}
            className="bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={resetView}
            className="bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Business Markers */}
      <div className="absolute inset-0 z-20">
        {businesses.map((business, index) => {
          // Simulate marker positions based on index
          const left = 20 + (index % 5) * 15 + Math.random() * 10
          const top = 20 + Math.floor(index / 5) * 20 + Math.random() * 10
          const isSelected = selectedBusiness?.id === business.id

          return (
            <div
              key={business.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: `${Math.min(left, 85)}%`,
                top: `${Math.min(top, 80)}%`
              }}
              onClick={() => handleBusinessClick(business)}
            >
              {/* Marker */}
              <div className={`relative transition-all duration-300 ${
                isSelected ? 'scale-125' : 'hover:scale-110'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 ${
                  business.featured
                    ? 'bg-primary border-white text-white'
                    : business.verified
                    ? 'bg-green-500 border-white text-white'
                    : 'bg-white border-gray-300 text-primary'
                }`}>
                  <MapPin className="w-4 h-4" />
                </div>

                {/* Pulse animation for selected marker */}
                {isSelected && (
                  <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-30" />
                )}

                {/* Business preview on hover */}
                <div className={`absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
                  isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}>
                  <div className="bg-white rounded-lg shadow-xl border p-3 w-64">
                    <div className="flex gap-3">
                      <img
                        src={business.image}
                        alt={business.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <h4 className="font-semibold text-sm text-gray-900 truncate">
                            {business.name}
                          </h4>
                          {business.verified && (
                            <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0">
                              ✓
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-xs font-medium">{business.rating}</span>
                          <span className="text-xs text-gray-500">({business.reviewCount})</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span className={business.isOpen ? 'text-green-600' : 'text-red-600'}>
                            {business.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {business.dealTitle && (
                      <div className="mt-2 bg-gradient-to-r from-red-50 to-orange-50 border-l-2 border-primary px-2 py-1 rounded-r">
                        <p className="text-xs font-medium text-primary">{business.dealTitle}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCall(business.phoneNumber)
                        }}
                        className="flex-1 text-xs py-1 h-auto"
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDirections(business)
                        }}
                        className="flex-1 text-xs py-1 h-auto btn-gradient"
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        Directions
                      </Button>
                    </div>
                  </div>
                  {/* Pointer */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-30 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs">
        <h4 className="font-semibold mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Featured Business</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Verified Business</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white border border-gray-300 rounded-full"></div>
            <span>Regular Business</span>
          </div>
        </div>
      </div>

      {/* Search within map area button */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Search this area
        </Button>
      </div>
    </div>
  )
}