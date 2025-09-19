'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  Calendar,
  Users,
  Store,
  Percent
} from "lucide-react"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function FinancialOversight() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Mock financial data
  const financialStats = {
    totalRevenue: 2847639,
    monthlyGrowth: 15.7,
    totalTransactions: 12847,
    avgTransactionValue: 221.45,
    platformFee: 284763.9, // 10% of revenue
    vendorPayouts: 2562875.1, // 90% of revenue
    pendingPayouts: 145230,
    failedTransactions: 234,
    refundRequests: 89,
    taxCollected: 512177.02
  }

  const revenueData = [
    { month: 'Jan', revenue: 245000, transactions: 1850, platformFee: 24500 },
    { month: 'Feb', revenue: 278000, transactions: 2100, platformFee: 27800 },
    { month: 'Mar', revenue: 296000, transactions: 2250, platformFee: 29600 },
    { month: 'Apr', revenue: 312000, transactions: 2400, platformFee: 31200 },
    { month: 'May', revenue: 334000, transactions: 2600, platformFee: 33400 },
    { month: 'Jun', revenue: 367000, transactions: 2850, platformFee: 36700 },
  ]

  const paymentMethodData = [
    { name: 'Credit Card', value: 45, color: '#3B82F6' },
    { name: 'Debit Card', value: 30, color: '#10B981' },
    { name: 'UPI', value: 15, color: '#F59E0B' },
    { name: 'Net Banking', value: 8, color: '#8B5CF6' },
    { name: 'Wallet', value: 2, color: '#EF4444' },
  ]

  const transactionTrends = [
    { time: '00:00', successful: 245, failed: 12 },
    { time: '04:00', successful: 189, failed: 8 },
    { time: '08:00', successful: 567, failed: 23 },
    { time: '12:00', successful: 834, failed: 34 },
    { time: '16:00', successful: 712, failed: 28 },
    { time: '20:00', successful: 456, failed: 19 },
  ]

  const topPerformingVendors = [
    { name: 'Fresh Market Plus', revenue: 145678, transactions: 234, commission: 14567.8 },
    { name: 'Tech Solutions Hub', revenue: 123456, transactions: 189, commission: 12345.6 },
    { name: 'Style & Fashion', revenue: 98765, transactions: 167, commission: 9876.5 },
    { name: 'Home Essentials', revenue: 87654, transactions: 145, commission: 8765.4 },
    { name: 'Digital Services Pro', revenue: 76543, transactions: 134, commission: 7654.3 },
  ]

  const payoutSchedule = [
    {
      id: 1,
      vendor: 'Fresh Market Plus',
      amount: 145678,
      dueDate: '2024-01-25',
      status: 'pending',
      transactionCount: 234
    },
    {
      id: 2,
      vendor: 'Tech Solutions Hub',
      amount: 123456,
      dueDate: '2024-01-25',
      status: 'pending',
      transactionCount: 189
    },
    {
      id: 3,
      vendor: 'Style & Fashion',
      amount: 98765,
      dueDate: '2024-01-24',
      status: 'processed',
      transactionCount: 167
    },
    {
      id: 4,
      vendor: 'Home Essentials',
      amount: 87654,
      dueDate: '2024-01-24',
      status: 'processed',
      transactionCount: 145
    }
  ]

  const recentTransactions = [
    {
      id: 1,
      orderId: 'ORD-2024-001234',
      customer: 'John Doe',
      vendor: 'Fresh Market Plus',
      amount: 2456,
      fee: 245.6,
      method: 'Credit Card',
      status: 'completed',
      timestamp: '2024-01-20T14:30:00Z'
    },
    {
      id: 2,
      orderId: 'ORD-2024-001235',
      customer: 'Jane Smith',
      vendor: 'Tech Solutions Hub',
      amount: 15678,
      fee: 1567.8,
      method: 'UPI',
      status: 'completed',
      timestamp: '2024-01-20T14:25:00Z'
    },
    {
      id: 3,
      orderId: 'ORD-2024-001236',
      customer: 'Mike Johnson',
      vendor: 'Style & Fashion',
      amount: 3456,
      fee: 345.6,
      method: 'Debit Card',
      status: 'failed',
      timestamp: '2024-01-20T14:20:00Z'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-500 hover:bg-red-600">Failed</Badge>
      case 'processed':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Processed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Oversight</h1>
          <p className="text-gray-400">Monitor revenue, payments, and financial metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">₹{financialStats.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-sm text-green-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{financialStats.monthlyGrowth}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{financialStats.totalTransactions.toLocaleString()}</div>
            <div className="text-sm text-gray-400">
              Avg: ₹{financialStats.avgTransactionValue} per transaction
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Platform Fee</CardTitle>
            <Percent className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">₹{financialStats.platformFee.toLocaleString()}</div>
            <div className="text-sm text-gray-400">
              10% commission from vendors
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">₹{financialStats.pendingPayouts.toLocaleString()}</div>
            <div className="text-sm text-gray-400">
              {payoutSchedule.filter(p => p.status === 'pending').length} vendors
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Financial Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Revenue Trend</CardTitle>
                <CardDescription className="text-gray-400">Monthly revenue and transaction growth</CardDescription>
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
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Payment Methods</CardTitle>
                <CardDescription className="text-gray-400">Distribution of payment methods used</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Success Rate */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Transaction Success Rate (24h)</CardTitle>
              <CardDescription className="text-gray-400">Successful vs failed transactions throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={transactionTrends}>
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
                  <Bar dataKey="successful" fill="#10B981" />
                  <Bar dataKey="failed" fill="#EF4444" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Performing Vendors */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Top Revenue Generating Vendors</CardTitle>
              <CardDescription className="text-gray-400">Vendors contributing most to platform revenue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topPerformingVendors.map((vendor, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{vendor.name}</p>
                      <p className="text-xs text-gray-400">{vendor.transactions} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-400">₹{vendor.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Fee: ₹{vendor.commission.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Transactions</CardTitle>
              <CardDescription className="text-gray-400">Latest payment transactions on the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-600 rounded-lg">
                      <CreditCard className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{transaction.orderId}</p>
                      <p className="text-xs text-gray-400">{transaction.customer} • {transaction.vendor}</p>
                      <p className="text-xs text-gray-500">{new Date(transaction.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white">₹{transaction.amount.toLocaleString()}</span>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <p className="text-xs text-gray-400">{transaction.method} • Fee: ₹{transaction.fee}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Payouts</CardTitle>
                <Banknote className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">₹{financialStats.vendorPayouts.toLocaleString()}</div>
                <p className="text-xs text-gray-400">Paid to vendors</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Pending Payouts</CardTitle>
                <Clock className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">₹{financialStats.pendingPayouts.toLocaleString()}</div>
                <p className="text-xs text-gray-400">Awaiting processing</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Next Payout</CardTitle>
                <Calendar className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">Jan 25</div>
                <p className="text-xs text-gray-400">Weekly payout schedule</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Payout Schedule</CardTitle>
              <CardDescription className="text-gray-400">Upcoming and recent vendor payouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {payoutSchedule.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <Store className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{payout.vendor}</p>
                      <p className="text-xs text-gray-400">{payout.transactionCount} transactions</p>
                      <p className="text-xs text-gray-500">Due: {new Date(payout.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white">₹{payout.amount.toLocaleString()}</span>
                      {getStatusBadge(payout.status)}
                    </div>
                    {payout.status === 'pending' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Process Payout
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Financial Analytics</CardTitle>
              <CardDescription className="text-gray-400">
                Detailed financial analysis and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Advanced analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Financial Reports</CardTitle>
              <CardDescription className="text-gray-400">
                Generate and download financial reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Financial reporting system coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}