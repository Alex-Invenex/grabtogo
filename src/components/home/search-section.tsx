'use client'

import * as React from 'react'
import { Search, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SearchSection() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [location, setLocation] = React.useState('Kottayam')

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`
    }
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for restaurants, cuisines, or dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium"
                  aria-label="Search for restaurants, cuisines, or dishes"
                />
              </div>

              {/* Location Selector */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-6 py-2 min-w-[200px]">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-transparent outline-none text-gray-700 font-semibold flex-1 text-base cursor-pointer"
                >
                  <option>Kottayam</option>
                  <option>Kochi</option>
                  <option>Thrissur</option>
                  <option>Thiruvananthapuram</option>
                  <option>Kozhikode</option>
                  <option>Palakkad</option>
                </select>
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-14 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}