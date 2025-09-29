'use client'

import * as React from 'react'
import { BarChart3, TrendingUp, Users, Package, Eye, Heart, MessageSquare, ShoppingCart, IndianRupee, Calendar, Download, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/components/auth/protected-route'
import { useRouter } from 'next/navigation'

interface AnalyticsData {
  overview: {
    totalRevenue: number
    totalOrders: number
    totalViews: number
    totalCustomers: number
    revenueGrowth: number
    ordersGrowth: number
    viewsGrowth: number
    customersGrowth: number
  }
  products: {
    id: string
    name: string
    views: number
    likes: number
    orders: number
    revenue: number
    conversionRate: number
    category: string
  }[]
  stories: {
    id: string
    title: string
    views: number
    likes: number
    comments: number
    shares: number
    createdAt: string
  }[]
  customers: {
    demographics: {
      ageGroups: { group: string; percentage: number }[]
      locations: { city: string; percentage: number }[]
      devices: { device: string; percentage: number }[]
    }
    behavior: {
      avgOrderValue: number
      repeatCustomers: number
      topBuyingTimes: { hour: number; orders: number }[]
    }
  }
  revenue: {
    daily: { date: string; amount: number }[]
    monthly: { month: string; amount: number }[]
    byCategory: { category: string; amount: number; percentage: number }[]
  }
}

export default function VendorAnalyticsPage() {
  const { user, role } = useAuth()
  const router = useRouter()
  const [timeRange, setTimeRange] = React.useState('7d')
  const [selectedTab, setSelectedTab] = React.useState('overview')

  React.useEffect(() => {
    if (role !== 'VENDOR') {
      router.push('/')
    }
  }, [role, router])

  // Mock analytics data
  const analyticsData: AnalyticsData = {
    overview: {
      totalRevenue: 45680,
      totalOrders: 234,
      totalViews: 5420,
      totalCustomers: 156,
      revenueGrowth: 12.5,
      ordersGrowth: 8.3,
      viewsGrowth: 15.7,
      customersGrowth: 6.9
    },
    products: [
      {
        id: '1',
        name: 'Fresh Organic Mangoes',
        views: 1250,
        likes: 89,
        orders: 45,
        revenue: 20250,
        conversionRate: 3.6,
        category: 'Fruits'
      },
      {
        id: '2',
        name: 'Wireless Bluetooth Earbuds',
        views: 890,
        likes: 67,
        orders: 23,
        revenue: 68970,
        conversionRate: 2.6,
        category: 'Electronics'
      },
      {
        id: '3',
        name: 'Organic Cotton T-Shirt',
        views: 670,
        likes: 34,
        orders: 18,
        revenue: 14382,
        conversionRate: 2.7,
        category: 'Clothing'
      }
    ],
    stories: [
      {
        id: '1',
        title: 'Fresh Mangoes Arrived!',
        views: 450,
        likes: 32,
        comments: 12,
        shares: 8,
        createdAt: '2024-01-28T10:30:00Z'
      },
      {
        id: '2',
        title: 'Behind the Scenes',
        views: 320,
        likes: 28,
        comments: 9,
        shares: 5,
        createdAt: '2024-01-27T15:45:00Z'
      }
    ],
    customers: {
      demographics: {
        ageGroups: [
          { group: '18-24', percentage: 25 },
          { group: '25-34', percentage: 40 },
          { group: '35-44', percentage: 20 },
          { group: '45+', percentage: 15 }
        ],
        locations: [
          { city: 'Mumbai', percentage: 35 },
          { city: 'Delhi', percentage: 28 },
          { city: 'Bangalore', percentage: 22 },
          { city: 'Others', percentage: 15 }
        ],
        devices: [
          { device: 'Mobile', percentage: 65 },
          { device: 'Desktop', percentage: 25 },
          { device: 'Tablet', percentage: 10 }
        ]
      },
      behavior: {
        avgOrderValue: 1847,
        repeatCustomers: 68,
        topBuyingTimes: [
          { hour: 10, orders: 25 },
          { hour: 14, orders: 18 },
          { hour: 19, orders: 22 },
          { hour: 21, orders: 15 }
        ]
      }
    },
    revenue: {
      daily: [
        { date: '2024-01-22', amount: 2450 },
        { date: '2024-01-23', amount: 3200 },
        { date: '2024-01-24', amount: 1800 },
        { date: '2024-01-25', amount: 4100 },
        { date: '2024-01-26', amount: 2900 },
        { date: '2024-01-27', amount: 3600 },
        { date: '2024-01-28', amount: 2800 }
      ],
      monthly: [
        { month: 'Oct', amount: 25000 },
        { month: 'Nov', amount: 32000 },
        { month: 'Dec', amount: 38000 },
        { month: 'Jan', amount: 45680 }
      ],
      byCategory: [
        { category: 'Electronics', amount: 25000, percentage: 55 },
        { category: 'Fruits', amount: 15000, percentage: 33 },
        { category: 'Clothing', amount: 5680, percentage: 12 }
      ]
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600'
  }

  if (role !== 'VENDOR') {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your business performance and insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="stories">Stories</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analyticsData.overview.totalRevenue)}</div>
                <p className={`text-xs ${getGrowthColor(analyticsData.overview.revenueGrowth)}`}>
                  {formatPercentage(analyticsData.overview.revenueGrowth)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalOrders}</div>
                <p className={`text-xs ${getGrowthColor(analyticsData.overview.ordersGrowth)}`}>
                  {formatPercentage(analyticsData.overview.ordersGrowth)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalViews.toLocaleString()}</div>
                <p className={`text-xs ${getGrowthColor(analyticsData.overview.viewsGrowth)}`}>
                  {formatPercentage(analyticsData.overview.viewsGrowth)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalCustomers}</div>
                <p className={`text-xs ${getGrowthColor(analyticsData.overview.customersGrowth)}`}>
                  {formatPercentage(analyticsData.overview.customersGrowth)} from last period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Revenue chart would be displayed here</p>
                  <p className="text-sm text-muted-foreground mt-1">Integration with charting library needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Analyze how your products are performing</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Likes</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>{product.views.toLocaleString()}</TableCell>
                      <TableCell>{product.likes}</TableCell>
                      <TableCell>{product.orders}</TableCell>
                      <TableCell>{formatCurrency(product.revenue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={product.conversionRate * 10} className="w-16" />
                          <span className="text-sm">{product.conversionRate}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Story Performance</CardTitle>
              <CardDescription>See how your stories are engaging customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.stories.map((story) => (
                  <div key={story.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{story.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(story.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center space-x-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{story.views}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center space-x-1">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{story.likes}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Likes</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center space-x-1">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{story.comments}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Comments</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center space-x-1">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{story.shares}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Shares</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Demographics</CardTitle>
                <CardDescription>Age distribution of your customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.customers.demographics.ageGroups.map((group) => (
                  <div key={group.group} className="flex items-center justify-between">
                    <span className="text-sm">{group.group}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={group.percentage} className="w-24" />
                      <span className="text-sm font-medium">{group.percentage}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
                <CardDescription>Where your customers are located</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.customers.demographics.locations.map((location) => (
                  <div key={location.city} className="flex items-center justify-between">
                    <span className="text-sm">{location.city}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={location.percentage} className="w-24" />
                      <span className="text-sm font-medium">{location.percentage}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
                <CardDescription>How customers access your store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.customers.demographics.devices.map((device) => (
                  <div key={device.device} className="flex items-center justify-between">
                    <span className="text-sm">{device.device}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={device.percentage} className="w-24" />
                      <span className="text-sm font-medium">{device.percentage}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Behavior</CardTitle>
                <CardDescription>Key customer metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Order Value</span>
                  <span className="font-medium">{formatCurrency(analyticsData.customers.behavior.avgOrderValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Repeat Customers</span>
                  <span className="font-medium">{analyticsData.customers.behavior.repeatCustomers}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Your top performing categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.revenue.byCategory.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category.category}</span>
                      <span className="text-sm">{formatCurrency(category.amount)}</span>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
                <CardDescription>Revenue growth over months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.revenue.monthly.map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-sm">{month.month}</span>
                      <span className="font-medium">{formatCurrency(month.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}