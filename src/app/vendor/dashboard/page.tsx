'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  Star,
  Eye,
  MessageSquare,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatPrice } from '@/lib/utils';
import { ChartSkeleton, TableSkeleton } from '@/components/ui/loading-states';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  averageRating: number;
  totalReviews: number;
  storyViews: number;
  newMessages: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  items: string[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

interface SubscriptionInfo {
  planType: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'expired' | 'cancelled';
  currentPeriodEnd: string;
  maxProducts: number;
  maxOrders: number;
  usedProducts: number;
  usedOrders: number;
}

export default function VendorDashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = React.useState<RecentOrder[]>([]);
  const [subscription, setSubscription] = React.useState<SubscriptionInfo | null>(null);

  // Mock data for demonstration
  const mockStats: DashboardStats = {
    totalProducts: 24,
    totalOrders: 156,
    totalRevenue: 48750,
    totalCustomers: 89,
    averageRating: 4.7,
    totalReviews: 142,
    storyViews: 2340,
    newMessages: 7,
  };

  const mockOrders: RecentOrder[] = [
    {
      id: 'ORD-001',
      customerName: 'Priya Sharma',
      items: ['Fresh Mangoes (2kg)', 'Organic Apples (1kg)'],
      total: 450,
      status: 'pending',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'ORD-002',
      customerName: 'Rajesh Kumar',
      items: ['Mixed Fruit Box'],
      total: 299,
      status: 'confirmed',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ORD-003',
      customerName: 'Amit Patel',
      items: ['Seasonal Fruits (5kg)', 'Coconut Water (6 bottles)'],
      total: 850,
      status: 'shipped',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ORD-004',
      customerName: 'Sunita Devi',
      items: ['Dragon Fruit (500g)'],
      total: 180,
      status: 'delivered',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const mockSubscription: SubscriptionInfo = {
    planType: 'premium',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    maxProducts: 50,
    maxOrders: 500,
    usedProducts: 24,
    usedOrders: 156,
  };

  React.useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats(mockStats);
      setRecentOrders(mockOrders);
      setSubscription(mockSubscription);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      confirmed: 'secondary',
      shipped: 'outline',
      delivered: 'success',
      cancelled: 'destructive',
    } as const;

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    } as const;

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPlanBadge = (planType: string) => {
    const colors = {
      basic: 'bg-gray-100 text-gray-800',
      premium: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800',
    } as const;

    return (
      <Badge className={colors[planType as keyof typeof colors] || colors.basic}>
        {planType.charAt(0).toUpperCase() + planType.slice(1)}
      </Badge>
    );
  };

  const getUsagePercentage = (used: number, max: number) => {
    return max === -1 ? 0 : Math.round((used / max) * 100);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['VENDOR']}>
        <div className="container mx-auto py-6">
          <div className="grid gap-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              <div className="h-10 w-32 bg-muted animate-pulse rounded" />
            </div>

            {/* Stats skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Content skeleton */}
            <div className="grid gap-6 md:grid-cols-2">
              <ChartSkeleton />
              <TableSkeleton />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['VENDOR']}>
      <div className="container mx-auto py-6">
        <div className="grid gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {session?.user?.name || 'Vendor'}
              </p>
            </div>
            <Button>
              <Package className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          {/* Subscription Status */}
          {subscription && (
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Subscription Status</CardTitle>
                    {getPlanBadge(subscription.planType)}
                    <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
                      {subscription.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage Plan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Products</span>
                      <span className="text-sm font-medium">
                        {subscription.usedProducts} /{' '}
                        {subscription.maxProducts === -1 ? '∞' : subscription.maxProducts}
                      </span>
                    </div>
                    <Progress
                      value={getUsagePercentage(
                        subscription.usedProducts,
                        subscription.maxProducts
                      )}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Orders</span>
                      <span className="text-sm font-medium">
                        {subscription.usedOrders} /{' '}
                        {subscription.maxOrders === -1 ? '∞' : subscription.maxOrders}
                      </span>
                    </div>
                    <Progress
                      value={getUsagePercentage(subscription.usedOrders, subscription.maxOrders)}
                      className="h-2"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Plan renews{' '}
                  {formatDistanceToNow(new Date(subscription.currentPeriodEnd), {
                    addSuffix: true,
                  })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">+2 from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">+8% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">+5 new this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageRating}</div>
                  <p className="text-xs text-muted-foreground">From {stats.totalReviews} reviews</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Story Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.storyViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.newMessages}</div>
                  <p className="text-xs text-muted-foreground">Unread messages</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Growth</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+12%</div>
                  <p className="text-xs text-muted-foreground">vs last month</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Content Tabs */}
          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orders">Recent Orders</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="stories">Stories</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest orders from your customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{order.id}</h4>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Customer: {order.customerName}
                          </p>
                          <p className="text-sm">Items: {order.items.join(', ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(order.total)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      Charts will be displayed here
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['Fresh Mangoes', 'Organic Apples', 'Mixed Fruit Box', 'Dragon Fruit'].map(
                        (product, i) => (
                          <div key={product} className="flex items-center justify-between">
                            <span className="text-sm">{product}</span>
                            <span className="text-sm font-medium">{45 - i * 8} orders</span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="stories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Stories</CardTitle>
                  <CardDescription>
                    Manage your vendor stories and see engagement metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stories yet</p>
                    <Button className="mt-4">Create Your First Story</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
