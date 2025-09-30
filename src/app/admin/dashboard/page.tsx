'use client';

import React from 'react';
import { motion } from 'framer-motion';
import StatsCards from './components/StatsCards';
import RecentActivity from './components/RecentActivity';
import QuickActions from './components/QuickActions';
import Charts from './components/Charts';
import AdminBreadcrumb from '../components/AdminBreadcrumb';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <AdminBreadcrumb items={[{ title: 'Dashboard', href: '/admin/dashboard' }]} />

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Welcome back, Admin!</h1>
            <p className="text-blue-100 text-sm">
              Here&apos;s what&apos;s happening with your marketplace today.
            </p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="hidden md:block"
          >
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">👋</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StatsCards />
      </motion.div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts - Takes 2 columns */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Charts />
        </motion.div>

        {/* Recent Activity - Takes 1 column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <RecentActivity />
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <QuickActions />
      </motion.div>
    </div>
  );
}
