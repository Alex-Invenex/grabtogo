'use client'

import * as React from 'react'
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, AlertTriangle, UserCheck, UserX, Activity, Database, Shield, Lock, Eye, Clock } from 'lucide-react'

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

interface SecurityEvent {
  id: string
  userId?: string
  userName?: string
  event: string
  details: string
  ipAddress: string
  userAgent: string
  timestamp: string
  riskLevel: 'low' | 'medium' | 'high'
}

interface SuspiciousActivity {
  id: string
  userId: string
  userName: string
  reasons: string[]
  ipAddress: string
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

  const securityEvents: SecurityEvent[] = [
    {
      id: '1',
      userId: '1',
      userName: 'Rajesh Kumar',
      event: 'login_failed_invalid_password',
      details: 'Failed login attempt with invalid password',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: '2024-01-28T10:45:00Z',
      riskLevel: 'medium'
    },
    {
      id: '2',
      userId: '2',
      userName: 'Priya Sharma',
      event: 'login_success',
      details: 'Successful login',
      ipAddress: '192.168.1.50',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS)',
      timestamp: '2024-01-28T10:30:00Z',
      riskLevel: 'low'
    },
    {
      id: '3',
      event: 'signup_duplicate_email',
      details: 'Attempted registration with existing email',
      ipAddress: '10.0.0.25',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      timestamp: '2024-01-28T09:15:00Z',
      riskLevel: 'medium'
    },
    {
      id: '4',
      userId: '4',
      userName: 'Sarah Johnson',
      event: 'account_locked',
      details: 'Account locked due to multiple failed attempts',
      ipAddress: '203.0.113.10',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      timestamp: '2024-01-28T08:45:00Z',
      riskLevel: 'high'
    },
    {
      id: '5',
      userId: '1',
      userName: 'Rajesh Kumar',
      event: 'password_reset_requested',
      details: 'Password reset requested',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: '2024-01-28T07:30:00Z',
      riskLevel: 'medium'
    }
  ]

  const suspiciousActivities: SuspiciousActivity[] = [
    {
      id: '1',
      userId: '4',
      userName: 'Sarah Johnson',
      reasons: ['Multiple failed login attempts in the last hour', 'Logins from multiple IP addresses'],
      ipAddress: '203.0.113.10',
      timestamp: '2024-01-28T08:45:00Z',
      resolved: false
    },
    {
      id: '2',
      userId: '5',
      userName: 'Unknown User',
      reasons: ['New account with immediate activity', 'Unusual time patterns'],
      ipAddress: '198.51.100.5',
      timestamp: '2024-01-28T06:20:00Z',
      resolved: true
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

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>
      default:
        return <Badge variant="outline">{riskLevel}</Badge>
    }
  }

  const getEventIcon = (event: string) => {
    if (event.includes('login_success')) return <UserCheck className="h-4 w-4 text-green-500" />
    if (event.includes('login_failed')) return <UserX className="h-4 w-4 text-red-500" />
    if (event.includes('locked')) return <Lock className="h-4 w-4 text-red-600" />
    if (event.includes('password_reset')) return <Shield className="h-4 w-4 text-blue-500" />
    if (event.includes('signup')) return <Users className="h-4 w-4 text-blue-500" />
    return <Activity className="h-4 w-4 text-gray-500" />
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
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

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Events</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityEvents.length}</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securityEvents.filter(e => e.event.includes('login_failed')).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  +2 from yesterday
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Locked Accounts</CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securityEvents.filter(e => e.event.includes('locked')).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {suspiciousActivities.filter(a => !a.resolved).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Needs investigation
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>Latest authentication and security events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      {getEventIcon(event.event)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {event.userName || 'Unknown User'}
                          </p>
                          <div className="flex items-center space-x-2">
                            {getRiskBadge(event.riskLevel)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.details}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            IP: {event.ipAddress}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Event: {event.event}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  View All Events
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suspicious Activities</CardTitle>
                <CardDescription>Activities requiring investigation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suspiciousActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-3 border rounded-lg ${
                        activity.resolved ? 'bg-muted/50' : 'bg-background'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                            activity.resolved ? 'text-muted-foreground' : 'text-red-500'
                          }`} />
                          <div className="flex-1">
                            <p className={`font-medium ${activity.resolved ? 'text-muted-foreground' : ''}`}>
                              {activity.userName}
                            </p>
                            <div className="space-y-1 mt-1">
                              {activity.reasons.map((reason, index) => (
                                <p key={index} className="text-sm text-muted-foreground">
                                  • {reason}
                                </p>
                              ))}
                            </div>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-muted-foreground">
                                IP: {activity.ipAddress}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(activity.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {activity.resolved ? (
                            <Badge variant="secondary">Resolved</Badge>
                          ) : (
                            <Button variant="outline" size="sm">
                              Investigate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Security Event Log</CardTitle>
              <CardDescription>Complete audit trail of security events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getEventIcon(event.event)}
                          <span>{event.userName || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {event.event.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{event.ipAddress}</span>
                      </TableCell>
                      <TableCell>{getRiskBadge(event.riskLevel)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {event.details}
                        </span>
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