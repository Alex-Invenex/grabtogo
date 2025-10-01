'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Mock data for charts
const revenueData = [
  { month: 'Jan', revenue: 45000, orders: 1250, vendors: 180 },
  { month: 'Feb', revenue: 52000, orders: 1400, vendors: 195 },
  { month: 'Mar', revenue: 48000, orders: 1320, vendors: 210 },
  { month: 'Apr', revenue: 61000, orders: 1650, vendors: 225 },
  { month: 'May', revenue: 55000, orders: 1480, vendors: 240 },
  { month: 'Jun', revenue: 67000, orders: 1820, vendors: 255 },
  { month: 'Jul', revenue: 71000, orders: 1950, vendors: 270 },
];

const vendorCategoryData = [
  { name: 'Food & Dining', value: 35, color: '#3B82F6' },
  { name: 'Grocery', value: 25, color: '#10B981' },
  { name: 'Fashion', value: 20, color: '#F59E0B' },
  { name: 'Electronics', value: 15, color: '#EF4444' },
  { name: 'Others', value: 5, color: '#8B5CF6' },
];

const dailyActivityData = [
  { hour: '00', orders: 12, users: 45 },
  { hour: '04', orders: 8, users: 32 },
  { hour: '08', orders: 35, users: 120 },
  { hour: '12', orders: 78, users: 245 },
  { hour: '16', orders: 65, users: 198 },
  { hour: '20', orders: 45, users: 156 },
];

export default function Charts() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real analytics data
  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics?days=30');
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        setChartData(data.chartData);
        setCategoryData(data.categoryDistribution);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Main Charts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>Performance metrics over time</CardDescription>
            </div>
            <Badge variant="outline">Last 7 months</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue" className="mt-6">
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">Loading...</div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis
                      stroke="#666"
                      fontSize={12}
                      tickFormatter={(value) => `₹${value / 1000}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </TabsContent>

            <TabsContent value="orders" className="mt-6">
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">Loading...</div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                )}
              </div>
            </TabsContent>

            <TabsContent value="vendors" className="mt-6">
              <div className="h-80">
                <div className="flex items-center justify-center h-full text-gray-500">
                  Vendor growth chart coming soon
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vendors_old" className="mt-6 hidden">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[]}>


                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="vendors"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || categoryData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                {loading ? 'Loading...' : 'No category data available'}
              </div>
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="category"
                      >
                        {categoryData.map((entry, index) => {
                          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, 'Products']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {categoryData.map((cat, index) => {
                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];
                    return (
                      <div key={cat.category} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        ></div>
                        <span>{cat.category} ({cat.count})</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>Orders and users by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyActivityData}>
                  <defs>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="hour"
                    stroke="#666"
                    fontSize={12}
                    tickFormatter={(value) => `${value}:00`}
                  />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip labelFormatter={(value) => `${value}:00`} content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stackId="1"
                    stroke="#8B5CF6"
                    fill="url(#usersGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stackId="1"
                    stroke="#EF4444"
                    fill="url(#ordersGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Users</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Orders</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
