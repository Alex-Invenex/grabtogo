'use client'

import * as React from 'react'
import { Star, Quote } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Testimonial {
  id: string
  name: string
  role: string
  avatar?: string
  rating: number
  comment: string
  location: string
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Priya Menon',
    role: 'Regular Customer',
    rating: 5,
    comment: 'GrabtoGo has completely changed how I discover local businesses. The deals are amazing and the vendors are all verified and trustworthy!',
    location: 'Kottayam',
  },
  {
    id: '2',
    name: 'Rajesh Kumar',
    role: 'Business Owner',
    rating: 5,
    comment: 'As a vendor, this platform has helped me reach so many new customers. The subscription plans are affordable and the results are incredible.',
    location: 'Kochi',
  },
  {
    id: '3',
    name: 'Anjali Nair',
    role: 'Food Enthusiast',
    rating: 5,
    comment: 'I love finding new restaurants and cafes through GrabtoGo. The offers are real and the vendor stories keep me updated on what\'s new!',
    location: 'Thrissur',
  },
  {
    id: '4',
    name: 'Arun Prakash',
    role: 'Shopping Lover',
    rating: 5,
    comment: 'Best platform for local shopping! I saved so much money using the flash deals and exclusive offers. Highly recommended!',
    location: 'Thiruvananthapuram',
  },
  {
    id: '5',
    name: 'Sreeja Thomas',
    role: 'Fashion Blogger',
    rating: 5,
    comment: 'GrabtoGo connects me with the best local fashion boutiques. The trending products section always has something new and exciting!',
    location: 'Kozhikode',
  },
  {
    id: '6',
    name: 'Vishnu Mohan',
    role: 'Tech Enthusiast',
    rating: 5,
    comment: 'Great platform for finding electronics deals. The product listings are detailed and the prices are unbeatable.',
    location: 'Palakkad',
  },
]

export function SocialProof() {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <section className="section-padding bg-gradient-to-br from-primary/5 via-white to-primary/5">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 px-6 py-2 text-sm font-semibold uppercase tracking-wide">
              ⭐ Customer Reviews
            </Badge>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Loved by Thousands
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Don't just take our word for it - hear what our community has to say about their experience
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
            >
              <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Quote className="w-6 h-6 text-primary" />
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-gray-700 leading-relaxed mb-6 text-base">
                  "{testimonial.comment}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback className="bg-primary text-white font-bold">
                      {getInitials(testimonial.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role} • {testimonial.location}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Overall Rating Summary */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 md:p-16 border-2 border-gray-100">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Overall Rating */}
            <div className="text-center lg:text-left">
              <div className="inline-block mb-6">
                <div className="text-7xl font-extrabold text-gray-900 mb-2">4.9</div>
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 font-medium">Based on 10,000+ reviews</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-24">
                    <span className="text-sm font-semibold">5 stars</span>
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 w-12">85%</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-24">
                    <span className="text-sm font-semibold">4 stars</span>
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400" style={{ width: '12%' }}></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 w-12">12%</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-24">
                    <span className="text-sm font-semibold">3 stars</span>
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400" style={{ width: '2%' }}></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 w-12">2%</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-24">
                    <span className="text-sm font-semibold">2 stars</span>
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400" style={{ width: '1%' }}></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 w-12">1%</span>
                </div>
              </div>
            </div>

            {/* Right Side - Key Highlights */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">What Customers Love Most</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <div className="text-2xl">✓</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 mb-1">Verified Vendors</div>
                    <div className="text-sm text-gray-600">95% of customers appreciate our vendor verification process</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <div className="text-2xl">💰</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 mb-1">Great Deals</div>
                    <div className="text-sm text-gray-600">Average savings of 35% on every purchase through our platform</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <div className="text-2xl">⚡</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 mb-1">Easy to Use</div>
                    <div className="text-sm text-gray-600">Intuitive interface that makes discovery and ordering a breeze</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <div className="text-2xl">🤝</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 mb-1">Support Local</div>
                    <div className="text-sm text-gray-600">Help your community thrive while getting the best deals</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}