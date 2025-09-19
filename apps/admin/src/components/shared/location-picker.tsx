'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapLocation } from '@/types'

interface LocationPickerProps {
  onLocationSelect: (location: MapLocation & { address?: string }) => void
  initialLocation?: MapLocation
  className?: string
}

interface LocationSuggestion {
  place_id: string
  description: string
  main_text: string
  secondary_text: string
}

export function LocationPicker({
  onLocationSelect,
  initialLocation,
  className
}: LocationPickerProps) {
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(
    initialLocation || null
  )
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<string>('')

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    setIsGettingLocation(true)

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser')
      setIsGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }

        setCurrentLocation(location)

        // Get address from coordinates
        try {
          const address = await reverseGeocode(location)
          setSelectedAddress(address)
          onLocationSelect({ ...location, address })
        } catch (error) {
          console.error('Error getting address:', error)
          onLocationSelect(location)
        }

        setIsGettingLocation(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }, [onLocationSelect])

  // Search for locations
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    setIsSearching(true)

    try {
      // This would normally use Google Places API
      // For now, we'll simulate the search with mock data
      const mockSuggestions: LocationSuggestion[] = [
        {
          place_id: '1',
          description: `${query}, Delhi, India`,
          main_text: query,
          secondary_text: 'Delhi, India'
        },
        {
          place_id: '2',
          description: `${query}, Mumbai, Maharashtra, India`,
          main_text: query,
          secondary_text: 'Mumbai, Maharashtra, India'
        },
        {
          place_id: '3',
          description: `${query}, Bangalore, Karnataka, India`,
          main_text: query,
          secondary_text: 'Bangalore, Karnataka, India'
        }
      ]

      setSuggestions(mockSuggestions)
    } catch (error) {
      console.error('Error searching locations:', error)
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Handle location search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocations(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchLocations])

  // Select a location from suggestions
  const selectLocation = async (suggestion: LocationSuggestion) => {
    try {
      // This would normally use Google Places API to get coordinates
      // For now, we'll use mock coordinates for Indian cities
      const mockCoordinates = getMockCoordinates(suggestion.secondary_text)

      setCurrentLocation(mockCoordinates)
      setSelectedAddress(suggestion.description)
      setSuggestions([])
      setSearchQuery('')

      onLocationSelect({
        ...mockCoordinates,
        address: suggestion.description
      })
    } catch (error) {
      console.error('Error selecting location:', error)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Location Button */}
        <Button
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          variant="outline"
          className="w-full"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Getting location...
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Use Current Location
            </>
          )}
        </Button>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Search Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                onClick={() => selectLocation(suggestion)}
                className="w-full p-3 text-left rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="font-medium">{suggestion.main_text}</div>
                <div className="text-sm text-muted-foreground">
                  {suggestion.secondary_text}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected Location */}
        {currentLocation && selectedAddress && (
          <div className="p-3 bg-accent rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">Selected Location</span>
            </div>
            <p className="text-sm text-muted-foreground">{selectedAddress}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">
                Lat: {currentLocation.lat.toFixed(6)}
              </Badge>
              <Badge variant="outline">
                Lng: {currentLocation.lng.toFixed(6)}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper functions
async function reverseGeocode(location: MapLocation): Promise<string> {
  // This would normally use Google Geocoding API
  // For now, return a mock address
  return `Location near ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
}

function getMockCoordinates(locationText: string): MapLocation {
  // Mock coordinates for major Indian cities
  const cityCoordinates: { [key: string]: MapLocation } = {
    'Delhi': { lat: 28.6139, lng: 77.2090 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
  }

  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (locationText.toLowerCase().includes(city.toLowerCase())) {
      return coords
    }
  }

  // Default to Delhi if no match found
  return cityCoordinates.Delhi
}