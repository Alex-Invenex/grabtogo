'use client'

import * as React from 'react'
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, AlertTriangle, UserCheck, UserX, Activity, Database } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/components/auth/protected-route'
import { useRouter } from 'next/navigation'

interface SystemStats {
  totalUsers: number
  totalVendors: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  monthlyGrowth: number
  activeSubscriptions: number
  systemHealth: number
}

interface User {
  id: string
  name: string
  email: string
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING'
  createdAt: string
  lastLogin?: string
  avatar?: string
  subscriptionTier?: 'BASIC' | 'PREMIUM' | 'ENTERPRISE'
}

interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: string
  resolved: boolean
}

export default function AdminDashboard() {
  const { user, role } = useAuth()
  const router = useRouter()
  const [selectedTab, setSelectedTab] = React.useState('overview')
  const [userFilter, setUserFilter] = React.useState('all')
  const [searchQuery, setSearchQuery] = React.useState('')

  React.useEffect(() => {
    if (role !== 'ADMIN') {
      router.push('/')
    }
  }, [role, router])

  const systemStats: SystemStats = {
    totalUsers: 15847,
    totalVendors: 2341,
    totalProducts: 12456,
    totalOrders: 34567,
    totalRevenue: 2847593,
    monthlyGrowth: 12.5,
    activeSubscriptions: 1876,
    systemHealth: 98.2
  }

  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      role: 'VENDOR',
      status: 'ACTIVE',
      createdAt: '2024-01-15',
      lastLogin: '2024-01-28T10:30:00Z',
      subscriptionTier: 'PREMIUM'
    },
    {
      id: '2',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      createdAt: '2024-01-20',
      lastLogin: '2024-01-28T14:20:00Z'
    },
    {
      id: '3',
      name: 'Amit Singh',
      email: 'amit@example.com',
      role: 'VENDOR',
      status: 'PENDING',
      createdAt: '2024-01-25',
      subscriptionTier: 'BASIC'
    },
    {
      id: '4',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      role: 'CUSTOMER',
      status: 'SUSPENDED',
      createdAt: '2024-01-10',
      lastLogin: '2024-01-26T09:15:00Z'
    }
  ]

  const systemAlerts: SystemAlert[] = [
    {
      id: '1',
      type: 'warning',
      message: 'High memory usage detected on server-2 (87%)',
      timestamp: '2024-01-28T10:30:00Z',
      resolved: false
    },
    {
      id: '2',
      type: 'info',
      message: 'Scheduled maintenance completed successfully',
      timestamp: '2024-01-28T08:00:00Z',
      resolved: true
    },
    {
      id: '3',
      type: 'error',
      message: 'Payment gateway timeout for Razorpay',
      timestamp: '2024-01-28T09:45:00Z',
      resolved: false
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'SUSPENDED':
        return <Badge variant="destructive">Suspended</Badge>
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="destructive">Admin</Badge>
      case 'VENDOR':
        return <Badge className="bg-blue-100 text-blue-800">Vendor</Badge>
      case 'CUSTOMER':
        return <Badge variant="secondary">Customer</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Activity className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = userFilter === 'all' || user.role.toLowerCase() === userFilter
    return matchesSearch && matchesFilter
  })

  if (role !== 'ADMIN') {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, monitor system health, and oversee marketplace operations</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          System Health: {systemStats.systemHealth}%
        </Badge>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{systemStats.monthlyGrowth}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalVendors.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {systemStats.activeSubscriptions} subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalOrders.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {systemStats.totalProducts.toLocaleString()} products listed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{systemStats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +{systemStats.monthlyGrowth}% growth
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Real-time system performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Disk Usage</span>
                    <span>23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Network I/O</span>
                    <span>34%</span>
                  </div>
                  <Progress value={34} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">New vendor registration</p>
                      <p className="text-xs text-muted-foreground">Fresh Fruits Co. - 2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Package className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Product uploaded</p>
                      <p className="text-xs text-muted-foreground">Organic Mangoes by Rajesh Kumar - 5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="h-4 w-4 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Order placed</p>
                      <p className="text-xs text-muted-foreground">Order #12347 - ₹1,247 - 8 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payment failed</p>
                      <p className="text-xs text-muted-foreground">Order #12346 - Gateway timeout - 12 minutes ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[300px]"
              />
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="vendor">Vendors</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.subscriptionTier ? (
                          <Badge variant="outline">{user.subscriptionTier}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? (
                          <span className="text-sm">
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                          {user.status === 'ACTIVE' ? (
                            <Button variant="ghost" size="sm">
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm">
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Database Status</CardTitle>
                <CardDescription>PostgreSQL and Redis connection status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>PostgreSQL</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>Redis Cache</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>Socket.io</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Gateway</CardTitle>
                <CardDescription>Razorpay integration status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Gateway Status</span>
                  <Badge className="bg-green-100 text-green-800">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Success Rate</span>
                  <span className="font-medium">96.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg Response Time</span>
                  <span className="font-medium">245ms</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Marketplace settings and configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Commission Rate (%)</label>
                  <Input type="number" defaultValue="5" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Products per Vendor</label>
                  <Input type="number" defaultValue="1000" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subscription Grace Period (days)</label>
                  <Input type="number" defaultValue="7" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto-approve Vendors</label>
                  <Select defaultValue="false">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Enabled</SelectItem>
                      <SelectItem value="false">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="mt-4">Save Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Monitor system health and resolve issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border rounded-lg ${
                      alert.resolved ? 'bg-muted/50' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <p className={`font-medium ${alert.resolved ? 'text-muted-foreground' : ''}`}>
                            {alert.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {alert.resolved ? (
                          <Badge variant="secondary">Resolved</Badge>
                        ) : (
                          <Button variant="outline" size="sm">
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}