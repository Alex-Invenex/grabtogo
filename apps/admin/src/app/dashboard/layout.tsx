'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Users,
  Store,
  ShoppingCart,
  DollarSign,
  Settings,
  Bell,
  Search,
  Shield,
  FileText,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  LogOut,
  Menu,
  X
} from "lucide-react"

interface SidebarItem {
  href: string
  icon: React.ReactNode
  label: string
  badge?: number
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [adminData, setAdminData] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check authentication
    const adminAuth = localStorage.getItem('adminAuth')
    if (adminAuth !== 'true') {
      router.push('/auth/login')
      return
    }

    // Load admin data
    const role = localStorage.getItem('adminRole')
    const email = localStorage.getItem('adminEmail')

    setAdminData({ role, email })
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    localStorage.removeItem('adminRole')
    localStorage.removeItem('adminEmail')
    localStorage.removeItem('adminLoginTime')
    router.push('/auth/login')
  }

  const sidebarItems: SidebarItem[] = [
    {
      href: '/dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
      label: 'Dashboard'
    },
    {
      href: '/dashboard/vendors',
      icon: <Store className="h-5 w-5" />,
      label: 'Vendors',
      badge: 23
    },
    {
      href: '/dashboard/users',
      icon: <Users className="h-5 w-5" />,
      label: 'Users'
    },
    {
      href: '/dashboard/orders',
      icon: <ShoppingCart className="h-5 w-5" />,
      label: 'Orders'
    },
    {
      href: '/dashboard/financials',
      icon: <DollarSign className="h-5 w-5" />,
      label: 'Financials'
    },
    {
      href: '/dashboard/content',
      icon: <MessageSquare className="h-5 w-5" />,
      label: 'Content Moderation',
      badge: 7
    },
    {
      href: '/dashboard/reports',
      icon: <FileText className="h-5 w-5" />,
      label: 'Reports'
    },
    {
      href: '/dashboard/marketing',
      icon: <TrendingUp className="h-5 w-5" />,
      label: 'Marketing'
    },
    {
      href: '/dashboard/system',
      icon: <Settings className="h-5 w-5" />,
      label: 'System'
    }
  ]

  if (!adminData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-600 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">GrabtoGo</h2>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <Badge variant="secondary" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-4">
          <div className="p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">System Status</span>
            </div>
            <p className="text-xs text-gray-400">All systems operational</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                {adminData.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{adminData.email}</p>
                <p className="text-xs text-gray-400">
                  {adminData.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-gray-400 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header for mobile */}
        <header className="lg:hidden bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Badge variant={adminData?.role === 'super_admin' ? 'destructive' : 'secondary'}>
                {adminData?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </Badge>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}