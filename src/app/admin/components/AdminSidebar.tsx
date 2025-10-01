'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingCart,
  FileText,
  Settings,
  BarChart3,
  Bell,
  Shield,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
  Megaphone,
  Headphones,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Vendors',
    href: '/admin/vendors',
    icon: Store,
  },
  {
    title: 'Registrations',
    href: '/admin/registrations',
    icon: Clock,
  },
  {
    title: 'Subscriptions',
    href: '/admin/subscriptions',
    icon: CreditCard,
  },
  {
    title: 'Ad Services',
    href: '/admin/services',
    icon: Megaphone,
  },
  {
    title: 'Support Tickets',
    href: '/admin/tickets',
    icon: Headphones,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: FileText,
  },
  {
    title: 'Security',
    href: '/admin/security',
    icon: Shield,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const isActiveRoute = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <motion.div
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-gray-900 border-r border-gray-800 flex flex-col relative"
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-800">
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
                  <h2 className="text-lg font-bold text-white">GrabtoGo</h2>
                  <p className="text-xs text-gray-400">Admin Panel</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-white hover:bg-gray-800 p-2"
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
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <div key={item.title}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleExpanded(item.title)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                    isActiveRoute(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
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
                        <span className="font-medium">{item.title}</span>
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                          <motion.div
                            animate={{ rotate: expandedItems.includes(item.title) ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                <AnimatePresence>
                  {expandedItems.includes(item.title) && !isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-6 mt-2 space-y-1"
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                            isActiveRoute(child.href)
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800'
                          )}
                        >
                          <child.icon className="w-4 h-4 flex-shrink-0" />
                          <span>{child.title}</span>
                          {child.badge && (
                            <Badge variant="secondary" className="text-xs ml-auto">
                              {child.badge}
                            </Badge>
                          )}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActiveRoute(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
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
                      <span className="font-medium">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant={item.badge === '!' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Status Indicator */}
      <div className="p-4 border-t border-gray-800">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-sm text-gray-400"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>System Online</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
