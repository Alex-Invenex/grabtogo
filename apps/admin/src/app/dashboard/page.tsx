'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Store,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Bell,
  LogOut,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

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
    const loginTime = localStorage.getItem('adminLoginTime')

    setAdminData({
      role,
      email,
      loginTime: new Date(loginTime || Date.now())
    })
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    localStorage.removeItem('adminRole')
    localStorage.removeItem('adminEmail')
    localStorage.removeItem('adminLoginTime')
    router.push('/auth/login')
  }

  // Mock data for dashboard metrics
  const dashboardStats = {
    totalUsers: 15847,
    totalVendors: 1234,
    activeOrders: 456,
    monthlyRevenue: 234567,
    pendingApprovals: 23,
    activeIssues: 7,
    systemHealth: 98,
    userGrowth: 12.5,
    vendorGrowth: 8.3,
    revenueGrowth: 15.7
  }

  const revenueData = [
    { month: 'Jan', revenue: 45000, orders: 320 },
    { month: 'Feb', revenue: 52000, orders: 380 },
    { month: 'Mar', revenue: 48000, orders: 350 },
    { month: 'Apr', revenue: 61000, orders: 420 },
    { month: 'May', revenue: 55000, orders: 390 },
    { month: 'Jun', revenue: 67000, orders: 450 },
  ]

  const userActivityData = [
    { time: '00:00', customers: 1200, vendors: 89 },
    { time: '04:00', customers: 800, vendors: 45 },
    { time: '08:00', customers: 2800, vendors: 234 },
    { time: '12:00', customers: 3900, vendors: 456 },
    { time: '16:00', customers: 3200, vendors: 389 },
    { time: '20:00', customers: 2100, vendors: 198 },
  ]

  const vendorStatusData = [
    { name: 'Active', value: 1100, color: '#10B981' },
    { name: 'Pending', value: 89, color: '#F59E0B' },
    { name: 'Suspended', value: 34, color: '#EF4444' },
    { name: 'Inactive', value: 11, color: '#6B7280' },
  ]

  const topPerformingVendors = [
    { name: 'Fresh Market Plus', revenue: 45678, orders: 234, rating: 4.9 },
    { name: 'Tech Solutions Hub', revenue: 38945, orders: 189, rating: 4.8 },
    { name: 'Style & Fashion', revenue: 32156, orders: 167, rating: 4.7 },
    { name: 'Home Essentials', revenue: 28934, orders: 145, rating: 4.6 },
    { name: 'Digital Services Pro', revenue: 25678, orders: 134, rating: 4.5 },
  ]

  const recentAlerts = [
    { id: 1, type: 'security', message: 'Unusual login activity detected', time: '2 min ago', severity: 'high' },
    { id: 2, type: 'system', message: 'Server response time increased', time: '15 min ago', severity: 'medium' },
    { id: 3, type: 'vendor', message: 'New vendor pending approval', time: '1 hour ago', severity: 'low' },
    { id: 4, type: 'payment', message: 'Payment gateway timeout resolved', time: '2 hours ago', severity: 'low' },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-600 rounded-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">GrabtoGo Admin</h1>
                <p className="text-sm text-gray-400">Platform Management Dashboard</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={adminData?.role === 'super_admin' ? 'destructive' : 'secondary'}>
              {adminData?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Badge>
            <span className="text-sm text-gray-400">{adminData?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{dashboardStats.totalUsers.toLocaleString()}</div>
              <div className="flex items-center text-sm text-green-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{dashboardStats.userGrowth}% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Vendors</CardTitle>
              <Store className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{dashboardStats.totalVendors.toLocaleString()}</div>
              <div className="flex items-center text-sm text-green-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{dashboardStats.vendorGrowth}% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">₹{dashboardStats.monthlyRevenue.toLocaleString()}</div>
              <div className="flex items-center text-sm text-green-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{dashboardStats.revenueGrowth}% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">System Health</CardTitle>
              <Activity className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{dashboardStats.systemHealth}%</div>
              <Progress value={dashboardStats.systemHealth} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Revenue & Orders Trend</CardTitle>
                  <CardDescription className="text-gray-400">Monthly performance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* User Activity */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">User Activity (24h)</CardTitle>
                  <CardDescription className="text-gray-400">Customer and vendor activity patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userActivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Line type="monotone" dataKey="customers" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="vendors" stroke="#8B5CF6" strokeWidth={2} />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Alerts and Top Vendors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Alerts */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Recent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg">
                      <div className={`p-1 rounded-full ${
                        alert.severity === 'high' ? 'bg-red-500' :
                        alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}>
                        <AlertTriangle className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{alert.message}</p>
                        <p className="text-xs text-gray-400">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Performing Vendors */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Top Performing Vendors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topPerformingVendors.map((vendor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{vendor.name}</p>
                        <p className="text-xs text-gray-400">{vendor.orders} orders • ⭐ {vendor.rating}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-400">₹{vendor.revenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">This month</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vendor Status Distribution */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Vendor Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={vendorStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {vendorStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pending Actions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Pending Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium text-white">Vendor Approvals</p>
                        <p className="text-xs text-gray-400">Pending verification</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{dashboardStats.pendingApprovals}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-white">Active Issues</p>
                        <p className="text-xs text-gray-400">Requires attention</p>
                      </div>
                    </div>
                    <Badge variant="destructive">{dashboardStats.activeIssues}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-white">System Status</p>
                        <p className="text-xs text-gray-400">All systems operational</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400">Healthy</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other tab contents can be added here */}
        </Tabs>
      </div>
    </div>
  )
}