'use client'

import * as React from 'react'
import { MapPin, Search, Navigation, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchBar } from '@/components/ui/search-bar'

interface Location {
  id: string
  name: string
  district: string
  state: string
  coordinates: { lat: number; lng: number }
  popular: boolean
  businessCount: number
}

interface LocationPickerProps {
  selectedLocation?: Location
  onLocationSelect: (location: Location) => void
  onCurrentLocation?: () => void
  showCurrentLocation?: boolean
  className?: string
}

// Kerala districts and popular locations
const keralaLocations: Location[] = [
  // Kottayam District
  { id: 'kottayam', name: 'Kottayam', district: 'Kottayam', state: 'Kerala', coordinates: { lat: 9.5916, lng: 76.5222 }, popular: true, businessCount: 245 },
  { id: 'pala', name: 'Pala', district: 'Kottayam', state: 'Kerala', coordinates: { lat: 9.7333, lng: 76.6833 }, popular: false, businessCount: 89 },
  { id: 'changanassery', name: 'Changanassery', district: 'Kottayam', state: 'Kerala', coordinates: { lat: 9.4500, lng: 76.5500 }, popular: false, businessCount: 67 },

  // Ernakulam District (Kochi)
  { id: 'kochi', name: 'Kochi', district: 'Ernakulam', state: 'Kerala', coordinates: { lat: 9.9312, lng: 76.2673 }, popular: true, businessCount: 456 },
  { id: 'fort-kochi', name: 'Fort Kochi', district: 'Ernakulam', state: 'Kerala', coordinates: { lat: 9.9654, lng: 76.2424 }, popular: true, businessCount: 123 },
  { id: 'marine-drive', name: 'Marine Drive', district: 'Ernakulam', state: 'Kerala', coordinates: { lat: 9.9705, lng: 76.2867 }, popular: true, businessCount: 89 },
  { id: 'muvattupuzha', name: 'Muvattupuzha', district: 'Ernakulam', state: 'Kerala', coordinates: { lat: 9.9797, lng: 76.5783 }, popular: false, businessCount: 78 },

  // Thrissur District
  { id: 'thrissur', name: 'Thrissur', district: 'Thrissur', state: 'Kerala', coordinates: { lat: 10.5276, lng: 76.2144 }, popular: true, businessCount: 234 },
  { id: 'chalakudy', name: 'Chalakudy', district: 'Thrissur', state: 'Kerala', coordinates: { lat: 10.3090, lng: 76.3348 }, popular: false, businessCount: 56 },

  // Thiruvananthapuram District
  { id: 'thiruvananthapuram', name: 'Thiruvananthapuram', district: 'Thiruvananthapuram', state: 'Kerala', coordinates: { lat: 8.5241, lng: 76.9366 }, popular: true, businessCount: 389 },
  { id: 'kovalam', name: 'Kovalam', district: 'Thiruvananthapuram', state: 'Kerala', coordinates: { lat: 8.4004, lng: 76.9784 }, popular: true, businessCount: 67 },
  { id: 'neyyattinkara', name: 'Neyyattinkara', district: 'Thiruvananthapuram', state: 'Kerala', coordinates: { lat: 8.4000, lng: 77.0833 }, popular: false, businessCount: 45 },

  // Kozhikode District
  { id: 'kozhikode', name: 'Kozhikode', district: 'Kozhikode', state: 'Kerala', coordinates: { lat: 11.2588, lng: 75.7804 }, popular: true, businessCount: 298 },
  { id: 'beach-road', name: 'Beach Road', district: 'Kozhikode', state: 'Kerala', coordinates: { lat: 11.2510, lng: 75.7682 }, popular: true, businessCount: 87 },

  // Other popular locations
  { id: 'munnar', name: 'Munnar', district: 'Idukki', state: 'Kerala', coordinates: { lat: 10.0889, lng: 77.0595 }, popular: true, businessCount: 45 },
  { id: 'alleppey', name: 'Alleppey', district: 'Alappuzha', state: 'Kerala', coordinates: { lat: 9.4981, lng: 76.3388 }, popular: true, businessCount: 123 },
  { id: 'wayanad', name: 'Wayanad', district: 'Wayanad', state: 'Kerala', coordinates: { lat: 11.6054, lng: 76.0849 }, popular: true, businessCount: 78 },
  { id: 'kannur', name: 'Kannur', district: 'Kannur', state: 'Kerala', coordinates: { lat: 11.8745, lng: 75.3704 }, popular: false, businessCount: 134 },
  { id: 'kollam', name: 'Kollam', district: 'Kollam', state: 'Kerala', coordinates: { lat: 8.8932, lng: 76.6141 }, popular: false, businessCount: 167 },
  { id: 'palakkad', name: 'Palakkad', district: 'Palakkad', state: 'Kerala', coordinates: { lat: 10.7867, lng: 76.6548 }, popular: false, businessCount: 145 }
]

export function LocationPicker({
  selectedLocation,
  onLocationSelect,
  onCurrentLocation,
  showCurrentLocation = true,
  className = ''
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filteredLocations, setFilteredLocations] = React.useState(keralaLocations)

  React.useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = keralaLocations.filter(location =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.district.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredLocations(filtered)
    } else {
      setFilteredLocations(keralaLocations)
    }
  }, [searchQuery])

  const popularLocations = filteredLocations.filter(location => location.popular)
  const otherLocations = filteredLocations.filter(location => !location.popular)

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const currentLocation: Location = {
            id: 'current',
            name: 'Current Location',
            district: 'Unknown',
            state: 'Kerala',
            coordinates: { lat: latitude, lng: longitude },
            popular: false,
            businessCount: 0
          }
          onLocationSelect(currentLocation)
          onCurrentLocation?.()
        },
        (error) => {
          console.error('Error getting current location:', error)
          alert('Unable to get current location. Please select a location manually.')
        }
      )
    } else {
      alert('Geolocation is not supported by this browser.')
    }
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 max-h-[500px] overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Location</h3>

        {/* Search */}
        <SearchBar
          placeholder="Search locations in Kerala..."
          onSearch={setSearchQuery}
          value={searchQuery}
          className="h-10 border-gray-300"
        />
      </div>

      {/* Current Location Button */}
      {showCurrentLocation && (
        <Button
          variant="outline"
          onClick={handleCurrentLocation}
          className="w-full mb-4 justify-start text-primary border-primary hover:bg-primary hover:text-white"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Use Current Location
        </Button>
      )}

      {/* Location List */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Popular Locations */}
        {popularLocations.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              Popular Locations
              <Badge className="bg-primary text-white text-xs">Recommended</Badge>
            </h4>
            <div className="space-y-2">
              {popularLocations.map((location) => (
                <LocationItem
                  key={location.id}
                  location={location}
                  isSelected={selectedLocation?.id === location.id}
                  onSelect={onLocationSelect}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Locations */}
        {otherLocations.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">All Locations</h4>
            <div className="space-y-2">
              {otherLocations.map((location) => (
                <LocationItem
                  key={location.id}
                  location={location}
                  isSelected={selectedLocation?.id === location.id}
                  onSelect={onLocationSelect}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredLocations.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No locations found matching "{searchQuery}"</p>
            <p className="text-sm text-gray-500 mt-1">Try searching for a different area in Kerala</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface LocationItemProps {
  location: Location
  isSelected: boolean
  onSelect: (location: Location) => void
}

function LocationItem({ location, isSelected, onSelect }: LocationItemProps) {
  return (
    <button
      onClick={() => onSelect(location)}
      className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className={`mt-1 p-1.5 rounded-full ${
            isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            <MapPin className="w-3 h-3" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h5 className={`font-medium truncate ${
                isSelected ? 'text-primary' : 'text-gray-900'
              }`}>
                {location.name}
              </h5>
              {location.popular && (
                <Badge className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5">
                  Popular
                </Badge>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-1">
              {location.district}, {location.state}
            </p>

            <p className="text-xs text-gray-500">
              {location.businessCount} businesses nearby
            </p>
          </div>
        </div>

        {isSelected && (
          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
        )}
      </div>
    </button>
  )
}