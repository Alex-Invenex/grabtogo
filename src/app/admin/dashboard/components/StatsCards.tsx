'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Store,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StatCard {
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  description: string
  color: string
}

export default function StatsCards() {
  const [stats, setStats] = useState<StatCard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Simulated API call - replace with real data
  useEffect(() => {
    const fetchStats = async () => {
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockStats: StatCard[] = [
        {
          title: 'Total Users',
          value: '15,847',
          change: 12.5,
          changeType: 'increase',
          icon: Users,
          description: 'Active customers',
          color: 'blue'
        },
        {
          title: 'Vendors',
          value: '2,341',
          change: 8.2,
          changeType: 'increase',
          icon: Store,
          description: 'Registered vendors',
          color: 'green'
        },
        {
          title: 'Orders Today',
          value: '1,283',
          change: -2.4,
          changeType: 'decrease',
          icon: ShoppingCart,
          description: 'Orders processed',
          color: 'orange'
        },
        {
          title: 'Revenue',
          value: '₹2,84,759',
          change: 15.3,
          changeType: 'increase',
          icon: DollarSign,
          description: 'This month',
          color: 'purple'
        },
        {
          title: 'Pending Approvals',
          value: '23',
          change: 0,
          changeType: 'neutral',
          icon: Clock,
          description: 'Vendor applications',
          color: 'yellow'
        },
        {
          title: 'Active Subscriptions',
          value: '1,876',
          change: 5.8,
          changeType: 'increase',
          icon: CheckCircle,
          description: 'Premium vendors',
          color: 'teal'
        },
        {
          title: 'System Alerts',
          value: '3',
          change: -33.3,
          changeType: 'decrease',
          icon: AlertTriangle,
          description: 'Requiring attention',
          color: 'red'
        },
        {
          title: 'Uptime',
          value: '99.8%',
          change: 0.1,
          changeType: 'increase',
          icon: Activity,
          description: 'Last 30 days',
          color: 'emerald'
        }
      ]

      setStats(mockStats)
      setIsLoading(false)
    }

    fetchStats()
  }, [])

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600',
      yellow: 'from-yellow-500 to-yellow-600',
      teal: 'from-teal-500 to-teal-600',
      red: 'from-red-500 to-red-600',
      emerald: 'from-emerald-500 to-emerald-600'
    }
    return colorMap[color as keyof typeof colorMap] || 'from-gray-500 to-gray-600'
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${getColorClasses(stat.color)}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs">
                  {stat.description}
                </CardDescription>
                {stat.changeType !== 'neutral' && (
                  <Badge
                    variant={stat.changeType === 'increase' ? 'default' : 'destructive'}
                    className={`text-xs ${
                      stat.changeType === 'increase'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : 'bg-red-100 text-red-800 hover:bg-red-100'
                    }`}
                  >
                    {stat.changeType === 'increase' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(stat.change)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}