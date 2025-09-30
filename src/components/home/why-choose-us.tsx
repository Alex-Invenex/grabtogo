'use client';

import * as React from 'react';
import {
  ShieldCheck,
  BadgePercent,
  MapPin,
  Headphones,
  Award,
  Clock,
  Zap,
  Heart,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Benefit {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const benefits: Benefit[] = [
  {
    icon: ShieldCheck,
    title: 'Verified Local Vendors',
    description:
      'Every business on our platform is verified and trusted by the community for quality and authenticity.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: BadgePercent,
    title: 'Best Prices Guaranteed',
    description: 'Get the best deals and exclusive discounts from local businesses you can trust.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: MapPin,
    title: 'Location-Based Discovery',
    description:
      'Find amazing deals from businesses near you with our smart location-based search.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Headphones,
    title: '24/7 Customer Support',
    description:
      'Our dedicated support team is always ready to help you with any questions or concerns.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Award,
    title: 'Quality Assurance',
    description:
      'We ensure all vendors meet our high standards for product quality and customer service.',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    icon: Clock,
    title: 'Real-Time Updates',
    description:
      'Get instant notifications about new deals, offers, and vendor stories in your area.',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    icon: Zap,
    title: 'Fast & Easy Ordering',
    description:
      'Simple, seamless experience from browsing to visiting the store to make your purchase.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Heart,
    title: 'Support Local Business',
    description:
      'Help grow your local economy by supporting neighborhood businesses and entrepreneurs.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
];

export function WhyChooseUs() {
  return (
    <section className="section-padding bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <div className="bg-primary/10 text-primary px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wide">
              Why Choose GrabtoGo
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Your Trusted Local Marketplace
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Experience the best of local shopping with verified vendors, exclusive deals, and
            seamless service
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={index}
                className="group border-2 hover:border-primary transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
              >
                <CardContent className="p-6">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 ${benefit.bgColor} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-8 h-8 ${benefit.color}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                    {benefit.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>

                  {/* Hover Effect Line */}
                  <div className="mt-5 h-1 w-0 bg-primary rounded-full group-hover:w-full transition-all duration-500"></div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-10 md:p-16 shadow-2xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">500+</div>
              <div className="text-white/90 font-medium">Verified Vendors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">10K+</div>
              <div className="text-white/90 font-medium">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">50K+</div>
              <div className="text-white/90 font-medium">Products Listed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">98%</div>
              <div className="text-white/90 font-medium">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
