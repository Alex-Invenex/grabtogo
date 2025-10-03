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
  RefreshCw,
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
import DocumentViewer from '@/components/admin/DocumentViewer';

interface PendingVendor {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  businessType: string | null;
  businessCategory: string | null;
  yearsInBusiness?: number | null;
  numberOfEmployees?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string | null;
  state: string;
  pinCode: string;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  deliveryRadius: number;
  gstNumber?: string | null;
  gstVerified?: boolean;
  gstDetails?: any;
  agentCode?: string | null;
  agentName?: string | null;
  agentPhone?: string | null;
  agentVisitDate?: string | null;
  referenceNotes?: string | null;
  selectedPackage: string;
  billingCycle: string;
  addOns?: any;
  gstCertificate?: string | null;
  panCard?: string | null;
  businessRegistration?: string | null;
  bankProof?: string | null;
  logo?: string | null;
  banner?: string | null;
  tagline?: string | null;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  createdAt: string;
}

export default function PendingVendorApprovalsPage() {
  const [vendors, setVendors] = useState<PendingVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<PendingVendor | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [documentUrls, setDocumentUrls] = useState<{ [key: string]: string }>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Generate signed URL for private documents
  const getSignedUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch('/api/vendor/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, expiresIn: 3600 }), // 1 hour expiry
      });

      if (!response.ok) throw new Error('Failed to generate signed URL');

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return url; // Fallback to original URL
    }
  };

  // Generate thumbnail URL for images
  const getThumbnailUrl = (url: string | null, width = 200, height = 200): string => {
    if (!url) return '';

    // Add Supabase image transformation parameters
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&height=${height}&quality=80`;
  };

  // Detect document type based on URL
  const getDocumentType = (url: string): 'pdf' | 'image' => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.pdf')) return 'pdf';
    return 'image';
  };

  // Fetch signed URLs for documents when vendor is selected
  useEffect(() => {
    if (!selectedVendor) return;

    const fetchDocumentUrls = async () => {
      const urls: { [key: string]: string } = {};

      // Fetch signed URLs for private documents
      if (selectedVendor.gstCertificate) {
        urls.gstCertificate = await getSignedUrl(selectedVendor.gstCertificate);
      }
      if (selectedVendor.panCard) {
        urls.panCard = await getSignedUrl(selectedVendor.panCard);
      }
      if (selectedVendor.businessRegistration) {
        urls.businessRegistration = await getSignedUrl(selectedVendor.businessRegistration);
      }
      if (selectedVendor.bankProof) {
        urls.bankProof = await getSignedUrl(selectedVendor.bankProof);
      }

      setDocumentUrls(urls);
    };

    fetchDocumentUrls();
  }, [selectedVendor]);

  const fetchPendingVendors = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/vendor-approvals', {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Failed to fetch vendor approvals');

      const data = await response.json();
      let filteredVendors = data.requests;

      if (searchQuery) {
        filteredVendors = filteredVendors.filter(
          (vendor: any) =>
            vendor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.city?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setVendors(filteredVendors);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching pending vendors:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchPendingVendors();
  }, [fetchPendingVendors]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPendingVendors();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchPendingVendors]);

  const handleApprove = async (vendorId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/vendor-approvals/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId: vendorId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve vendor');
      }

      // Remove from list
      setVendors((prev) => prev.filter((v) => v.id !== vendorId));
      setSelectedVendor(null);

      // Show success message
      alert('Vendor approved successfully! They will receive a confirmation email.');
    } catch (error) {
      console.error('Error approving vendor:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve vendor');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (vendorId: string, reason: string) => {
    if (!reason.trim()) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/vendor-approvals/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId: vendorId, reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject vendor');
      }

      // Remove from list
      setVendors((prev) => prev.filter((v) => v.id !== vendorId));
      setSelectedVendor(null);
      setRejectionReason('');

      // Show success message
      alert('Vendor rejected successfully. They will receive a notification email.');
    } catch (error) {
      console.error('Error rejecting vendor:', error);
      alert(error instanceof Error ? error.message : 'Failed to reject vendor');
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
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPendingVendors()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="default" className="bg-orange-600 text-lg px-4 py-2">
            {vendors.length} Pending
          </Badge>
        </div>
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
                              {vendor.businessType || 'Not specified'} •{' '}
                              {vendor.businessCategory || 'Not specified'}
                            </span>
                          </div>
                          {vendor.gstNumber && (
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span>GST: {vendor.gstNumber}</span>
                            </div>
                          )}
                        </div>

                        {/* Trial Info */}
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-600">
                            20-Day FREE Premium Trial on Approval
                          </Badge>
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
                            <div className="space-y-6 py-4">
                              {/* Header with Business Logo & Name */}
                              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                                {selectedVendor.logo ? (
                                  <img
                                    src={getThumbnailUrl(selectedVendor.logo, 100, 100)}
                                    alt="Logo"
                                    className="w-20 h-20 object-contain rounded-lg bg-white p-2 border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-20 h-20 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                                    <Building2 className="w-10 h-10 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h3 className="text-2xl font-bold text-gray-900">
                                    {selectedVendor.companyName}
                                  </h3>
                                  {selectedVendor.tagline && (
                                    <p className="text-gray-600 italic mt-1">{selectedVendor.tagline}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge className="bg-purple-600">{selectedVendor.selectedPackage} Package</Badge>
                                    <Badge variant="outline">{selectedVendor.billingCycle}</Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Business Information */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold flex items-center gap-2 text-lg border-b pb-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    Business Information
                                  </h4>
                                  <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Owner Name:</span>
                                      <span className="font-medium">{selectedVendor.fullName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Business Type:</span>
                                      <span className="font-medium">{selectedVendor.businessType || 'Not specified'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Category:</span>
                                      <span className="font-medium">{selectedVendor.businessCategory || 'Not specified'}</span>
                                    </div>
                                    {selectedVendor.yearsInBusiness && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Years in Business:</span>
                                        <span className="font-medium">{selectedVendor.yearsInBusiness} years</span>
                                      </div>
                                    )}
                                    {selectedVendor.numberOfEmployees && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Team Size:</span>
                                        <span className="font-medium">{selectedVendor.numberOfEmployees}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Contact Information */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold flex items-center gap-2 text-lg border-b pb-2">
                                    <Mail className="w-5 h-5 text-green-600" />
                                    Contact Details
                                  </h4>
                                  <div className="space-y-3 text-sm">
                                    <div className="flex items-start justify-between">
                                      <span className="text-gray-600">Email:</span>
                                      <span className="font-medium text-right">{selectedVendor.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Phone:</span>
                                      <span className="font-medium">{selectedVendor.phone}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Registration Date:</span>
                                      <span className="font-medium">
                                        {new Date(selectedVendor.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Address Information */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold flex items-center gap-2 text-lg border-b pb-2">
                                    <MapPin className="w-5 h-5 text-red-600" />
                                    Location & Address
                                  </h4>
                                  <div className="space-y-3 text-sm">
                                    <div>
                                      <span className="text-gray-600 block mb-1">Address:</span>
                                      <span className="font-medium">
                                        {selectedVendor.addressLine1}
                                        {selectedVendor.addressLine2 && <>, {selectedVendor.addressLine2}</>}
                                      </span>
                                    </div>
                                    {selectedVendor.landmark && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Landmark:</span>
                                        <span className="font-medium">{selectedVendor.landmark}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">City:</span>
                                      <span className="font-medium">{selectedVendor.city}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">State:</span>
                                      <span className="font-medium">{selectedVendor.state}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">PIN Code:</span>
                                      <span className="font-medium">{selectedVendor.pinCode}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Delivery Radius:</span>
                                      <span className="font-medium">{selectedVendor.deliveryRadius} km</span>
                                    </div>
                                    {(selectedVendor.latitude && selectedVendor.longitude) && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Coordinates:</span>
                                        <span className="font-medium text-xs">
                                          {selectedVendor.latitude.toFixed(6)}, {selectedVendor.longitude.toFixed(6)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* GST & Tax Information */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold flex items-center gap-2 text-lg border-b pb-2">
                                    <FileText className="w-5 h-5 text-orange-600" />
                                    GST & Tax Details
                                  </h4>
                                  <div className="space-y-3 text-sm">
                                    {selectedVendor.gstNumber ? (
                                      <>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">GST Number:</span>
                                          <span className="font-medium font-mono">{selectedVendor.gstNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-600">Verification Status:</span>
                                          {selectedVendor.gstVerified ? (
                                            <Badge className="bg-green-600">Verified</Badge>
                                          ) : (
                                            <Badge variant="outline">Not Verified</Badge>
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-gray-500 italic">No GST information provided</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Agent Reference (if applicable) */}
                              {selectedVendor.agentCode && (
                                <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <h4 className="font-semibold flex items-center gap-2 text-lg">
                                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                                    Agent Reference Information
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Agent Code:</span>
                                      <span className="font-medium">{selectedVendor.agentCode}</span>
                                    </div>
                                    {selectedVendor.agentName && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Agent Name:</span>
                                        <span className="font-medium">{selectedVendor.agentName}</span>
                                      </div>
                                    )}
                                    {selectedVendor.agentPhone && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Agent Phone:</span>
                                        <span className="font-medium">{selectedVendor.agentPhone}</span>
                                      </div>
                                    )}
                                    {selectedVendor.agentVisitDate && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Visit Date:</span>
                                        <span className="font-medium">{selectedVendor.agentVisitDate}</span>
                                      </div>
                                    )}
                                  </div>
                                  {selectedVendor.referenceNotes && (
                                    <div>
                                      <span className="text-gray-600 block mb-1">Reference Notes:</span>
                                      <p className="text-sm font-medium bg-white p-3 rounded border border-yellow-200">
                                        {selectedVendor.referenceNotes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Documents & Media */}
                              <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2 text-lg border-b pb-2">
                                  <FileText className="w-5 h-5 text-purple-600" />
                                  Documents & Media
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                  {/* GST Certificate */}
                                  {selectedVendor.gstCertificate && (
                                    <div className="border rounded-lg p-3 hover:border-blue-500 transition-colors">
                                      <FileText className="w-8 h-8 text-blue-500 mb-2" />
                                      <p className="text-xs font-medium mb-1">GST Certificate</p>
                                      <DocumentViewer
                                        url={documentUrls.gstCertificate || selectedVendor.gstCertificate}
                                        name="GST Certificate"
                                        type={getDocumentType(selectedVendor.gstCertificate)}
                                      >
                                        <Button variant="link" className="p-0 h-auto text-xs">
                                          View Document
                                        </Button>
                                      </DocumentViewer>
                                    </div>
                                  )}
                                  {/* PAN Card */}
                                  {selectedVendor.panCard && (
                                    <div className="border rounded-lg p-3 hover:border-blue-500 transition-colors">
                                      <FileText className="w-8 h-8 text-blue-500 mb-2" />
                                      <p className="text-xs font-medium mb-1">PAN Card</p>
                                      <DocumentViewer
                                        url={documentUrls.panCard || selectedVendor.panCard}
                                        name="PAN Card"
                                        type={getDocumentType(selectedVendor.panCard)}
                                      >
                                        <Button variant="link" className="p-0 h-auto text-xs">
                                          View Document
                                        </Button>
                                      </DocumentViewer>
                                    </div>
                                  )}
                                  {/* Business Registration */}
                                  {selectedVendor.businessRegistration && (
                                    <div className="border rounded-lg p-3 hover:border-blue-500 transition-colors">
                                      <FileText className="w-8 h-8 text-blue-500 mb-2" />
                                      <p className="text-xs font-medium mb-1">Business Registration</p>
                                      <DocumentViewer
                                        url={documentUrls.businessRegistration || selectedVendor.businessRegistration}
                                        name="Business Registration"
                                        type={getDocumentType(selectedVendor.businessRegistration)}
                                      >
                                        <Button variant="link" className="p-0 h-auto text-xs">
                                          View Document
                                        </Button>
                                      </DocumentViewer>
                                    </div>
                                  )}
                                  {/* Bank Proof */}
                                  {selectedVendor.bankProof && (
                                    <div className="border rounded-lg p-3 hover:border-blue-500 transition-colors">
                                      <FileText className="w-8 h-8 text-blue-500 mb-2" />
                                      <p className="text-xs font-medium mb-1">Bank Account Proof</p>
                                      <DocumentViewer
                                        url={documentUrls.bankProof || selectedVendor.bankProof}
                                        name="Bank Account Proof"
                                        type={getDocumentType(selectedVendor.bankProof)}
                                      >
                                        <Button variant="link" className="p-0 h-auto text-xs">
                                          View Document
                                        </Button>
                                      </DocumentViewer>
                                    </div>
                                  )}
                                  {/* Business Logo */}
                                  {selectedVendor.logo && (
                                    <div className="border rounded-lg p-3 hover:border-blue-500 transition-colors">
                                      <DocumentViewer
                                        url={selectedVendor.logo}
                                        name="Business Logo"
                                        type="image"
                                      >
                                        <div className="cursor-pointer group">
                                          <img
                                            src={getThumbnailUrl(selectedVendor.logo, 200, 200)}
                                            alt="Logo"
                                            className="w-full h-20 object-contain mb-2 group-hover:scale-105 transition-transform"
                                          />
                                          <p className="text-xs font-medium">Business Logo</p>
                                          <p className="text-xs text-gray-500">Click to view full size</p>
                                        </div>
                                      </DocumentViewer>
                                    </div>
                                  )}
                                  {/* Store Banner */}
                                  {selectedVendor.banner && (
                                    <div className="border rounded-lg p-3 hover:border-blue-500 transition-colors">
                                      <DocumentViewer
                                        url={selectedVendor.banner}
                                        name="Store Banner"
                                        type="image"
                                      >
                                        <div className="cursor-pointer group">
                                          <img
                                            src={getThumbnailUrl(selectedVendor.banner, 200, 100)}
                                            alt="Banner"
                                            className="w-full h-20 object-cover mb-2 rounded group-hover:scale-105 transition-transform"
                                          />
                                          <p className="text-xs font-medium">Store Banner</p>
                                          <p className="text-xs text-gray-500">Click to view full size</p>
                                        </div>
                                      </DocumentViewer>
                                    </div>
                                  )}
                                </div>
                                {!selectedVendor.logo && !selectedVendor.banner && !selectedVendor.gstCertificate &&
                                 !selectedVendor.panCard && !selectedVendor.businessRegistration && !selectedVendor.bankProof && (
                                  <div className="text-center text-gray-500 italic py-8">
                                    No documents or media uploaded
                                  </div>
                                )}
                              </div>

                              {/* Terms & Compliance Summary */}
                              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium">Terms Accepted</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium">Privacy Policy Accepted</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Application ID</p>
                                  <p className="text-xs font-mono font-medium">{selectedVendor.id}</p>
                                </div>
                              </div>

                              {/* Trial Benefits Reminder */}
                              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-start gap-3">
                                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                  <div>
                                    <h5 className="font-semibold text-green-900 mb-1">
                                      20-Day Premium Trial Upon Approval
                                    </h5>
                                    <p className="text-sm text-green-700">
                                      This vendor will automatically receive a 20-day free premium trial with unlimited
                                      products, advanced analytics, and priority support when approved.
                                    </p>
                                  </div>
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
