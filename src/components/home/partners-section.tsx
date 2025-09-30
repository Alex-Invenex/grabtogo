'use client'

import * as React from 'react'
import { Utensils, Coffee, Pizza, Store } from 'lucide-react'

export function PartnersSection() {
  const partners = [
    { name: 'FastBites', icon: Utensils },
    { name: 'CafeDelights', icon: Coffee },
    { name: 'PizzaHub', icon: Pizza },
    { name: 'LocalEats', icon: Store },
  ]

  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="container-custom">
        <div className="flex items-center justify-center gap-16 md:gap-24 flex-wrap">
          {partners.map((partner) => (
            <div key={partner.name} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
              <partner.icon className="w-8 h-8 text-gray-600" />
              <span className="text-lg font-bold text-gray-700">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}