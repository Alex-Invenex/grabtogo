'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Users,
  IndianRupee,
  Calendar,
  Eye,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface PaymentStats {
  totalRevenue: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  refundedAmount: number;
  registrationFees: number;
  subscriptionRevenue: number;
  averageOrderValue: number;
  growthRate: number;
}

interface RecentPayment {
  id: string;
  vendorName: string;
  amount: number;
  status: string;
  type: string;
  createdAt: string;
  razorpayPaymentId?: string;
}

interface PaymentDashboardProps {
  stats: PaymentStats;
  recentPayments: RecentPayment[];
  revenueData: Array<{ month: string; revenue: number; payments: number }>;
  paymentTypeData: Array<{ name: string; value: number; color: string }>;
  onRefresh?: () => void;
  loading?: boolean;
}

const PaymentDashboard: React.FC<PaymentDashboardProps> = ({
  stats,
  recentPayments,
  revenueData,
  paymentTypeData,
  onRefresh,
  loading = false,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any; label: string }> = {
      SUCCESS: { variant: 'success', icon: CheckCircle, label: 'Success' },
      PENDING: { variant: 'warning', icon: Clock, label: 'Pending' },
      FAILED: { variant: 'destructive', icon: AlertTriangle, label: 'Failed' },
      REFUNDED: { variant: 'outline', icon: RefreshCw, label: 'Refunded' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const successRate = stats.totalPayments > 0
    ? ((stats.successfulPayments / stats.totalPayments) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and manage all payment transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className={`flex items-center gap-1 ${stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.growthRate >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(stats.growthRate)}% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {successRate}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedPayments}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
        <TabsList>
          <TabsTrigger value="7d">7 Days</TabsTrigger>
          <TabsTrigger value="30d">30 Days</TabsTrigger>
          <TabsTrigger value="90d">90 Days</TabsTrigger>
          <TabsTrigger value="1y">1 Year</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTimeframe} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>
                  Revenue and payment volume over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : value,
                        name === 'revenue' ? 'Revenue' : 'Payments'
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f97316"
                      strokeWidth={2}
                      name="revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="payments"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="payments"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of payment types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Payment Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Successful Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.successfulPayments}</div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(stats.totalRevenue - stats.refundedAmount)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600">Pending Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{stats.pendingPayments}</div>
                <p className="text-sm text-muted-foreground">
                  Awaiting confirmation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Failed Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.failedPayments}</div>
                <p className="text-sm text-muted-foreground">
                  Need investigation
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>
            Latest payment transactions across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <div className="font-medium">{payment.vendorName}</div>
                    <div className="text-sm text-muted-foreground">
                      {payment.type} • {new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                    {payment.razorpayPaymentId && (
                      <div className="text-xs text-muted-foreground">
                        ID: {payment.razorpayPaymentId}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(payment.amount)}</div>
                    {getStatusBadge(payment.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentDashboard;