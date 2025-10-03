'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  MessageSquare,
  Star,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  Image,
  Users,
  Heart,
  Tag,
  Megaphone,
  HelpCircle,
  CreditCard,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/vendor/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Store Profile',
    href: '/vendor/profile',
    icon: Store,
  },
  {
    title: 'Products',
    href: '/vendor/products',
    icon: Package,
  },
  {
    title: 'Offers',
    href: '/vendor/offers',
    icon: Tag,
  },
  {
    title: 'Orders',
    href: '/vendor/orders',
    icon: ShoppingCart,
    badge: 3,
  },
  {
    title: 'Stories',
    href: '/vendor/stories',
    icon: Image,
  },
  {
    title: 'Ad Campaigns',
    href: '/vendor/ads',
    icon: Megaphone,
  },
  {
    title: 'Analytics',
    href: '/vendor/analytics',
    icon: BarChart3,
  },
  {
    title: 'Reviews',
    href: '/vendor/reviews',
    icon: Star,
  },
  {
    title: 'Messages',
    href: '/vendor/messages',
    icon: MessageSquare,
    badge: 5,
  },
  {
    title: 'Customers',
    href: '/vendor/customers',
    icon: Users,
  },
  {
    title: 'Subscription',
    href: '/vendor/subscription',
    icon: CreditCard,
  },
  {
    title: 'Support',
    href: '/vendor/support',
    icon: HelpCircle,
  },
  {
    title: 'Settings',
    href: '/vendor/settings',
    icon: Settings,
  },
];

export default function VendorSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === '/vendor/dashboard') {
      return pathname === '/vendor/dashboard' || pathname === '/vendor';
    }
    return pathname.startsWith(href);
  };

  return (
    <motion.div
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white border-r border-gray-200 flex flex-col relative shadow-sm"
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10">
                  <img
                    src="/logo.svg"
                    alt="GrabtoGo Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">GrabtoGo</h2>
                  <p className="text-xs text-gray-500">Vendor Dashboard</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-2"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              isActiveRoute(item.href)
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:text-primary hover:bg-gray-100'
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between w-full"
                >
                  <span className="font-medium text-sm">{item.title}</span>
                  {item.badge && (
                    <Badge
                      variant={typeof item.badge === 'number' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        ))}
      </nav>

      {/* Subscription Status */}
      <div className="p-4 border-t border-gray-200">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-gradient-to-r from-primary/10 to-orange-500/10 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-gray-900">Premium Trial</span>
              </div>
              <p className="text-xs text-gray-600">15 days remaining</p>
              <Button className="w-full mt-2" size="sm" variant="outline">
                Upgrade Now
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
