'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Apple,
  Coffee,
  Smartphone,
  Shirt,
  Home,
  Utensils,
  Book,
  Gamepad2,
  Car,
  Heart,
  Gift,
  Camera
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Category {
  id: string
  name: string
  icon: React.ReactNode
  productCount: number
  image?: string
}

const categories: Category[] = [
  {
    id: 'fruits-vegetables',
    name: 'Fruits & Vegetables',
    icon: <Apple className="h-6 w-6" />,
    productCount: 1234
  },
  {
    id: 'food-beverages',
    name: 'Food & Beverages',
    icon: <Coffee className="h-6 w-6" />,
    productCount: 856
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: <Smartphone className="h-6 w-6" />,
    productCount: 567
  },
  {
    id: 'fashion',
    name: 'Fashion',
    icon: <Shirt className="h-6 w-6" />,
    productCount: 2341
  },
  {
    id: 'home-garden',
    name: 'Home & Garden',
    icon: <Home className="h-6 w-6" />,
    productCount: 789
  },
  {
    id: 'grocery',
    name: 'Grocery',
    icon: <Utensils className="h-6 w-6" />,
    productCount: 1567
  },
  {
    id: 'books-stationery',
    name: 'Books & Stationery',
    icon: <Book className="h-6 w-6" />,
    productCount: 432
  },
  {
    id: 'toys-games',
    name: 'Toys & Games',
    icon: <Gamepad2 className="h-6 w-6" />,
    productCount: 298
  },
  {
    id: 'automotive',
    name: 'Automotive',
    icon: <Car className="h-6 w-6" />,
    productCount: 156
  },
  {
    id: 'health-beauty',
    name: 'Health & Beauty',
    icon: <Heart className="h-6 w-6" />,
    productCount: 934
  },
  {
    id: 'gifts',
    name: 'Gifts & Crafts',
    icon: <Gift className="h-6 w-6" />,
    productCount: 445
  },
  {
    id: 'photography',
    name: 'Photography',
    icon: <Camera className="h-6 w-6" />,
    productCount: 123
  }
]

export function CategoriesSection() {
  return (
    <section className="py-12 bg-muted/50">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Shop by Category</h2>
          <Link
            href="/categories"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all categories
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.id}`}>
              <Card className="group hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {category.icon}
                  </div>
                  <h3 className="font-medium text-sm leading-tight mb-1">
                    {category.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {category.productCount.toLocaleString()} products
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Popular categories highlight */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-6">Popular This Week</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 4).map((category) => (
              <Link key={`popular-${category.id}`} href={`/categories/${category.id}`}>
                <Card className="group overflow-hidden hover:shadow-md transition-all">
                  <div className="relative h-32 bg-gradient-to-br from-primary/20 to-secondary/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-primary">
                        {React.cloneElement(category.icon as React.ReactElement<{ className?: string }>, {
                          className: 'h-8 w-8'
                        })}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-1">{category.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {category.productCount.toLocaleString()} products
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}