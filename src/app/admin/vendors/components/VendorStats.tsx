'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Store, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'

interface VendorStatsProps {
  stats: {
    total: number
    active: number
    pending: number
    suspended: number
    inactive: number
  }
}

export default function VendorStats({ stats }: VendorStatsProps) {
  const statCards = [
    {
      title: 'Total Vendors',
      value: stats.total.toLocaleString(),
      icon: Store,
      color: 'blue',
      bgColor: 'bg-blue-500'
    },
    {
      title: 'Active',
      value: stats.active.toLocaleString(),
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-500'
    },
    {
      title: 'Pending Approval',
      value: stats.pending.toLocaleString(),
      icon: Clock,
      color: 'orange',
      bgColor: 'bg-orange-500'
    },
    {
      title: 'Suspended',
      value: stats.suspended.toLocaleString(),
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-500'
    },
    {
      title: 'Inactive',
      value: stats.inactive.toLocaleString(),
      icon: AlertTriangle,
      color: 'gray',
      bgColor: 'bg-gray-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}