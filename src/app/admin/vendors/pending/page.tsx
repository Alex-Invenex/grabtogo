'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  Filter,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import AdminBreadcrumb from '../../components/AdminBreadcrumb';

interface PendingVendor {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  businessType: string;
  businessCategory: string;
  city: string;
  state: string;
  pinCode: string;
  gstNumber?: string;
  agentCode?: string;
  agentName?: string;
  selectedPackage: 'basic' | 'premium' | 'enterprise';
  documents: {
    businessLicense?: string;
    gstCertificate?: string;
    identityProof?: string;
    addressProof?: string;
  };
  createdAt: string;
  paymentStatus: 'pending' | 'completed';
  paymentAmount: number;
  priority: 'low' | 'medium' | 'high';
}

// Mock data
const mockPendingVendors: PendingVendor[] = [
  {
    id: '1',
    fullName: 'Rajesh Kumar',
    email: 'rajesh@freshfoods.com',
    phone: '+91 98765 43210',
    companyName: 'Fresh Foods Market',
    businessType: 'Grocery Store',
    businessCategory: 'Food & Beverage',
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    pinCode: '695001',
    gstNumber: '32AABCU9603R1ZM',
    selectedPackage: 'premium',
    documents: {
      businessLicense: '/docs/business-license-1.pdf',
      gstCertificate: '/docs/gst-cert-1.pdf',
      identityProof: '/docs/id-proof-1.pdf',
      addressProof: '/docs/address-proof-1.pdf',
    },
    createdAt: '2024-01-28T10:30:00Z',
    paymentStatus: 'completed',
    paymentAmount: 299,
    priority: 'high',
  },
  {
    id: '2',
    fullName: 'Priya Sharma',
    email: 'priya@spiceparadise.com',
    phone: '+91 87654 32109',
    companyName: 'Spice Paradise',
    businessType: 'Restaurant',
    businessCategory: 'Food & Beverage',
    city: 'Kochi',
    state: 'Kerala',
    pinCode: '682001',
    selectedPackage: 'basic',
    documents: {
      businessLicense: '/docs/business-license-2.pdf',
      identityProof: '/docs/id-proof-2.pdf',
    },
    createdAt: '2024-01-28T08:15:00Z',
    paymentStatus: 'pending',
    paymentAmount: 99,
    priority: 'medium',
  },
];

export default function PendingVendorApprovalsPage() {
  const [vendors, setVendors] = useState<PendingVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<PendingVendor | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    // Simulate API call
    const fetchPendingVendors = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

      let filteredVendors = mockPendingVendors;
      if (searchQuery) {
        filteredVendors = filteredVendors.filter(
          (vendor) =>
            vendor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.city.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setVendors(filteredVendors);
      setLoading(false);
    };

    fetchPendingVendors();
  }, [searchQuery]);

  const handleApprove = async (vendorId: string) => {
    setIsProcessing(true);
    try {
      // API call to approve vendor
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setVendors((prev) => prev.filter((v) => v.id !== vendorId));
      setSelectedVendor(null);
    } catch (error) {
      console.error('Error approving vendor:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (vendorId: string, reason: string) => {
    if (!reason.trim()) return;

    setIsProcessing(true);
    try {
      // API call to reject vendor
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setVendors((prev) => prev.filter((v) => v.id !== vendorId));
      setSelectedVendor(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting vendor:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPackageColor = (pkg: string) => {
    switch (pkg) {
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminBreadcrumb
          items={[{ title: 'Vendors', href: '/admin/vendors' }, { title: 'Pending Approvals' }]}
        />
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <AdminBreadcrumb
        items={[{ title: 'Vendors', href: '/admin/vendors' }, { title: 'Pending Approvals' }]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Vendor Approvals</h1>
          <p className="text-gray-600 mt-2">Review and approve new vendor registration requests</p>
        </div>
        <Badge variant="default" className="bg-orange-600">
          {vendors.length} Pending
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search pending vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      {vendors.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending vendor registration requests at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {vendors.map((vendor, index) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Vendor Info */}
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="text-lg font-semibold">
                          {vendor.companyName.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {vendor.companyName}
                          </h3>
                          <Badge className={`text-xs ${getPriorityColor(vendor.priority)}`}>
                            {vendor.priority} priority
                          </Badge>
                          <Badge className={`text-xs ${getPackageColor(vendor.selectedPackage)}`}>
                            {vendor.selectedPackage} package
                          </Badge>
                        </div>

                        <p className="text-gray-600 font-medium">{vendor.fullName}</p>

                        {/* Contact Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{vendor.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{vendor.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>
                              {vendor.city}, {vendor.state}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{new Date(vendor.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Business Details */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span>
                              {vendor.businessType} • {vendor.businessCategory}
                            </span>
                          </div>
                          {vendor.gstNumber && (
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span>GST: {vendor.gstNumber}</span>
                            </div>
                          )}
                        </div>

                        {/* Payment Status */}
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={vendor.paymentStatus === 'completed' ? 'default' : 'secondary'}
                          >
                            Payment: {vendor.paymentStatus} (₹{vendor.paymentAmount})
                          </Badge>
                          {vendor.paymentStatus === 'pending' && (
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVendor(vendor)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Vendor Registration Details</DialogTitle>
                            <DialogDescription>
                              Review all information before approving or rejecting
                            </DialogDescription>
                          </DialogHeader>

                          {selectedVendor && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                              {/* Personal Information */}
                              <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <Building2 className="w-5 h-5" />
                                  Business Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <strong>Company:</strong> {selectedVendor.companyName}
                                  </div>
                                  <div>
                                    <strong>Owner:</strong> {selectedVendor.fullName}
                                  </div>
                                  <div>
                                    <strong>Business Type:</strong> {selectedVendor.businessType}
                                  </div>
                                  <div>
                                    <strong>Category:</strong> {selectedVendor.businessCategory}
                                  </div>
                                  <div>
                                    <strong>Package:</strong> {selectedVendor.selectedPackage}
                                  </div>
                                  {selectedVendor.gstNumber && (
                                    <div>
                                      <strong>GST Number:</strong> {selectedVendor.gstNumber}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Contact Information */}
                              <div className="space-y-4">
                                <h4 className="font-semibold">Contact Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <strong>Email:</strong> {selectedVendor.email}
                                  </div>
                                  <div>
                                    <strong>Phone:</strong> {selectedVendor.phone}
                                  </div>
                                  <div>
                                    <strong>Address:</strong> {selectedVendor.city},{' '}
                                    {selectedVendor.state} - {selectedVendor.pinCode}
                                  </div>
                                  <div>
                                    <strong>Applied:</strong>{' '}
                                    {new Date(selectedVendor.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              {/* Documents */}
                              <div className="md:col-span-2">
                                <h4 className="font-semibold mb-4">Documents Uploaded</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {Object.entries(selectedVendor.documents).map(
                                    ([key, value]) =>
                                      value && (
                                        <div key={key} className="border rounded-lg p-3">
                                          <FileText className="w-8 h-8 text-blue-500 mb-2" />
                                          <p className="text-xs font-medium capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                          </p>
                                          <Button variant="link" className="p-0 h-auto text-xs">
                                            View Document
                                          </Button>
                                        </div>
                                      )
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          <DialogFooter className="gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" disabled={isProcessing}>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Vendor Application</DialogTitle>
                                  <DialogDescription>
                                    Please provide a reason for rejecting this application.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <Label htmlFor="reason">Rejection Reason</Label>
                                  <Textarea
                                    id="reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter reason for rejection..."
                                    className="mt-2"
                                  />
                                </div>
                                <DialogFooter>
                                  <Button variant="outline">Cancel</Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() =>
                                      selectedVendor &&
                                      handleReject(selectedVendor.id, rejectionReason)
                                    }
                                    disabled={!rejectionReason.trim() || isProcessing}
                                  >
                                    Reject Application
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Button
                              onClick={() => selectedVendor && handleApprove(selectedVendor.id)}
                              disabled={isProcessing}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {isProcessing ? 'Processing...' : 'Approve & Activate'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button
                        onClick={() => handleApprove(vendor.id)}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
