'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
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
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityItem {
  id: string;
  type: 'vendor' | 'user' | 'order' | 'payment' | 'system' | 'security';
  title: string;
  description: string;
  timestamp: string;
  color: string;
  priority?: 'low' | 'medium' | 'high';
  avatar?: string;
  username?: string;
}

export default function RecentActivity() {
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/admin/recent-activities?limit=8');
        if (!response.ok) throw new Error('Failed to fetch activities');
        const data = await response.json();
        setRecentActivities(data.activities || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setRecentActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'vendor':
        return Store;
      case 'user':
        return User;
      case 'order':
        return ShoppingCart;
      case 'payment':
        return DollarSign;
      case 'security':
        return AlertTriangle;
      case 'system':
        return Settings;
      default:
        return Bell;
    }
  };

  const getColorClasses = (color: string, priority?: string) => {
    const baseColors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600',
      teal: 'bg-teal-100 text-teal-600',
      gray: 'bg-gray-100 text-gray-600',
    };

    const priorityBorder = {
      high: 'border-l-red-500',
      medium: 'border-l-yellow-500',
      low: 'border-l-green-500',
    };

    return {
      icon: baseColors[color as keyof typeof baseColors] || 'bg-gray-100 text-gray-600',
      border: priority
        ? priorityBorder[priority as keyof typeof priorityBorder]
        : 'border-l-gray-300',
    };
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;

    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants]} className="text-xs">
        {priority}
      </Badge>
    );
  };

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
          {loading ? (
            <div className="space-y-1 px-6 pb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-8 px-6 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent activities</p>
              <p className="text-sm mt-1">Activities will appear here as they occur</p>
            </div>
          ) : (
            <div className="space-y-1 px-6 pb-6">
              {recentActivities.map((activity, index) => {
                const colorClasses = getColorClasses(activity.color, activity.priority);
                const ActivityIcon = getActivityIcon(activity.type);

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
                          <AvatarFallback>{activity.username?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={`p-2 rounded-full ${colorClasses.icon}`}>
                          <ActivityIcon className="w-4 h-4" />
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
                      <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                        {activity.username && (
                          <span className="text-xs text-gray-500">by {activity.username}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* View All Button */}
        <div className="px-6 py-4 border-t">
          <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
            View All Activities
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
