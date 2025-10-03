'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  User,
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import AdminBreadcrumb from '../../components/AdminBreadcrumb';
import DocumentViewer from '@/components/admin/DocumentViewer';

interface VendorData {
  type: 'registration' | 'vendor';
  data: any;
  originalRequest?: any;
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentUrls, setDocumentUrls] = useState<{ [key: string]: string }>({});

  // Generate signed URL for private documents
  const getSignedUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch('/api/vendor/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, expiresIn: 3600 }),
      });

      if (!response.ok) throw new Error('Failed to generate signed URL');
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return url;
    }
  };

  // Detect document type
  const getDocumentType = (url: string): 'pdf' | 'image' => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.pdf')) return 'pdf';
    return 'image';
  };

  useEffect(() => {
    const fetchVendorDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/vendors/${vendorId}`);
        if (!response.ok) throw new Error('Failed to fetch vendor details');

        const data = await response.json();
        setVendorData(data);

        // Fetch signed URLs for documents if it's a registration
        if (data.type === 'registration' && data.data) {
          const urls: { [key: string]: string } = {};
          const reg = data.data;

          if (reg.gstCertificate) urls.gstCertificate = await getSignedUrl(reg.gstCertificate);
          if (reg.panCard) urls.panCard = await getSignedUrl(reg.panCard);
          if (reg.businessRegistration) urls.businessRegistration = await getSignedUrl(reg.businessRegistration);
          if (reg.bankProof) urls.bankProof = await getSignedUrl(reg.bankProof);

          setDocumentUrls(urls);
        }

        // Also fetch for originalRequest if vendor type
        if (data.type === 'vendor' && data.originalRequest) {
          const urls: { [key: string]: string } = {};
          const reg = data.originalRequest;

          if (reg.gstCertificate) urls.gstCertificate = await getSignedUrl(reg.gstCertificate);
          if (reg.panCard) urls.panCard = await getSignedUrl(reg.panCard);
          if (reg.businessRegistration) urls.businessRegistration = await getSignedUrl(reg.businessRegistration);
          if (reg.bankProof) urls.bankProof = await getSignedUrl(reg.bankProof);

          setDocumentUrls(urls);
        }
      } catch (error) {
        console.error('Error fetching vendor details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorDetails();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminBreadcrumb
          items={[
            { title: 'Vendors', href: '/admin/vendors' },
            { title: 'Loading...' },
          ]}
        />
        <Card>
          <CardContent className="p-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="space-y-6">
        <AdminBreadcrumb
          items={[
            { title: 'Vendors', href: '/admin/vendors' },
            { title: 'Not Found' },
          ]}
        />
        <Card>
          <CardContent className="p-12 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Vendor Not Found</h3>
            <p className="text-gray-600 mb-4">The vendor you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/admin/vendors')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Vendors
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRegistration = vendorData.type === 'registration';
  const data = vendorData.data;
  const originalRequest = vendorData.originalRequest;
  const displayData = isRegistration ? data : (originalRequest || data);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <AdminBreadcrumb
        items={[
          { title: 'Vendors', href: '/admin/vendors' },
          { title: displayData.companyName || displayData.vendorProfile?.storeName || 'Vendor Details' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {isRegistration && data.status === 'PENDING' && (
          <div className="flex gap-2">
            <Button variant="destructive" size="sm">
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" size="sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={displayData.logo || data.vendorProfile?.logoUrl} />
                    <AvatarFallback className="text-2xl">
                      {(displayData.companyName || data.vendorProfile?.storeName || 'V').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">
                      {displayData.companyName || data.vendorProfile?.storeName}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">{displayData.fullName || data.name}</p>
                    {displayData.tagline && (
                      <p className="text-sm text-gray-500 italic mt-1">{displayData.tagline}</p>
                    )}
                  </div>
                </div>
                <Badge
                  className={
                    data.status === 'PENDING' || data.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : data.status === 'APPROVED' || data.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }
                >
                  {(data.status || 'ACTIVE').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <InfoField icon={Building2} label="Business Type" value={displayData.businessType || 'Not specified'} />
                <InfoField icon={Package} label="Business Category" value={displayData.businessCategory || 'Not specified'} />
                <InfoField icon={Mail} label="Email" value={displayData.email || data.email} />
                <InfoField icon={Phone} label="Phone" value={displayData.phone || data.phone} />
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="City" value={displayData.city || data.vendorProfile?.city || 'N/A'} />
                  <InfoField label="State" value={displayData.state || data.vendorProfile?.state || 'N/A'} />
                  <InfoField label="Pin Code" value={displayData.pinCode || 'N/A'} />
                  {displayData.address && <InfoField label="Full Address" value={displayData.address} className="col-span-2" />}
                </div>
              </div>

              {(displayData.gstNumber || displayData.agentCode) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {displayData.gstNumber && (
                      <InfoField icon={FileText} label="GST Number" value={displayData.gstNumber} />
                    )}
                    {displayData.agentCode && (
                      <InfoField icon={User} label="Agent Code" value={displayData.agentCode} />
                    )}
                    {displayData.agentName && (
                      <InfoField icon={User} label="Agent Name" value={displayData.agentName} />
                    )}
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <InfoField
                  icon={Package}
                  label="Selected Package"
                  value={(displayData.selectedPackage || data.vendorSubscription?.planType || 'BASIC').toUpperCase()}
                />
                <InfoField
                  icon={Calendar}
                  label="Registration Date"
                  value={new Date(displayData.createdAt || data.createdAt).toLocaleDateString()}
                />
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          {(displayData.gstCertificate || displayData.panCard || displayData.businessRegistration || displayData.bankProof) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Uploaded Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {displayData.gstCertificate && (
                    <DocumentCard
                      title="GST Certificate"
                      url={documentUrls.gstCertificate || displayData.gstCertificate}
                      originalUrl={displayData.gstCertificate}
                    />
                  )}
                  {displayData.panCard && (
                    <DocumentCard
                      title="PAN Card"
                      url={documentUrls.panCard || displayData.panCard}
                      originalUrl={displayData.panCard}
                    />
                  )}
                  {displayData.businessRegistration && (
                    <DocumentCard
                      title="Business Registration"
                      url={documentUrls.businessRegistration || displayData.businessRegistration}
                      originalUrl={displayData.businessRegistration}
                    />
                  )}
                  {displayData.bankProof && (
                    <DocumentCard
                      title="Bank Proof"
                      url={documentUrls.bankProof || displayData.bankProof}
                      originalUrl={displayData.bankProof}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Branding Assets */}
          {(displayData.logo || displayData.banner) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Branding Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {displayData.logo && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">Business Logo</p>
                      <img
                        src={displayData.logo}
                        alt="Business Logo"
                        className="w-full h-40 object-contain bg-gray-50 rounded"
                      />
                    </div>
                  )}
                  {displayData.banner && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">Store Banner</p>
                      <img
                        src={displayData.banner}
                        alt="Store Banner"
                        className="w-full h-40 object-cover bg-gray-50 rounded"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Status Info */}
          <Card>
            <CardHeader>
              <CardTitle>Registration Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge>{(data.status || 'ACTIVE').toUpperCase()}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">GST Verified</span>
                {displayData.gstVerified || data.vendorProfile?.isVerified ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              {data.approvedAt && (
                <div>
                  <span className="text-sm text-gray-600">Approved On</span>
                  <p className="text-sm font-medium">{new Date(data.approvedAt).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Data (for debugging) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">All Fields (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(displayData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoField({
  icon: Icon,
  label,
  value,
  className = '',
}: {
  icon?: any;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </div>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}

function DocumentCard({ title, url, originalUrl }: { title: string; url: string; originalUrl: string }) {
  const getDocumentType = (url: string): 'pdf' | 'image' => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.pdf')) return 'pdf';
    return 'image';
  };

  return (
    <div className="border rounded-lg p-3 hover:border-blue-500 transition-colors">
      <FileText className="w-8 h-8 text-blue-500 mb-2" />
      <p className="text-xs font-medium mb-1">{title}</p>
      <DocumentViewer url={url} name={title} type={getDocumentType(originalUrl)}>
        <Button variant="link" className="p-0 h-auto text-xs">
          View Document
        </Button>
      </DocumentViewer>
    </div>
  );
}
