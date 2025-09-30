'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Store,
  User,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Bell,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ActivityItem {
  id: string
  type: 'vendor' | 'user' | 'order' | 'payment' | 'system' | 'security'
  title: string
  description: string
  timestamp: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  priority?: 'low' | 'medium' | 'high'
  avatar?: string
  username?: string
}

const recentActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'vendor',
    title: 'New Vendor Registration',
    description: 'Fresh Foods Market submitted application for approval',
    timestamp: '2 minutes ago',
    icon: Store,
    color: 'blue',
    priority: 'high',
    username: 'Fresh Foods Market'
  },
  {
    id: '2',
    type: 'order',
    title: 'Large Order Processed',
    description: 'Order #12847 worth ₹15,480 completed successfully',
    timestamp: '5 minutes ago',
    icon: ShoppingCart,
    color: 'green',
    priority: 'medium'
  },
  {
    id: '3',
    type: 'payment',
    title: 'Subscription Renewed',
    description: 'Spice Paradise renewed Premium plan (₹299)',
    timestamp: '12 minutes ago',
    icon: DollarSign,
    color: 'purple',
    priority: 'low',
    username: 'Spice Paradise'
  },
  {
    id: '4',
    type: 'system',
    title: 'System Alert Resolved',
    description: 'High memory usage on server-2 has been resolved',
    timestamp: '18 minutes ago',
    icon: CheckCircle,
    color: 'green',
    priority: 'medium'
  },
  {
    id: '5',
    type: 'user',
    title: 'New Customer Registration',
    description: 'Priya Sharma joined the platform',
    timestamp: '25 minutes ago',
    icon: User,
    color: 'teal',
    priority: 'low',
    username: 'Priya Sharma',
    avatar: '/avatars/priya.jpg'
  },
  {
    id: '6',
    type: 'vendor',
    title: 'Vendor Approved',
    description: 'Urban Kitchen has been approved and activated',
    timestamp: '32 minutes ago',
    icon: CheckCircle,
    color: 'green',
    priority: 'medium',
    username: 'Urban Kitchen'
  },
  {
    id: '7',
    type: 'security',
    title: 'Failed Login Attempts',
    description: 'Multiple failed login attempts detected from IP 192.168.1.100',
    timestamp: '45 minutes ago',
    icon: AlertTriangle,
    color: 'red',
    priority: 'high'
  },
  {
    id: '8',
    type: 'system',
    title: 'Backup Completed',
    description: 'Daily system backup completed successfully',
    timestamp: '1 hour ago',
    icon: Settings,
    color: 'gray',
    priority: 'low'
  }
]

export default function RecentActivity() {
  const getColorClasses = (color: string, priority?: string) => {
    const baseColors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600',
      teal: 'bg-teal-100 text-teal-600',
      gray: 'bg-gray-100 text-gray-600'
    }

    const priorityBorder = {
      high: 'border-l-red-500',
      medium: 'border-l-yellow-500',
      low: 'border-l-green-500'
    }

    return {
      icon: baseColors[color as keyof typeof baseColors] || 'bg-gray-100 text-gray-600',
      border: priority ? priorityBorder[priority as keyof typeof priorityBorder] : 'border-l-gray-300'
    }
  }

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null

    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const

    return (
      <Badge variant={variants[priority as keyof typeof variants]} className="text-xs">
        {priority}
      </Badge>
    )
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system events and notifications</CardDescription>
          </div>
          <Badge variant="outline">{recentActivities.length} events</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="space-y-1 px-6 pb-6">
            {recentActivities.map((activity, index) => {
              const colorClasses = getColorClasses(activity.color, activity.priority)

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border-l-4 ${colorClasses.border}`}
                >
                  {/* Icon or Avatar */}
                  <div className="flex-shrink-0">
                    {activity.avatar ? (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={activity.avatar} alt={activity.username} />
                        <AvatarFallback>
                          {activity.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className={`p-2 rounded-full ${colorClasses.icon}`}>
                        <activity.icon className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </h4>
                      {getPriorityBadge(activity.priority)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.timestamp}
                      </span>
                      {activity.username && (
                        <span className="text-xs text-gray-500">
                          by {activity.username}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>

        {/* View All Button */}
        <div className="px-6 py-4 border-t">
          <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
            View All Activities
          </button>
        </div>
      </CardContent>
    </Card>
  )
}