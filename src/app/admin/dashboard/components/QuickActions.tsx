'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  UserPlus,
  Store,
  FileText,
  Settings,
  Download,
  Mail,
  Shield,
  BarChart3,
  Bell,
  Globe,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  color: string;
  badge?: string | number;
  disabled?: boolean;
}

export default function QuickActions() {
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setPendingCount(data.vendors?.pending || 0);
        }
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    };

    fetchPendingCount();
    // Refresh every minute
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const quickActions: QuickAction[] = [
    {
      title: 'Add New Vendor',
      description: 'Manually create a vendor account',
      icon: Store,
      href: '/admin/vendors/new',
      color: 'blue',
    },
    {
      title: 'Pending Approvals',
      description: 'Review vendor registrations',
      icon: FileText,
      href: '/admin/vendors/pending',
      color: 'orange',
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
  {
    title: 'Create User',
    description: 'Add a new customer account',
    icon: UserPlus,
    href: '/admin/users/new',
    color: 'green',
  },
  {
    title: 'System Settings',
    description: 'Configure platform settings',
    icon: Settings,
    href: '/admin/settings',
    color: 'gray',
  },
  {
    title: 'Export Reports',
    description: 'Download analytics and reports',
    icon: Download,
    onClick: () => console.log('Export reports'),
    color: 'purple',
  },
  {
    title: 'Send Notifications',
    description: 'Broadcast messages to users',
    icon: Mail,
    href: '/admin/notifications/new',
    color: 'teal',
  },
  {
    title: 'Security Audit',
    description: 'Review security events',
    icon: Shield,
    href: '/admin/security',
    color: 'red',
    badge: '!',
  },
  {
    title: 'Analytics Dashboard',
    description: 'View detailed analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    color: 'indigo',
  },
  {
    title: 'Manage Alerts',
    description: 'Configure system alerts',
    icon: Bell,
    href: '/admin/alerts',
    color: 'yellow',
  },
  {
    title: 'Visit Website',
    description: 'View the customer site',
    icon: Globe,
    href: '/',
    color: 'emerald',
  },
  {
    title: 'Backup System',
    description: 'Create system backup',
    icon: Database,
    onClick: () => console.log('Create backup'),
    color: 'slate',
  },
  {
    title: 'Platform Stats',
    description: 'Quick overview metrics',
    icon: BarChart3,
    href: '/admin/stats',
    color: 'rose',
  },
];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      orange: 'bg-orange-500 hover:bg-orange-600',
      gray: 'bg-gray-500 hover:bg-gray-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
      teal: 'bg-teal-500 hover:bg-teal-600',
      red: 'bg-red-500 hover:bg-red-600',
      indigo: 'bg-indigo-500 hover:bg-indigo-600',
      yellow: 'bg-yellow-500 hover:bg-yellow-600',
      emerald: 'bg-emerald-500 hover:bg-emerald-600',
      slate: 'bg-slate-500 hover:bg-slate-600',
      rose: 'bg-rose-500 hover:bg-rose-600',
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-500 hover:bg-gray-600';
  };

  const handleAction = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>Common administrative tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              {action.href ? (
                <Link href={action.href}>
                  <Button
                    variant="outline"
                    className="h-auto p-4 w-full flex flex-col items-center gap-3 hover:shadow-md transition-all duration-200 relative"
                    disabled={action.disabled}
                  >
                    <div className={`p-3 rounded-full text-white ${getColorClasses(action.color)}`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm mb-1">{action.title}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                    {action.badge && (
                      <Badge
                        variant={action.badge === '!' ? 'destructive' : 'secondary'}
                        className="absolute -top-2 -right-2 text-xs"
                      >
                        {action.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleAction(action)}
                  className="h-auto p-4 w-full flex flex-col items-center gap-3 hover:shadow-md transition-all duration-200 relative"
                  disabled={action.disabled}
                >
                  <div className={`p-3 rounded-full text-white ${getColorClasses(action.color)}`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm mb-1">{action.title}</div>
                    <div className="text-xs text-gray-500">{action.description}</div>
                  </div>
                  {action.badge && (
                    <Badge
                      variant={action.badge === '!' ? 'destructive' : 'secondary'}
                      className="absolute -top-2 -right-2 text-xs"
                    >
                      {action.badge}
                    </Badge>
                  )}
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
