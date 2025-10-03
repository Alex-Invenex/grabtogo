'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Eye,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Pause,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Store,
  Crown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import VendorStatusBadge from './VendorStatusBadge';

interface Vendor {
  id: string;
  companyName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  businessType: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE';
  subscriptionPlan: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  registrationDate: string;
  lastActive: string;
  totalOrders: number;
  monthlyRevenue: number;
  rating: number;
  logo?: string;
  gstVerified: boolean;
}

interface VendorsTableProps {
  status: string;
  searchQuery: string;
}

export default function VendorsTable({ status, searchQuery }: VendorsTableProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const _itemsPerPage = 10;

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        let allVendors: Vendor[] = [];

        // Fetch pending vendor registration requests
        if (status === 'all' || status === 'PENDING') {
          const regResponse = await fetch('/api/admin/vendor-registrations');
          if (regResponse.ok) {
            const regData = await regResponse.json();
            const pendingVendors = regData.requests
              .filter((req: any) => req.status === 'pending')
              .map((req: any) => ({
                id: req.id,
                companyName: req.companyName,
                ownerName: req.fullName,
                email: req.email,
                phone: req.phone,
                city: req.city,
                businessType: req.businessType || req.businessCategory || 'Not specified',
                status: 'PENDING' as const,
                subscriptionPlan: req.selectedPackage?.toUpperCase() || 'BASIC' as const,
                registrationDate: req.createdAt,
                lastActive: req.createdAt,
                totalOrders: 0,
                monthlyRevenue: 0,
                rating: 0,
                logo: req.logo,
                gstVerified: req.gstVerified || false,
              }));
            allVendors = [...allVendors, ...pendingVendors];
          }
        }

        // Fetch approved vendors (users with vendor role)
        if (status === 'all' || status !== 'PENDING') {
          const vendorResponse = await fetch(`/api/admin/vendors?status=${status}`);
          if (vendorResponse.ok) {
            const vendorData = await vendorResponse.json();
            const approvedVendors = vendorData.vendors.map((vendor: any) => {
              // Determine vendor status
              let vendorStatus: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE' = 'INACTIVE';
              if (vendor.vendorProfile) {
                if (vendor.vendorProfile.isVerified && vendor.vendorProfile.isActive) {
                  vendorStatus = 'ACTIVE';
                } else if (!vendor.vendorProfile.isActive) {
                  vendorStatus = 'SUSPENDED';
                } else if (!vendor.vendorProfile.isVerified) {
                  vendorStatus = 'INACTIVE';
                }
              }

              return {
                id: vendor.id,
                companyName: vendor.vendorProfile?.storeName || vendor.name || 'Unknown',
                ownerName: vendor.name || 'Unknown',
                email: vendor.email,
                phone: vendor.phone || 'N/A',
                city: vendor.vendorProfile?.city || 'N/A',
                businessType: vendor.vendorProfile?.description || 'Not specified',
                status: vendorStatus,
                subscriptionPlan: vendor.vendorSubscription?.planType?.toUpperCase() || 'BASIC',
                registrationDate: vendor.createdAt,
                lastActive: vendor.updatedAt || vendor.createdAt,
                totalOrders: vendor._count?.orders || 0,
                monthlyRevenue: 0, // Would need analytics data
                rating: 0, // Would need reviews data
                logo: vendor.vendorProfile?.logoUrl || vendor.image,
                gstVerified: vendor.vendorProfile?.isVerified || false,
              };
            });
            allVendors = [...allVendors, ...approvedVendors];
          }
        }

        // Apply search filter
        if (searchQuery) {
          allVendors = allVendors.filter(
            (vendor) =>
              vendor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              vendor.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
              vendor.phone.includes(searchQuery) ||
              vendor.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
              vendor.businessType.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setVendors(allVendors);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [status, searchQuery]);

  const handleVendorAction = (vendorId: string, action: string) => {
    console.log(`${action} vendor:`, vendorId);
    // Implement vendor actions
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (vendors.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
          <p className="text-gray-600">
            {searchQuery
              ? `No vendors match your search "${searchQuery}"`
              : `No ${status.toLowerCase()} vendors available`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor, index) => (
              <motion.tr
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50"
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={vendor.logo} alt={vendor.companyName} />
                      <AvatarFallback>{vendor.companyName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{vendor.companyName}</p>
                        {vendor.subscriptionPlan === 'PREMIUM' && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                        {vendor.gstVerified && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                      <p className="text-sm text-gray-600">{vendor.ownerName}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span>{vendor.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{vendor.phone}</span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{vendor.city}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {vendor.businessType}
                  </Badge>
                </TableCell>

                <TableCell>
                  <VendorStatusBadge status={vendor.status} />
                </TableCell>

                <TableCell>
                  <Badge
                    variant={vendor.subscriptionPlan === 'PREMIUM' ? 'default' : 'secondary'}
                    className={
                      vendor.subscriptionPlan === 'PREMIUM'
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : ''
                    }
                  >
                    {vendor.subscriptionPlan}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{vendor.totalOrders} orders</div>
                    <div className="text-xs text-gray-600">
                      {formatCurrency(vendor.monthlyRevenue)}/month
                    </div>
                    {vendor.rating > 0 && (
                      <div className="text-xs text-gray-600">⭐ {vendor.rating.toFixed(1)}</div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>{formatDate(vendor.registrationDate)}</span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Link href={`/admin/vendors/${vendor.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleVendorAction(vendor.id, 'view')}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleVendorAction(vendor.id, 'edit')}>
                          Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {vendor.status === 'ACTIVE' && (
                          <DropdownMenuItem
                            onClick={() => handleVendorAction(vendor.id, 'suspend')}
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                        {vendor.status === 'SUSPENDED' && (
                          <DropdownMenuItem
                            onClick={() => handleVendorAction(vendor.id, 'activate')}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        {vendor.status === 'PENDING' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleVendorAction(vendor.id, 'approve')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleVendorAction(vendor.id, 'reject')}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleVendorAction(vendor.id, 'delete')}
                          className="text-red-600 focus:text-red-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
