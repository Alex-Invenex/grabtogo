'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Download, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import VendorsTable from './components/VendorsTable';
import VendorFilters from './components/VendorFilters';
import VendorStats from './components/VendorStats';
import AdminBreadcrumb from '../components/AdminBreadcrumb';

export default function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [vendorStats, setVendorStats] = useState({
    total: 2341,
    active: 2198,
    pending: 23,
    suspended: 45,
    inactive: 75,
  });

  const handleExport = () => {
    console.log('Exporting vendor data...');
    // Implement export functionality
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <AdminBreadcrumb items={[{ title: 'Vendors', href: '/admin/vendors' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all vendors, registrations, and their business profiles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Stats */}
      <VendorStats stats={vendorStats} />

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search vendors by name, email, or business..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-gray-100' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <VendorFilters />
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Vendor Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="relative">
            All Vendors
            <Badge variant="secondary" className="ml-2">
              {vendorStats.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="relative">
            Active
            <Badge variant="default" className="ml-2 bg-green-600">
              {vendorStats.active}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending
            <Badge variant="default" className="ml-2 bg-orange-600">
              {vendorStats.pending}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="suspended" className="relative">
            Suspended
            <Badge variant="destructive" className="ml-2">
              {vendorStats.suspended}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="inactive" className="relative">
            Inactive
            <Badge variant="secondary" className="ml-2">
              {vendorStats.inactive}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="all">
            <VendorsTable status="all" searchQuery={searchQuery} />
          </TabsContent>
          <TabsContent value="active">
            <VendorsTable status="ACTIVE" searchQuery={searchQuery} />
          </TabsContent>
          <TabsContent value="pending">
            <VendorsTable status="PENDING" searchQuery={searchQuery} />
          </TabsContent>
          <TabsContent value="suspended">
            <VendorsTable status="SUSPENDED" searchQuery={searchQuery} />
          </TabsContent>
          <TabsContent value="inactive">
            <VendorsTable status="INACTIVE" searchQuery={searchQuery} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
