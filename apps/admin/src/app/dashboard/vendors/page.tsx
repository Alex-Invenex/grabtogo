'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Store,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Star,
  FileText,
  Download,
  MoreHorizontal
} from "lucide-react"

export default function VendorManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedVendor, setSelectedVendor] = useState<any>(null)

  // Mock vendor data
  const vendorsData = [
    {
      id: 1,
      name: 'Fresh Market Plus',
      email: 'contact@freshmarket.com',
      phone: '+91 98765 43210',
      status: 'active',
      businessType: 'Grocery Store',
      location: 'Mumbai, Maharashtra',
      joinDate: '2024-01-15',
      revenue: 45678,
      rating: 4.9,
      totalOrders: 234,
      subscription: 'premium',
      documents: ['business_license', 'tax_certificate', 'bank_details'],
      verificationStatus: 'verified',
      lastLogin: '2024-01-20T10:30:00Z'
    },
    {
      id: 2,
      name: 'Tech Solutions Hub',
      email: 'info@techsolutions.com',
      phone: '+91 87654 32109',
      status: 'pending',
      businessType: 'Electronics',
      location: 'Bangalore, Karnataka',
      joinDate: '2024-01-18',
      revenue: 0,
      rating: 0,
      totalOrders: 0,
      subscription: 'basic',
      documents: ['business_license', 'tax_certificate'],
      verificationStatus: 'pending',
      lastLogin: '2024-01-20T08:15:00Z'
    },
    {
      id: 3,
      name: 'Style & Fashion',
      email: 'hello@stylefashion.com',
      phone: '+91 76543 21098',
      status: 'suspended',
      businessType: 'Clothing',
      location: 'Delhi, Delhi',
      joinDate: '2023-12-10',
      revenue: 32156,
      rating: 4.2,
      totalOrders: 167,
      subscription: 'standard',
      documents: ['business_license', 'tax_certificate', 'bank_details'],
      verificationStatus: 'verified',
      lastLogin: '2024-01-19T16:45:00Z',
      suspensionReason: 'Policy violation - fake reviews'
    },
    {
      id: 4,
      name: 'Home Essentials',
      email: 'support@homeessentials.com',
      phone: '+91 65432 10987',
      status: 'active',
      businessType: 'Home & Garden',
      location: 'Chennai, Tamil Nadu',
      joinDate: '2023-11-05',
      revenue: 28934,
      rating: 4.6,
      totalOrders: 145,
      subscription: 'standard',
      documents: ['business_license', 'tax_certificate', 'bank_details'],
      verificationStatus: 'verified',
      lastLogin: '2024-01-20T11:20:00Z'
    },
    {
      id: 5,
      name: 'Digital Services Pro',
      email: 'contact@digitalservices.com',
      phone: '+91 54321 09876',
      status: 'inactive',
      businessType: 'Digital Services',
      location: 'Pune, Maharashtra',
      joinDate: '2023-10-20',
      revenue: 25678,
      rating: 4.5,
      totalOrders: 134,
      subscription: 'premium',
      documents: ['business_license', 'tax_certificate', 'bank_details'],
      verificationStatus: 'verified',
      lastLogin: '2024-01-15T14:30:00Z'
    }
  ]

  const filteredVendors = vendorsData.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.businessType.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = selectedStatus === 'all' || vendor.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
      case 'suspended':
        return <Badge className="bg-red-500 hover:bg-red-600">Suspended</Badge>
      case 'inactive':
        return <Badge className="bg-gray-500 hover:bg-gray-600">Inactive</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getSubscriptionBadge = (subscription: string) => {
    switch (subscription) {
      case 'premium':
        return <Badge className="bg-purple-500 hover:bg-purple-600">Premium</Badge>
      case 'standard':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Standard</Badge>
      case 'basic':
        return <Badge className="bg-gray-500 hover:bg-gray-600">Basic</Badge>
      default:
        return <Badge variant="secondary">{subscription}</Badge>
    }
  }

  const handleApproveVendor = (vendorId: number) => {
    console.log('Approving vendor:', vendorId)
    // Here you would implement the approval logic
  }

  const handleRejectVendor = (vendorId: number) => {
    console.log('Rejecting vendor:', vendorId)
    // Here you would implement the rejection logic
  }

  const handleSuspendVendor = (vendorId: number) => {
    console.log('Suspending vendor:', vendorId)
    // Here you would implement the suspension logic
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendor Management</h1>
          <p className="text-gray-400">Manage vendor registrations, approvals, and oversight</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-400 border-green-400">
            {vendorsData.filter(v => v.status === 'active').length} Active
          </Badge>
          <Badge variant="outline" className="text-yellow-400 border-yellow-400">
            {vendorsData.filter(v => v.status === 'pending').length} Pending
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vendors by name, email, or business type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="list">Vendor List</TabsTrigger>
          <TabsTrigger value="pending">Pending Approvals ({vendorsData.filter(v => v.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gray-700 rounded-lg">
                      <Store className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{vendor.name}</h3>
                        {getStatusBadge(vendor.status)}
                        {getSubscriptionBadge(vendor.subscription)}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{vendor.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>{vendor.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{vendor.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Store className="h-4 w-4" />
                          <span>{vendor.businessType}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {new Date(vendor.joinDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4" />
                          <span>{vendor.rating > 0 ? `${vendor.rating} rating` : 'No ratings yet'}</span>
                        </div>
                      </div>
                      {vendor.status === 'suspended' && vendor.suspensionReason && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                          <strong>Suspension Reason:</strong> {vendor.suspensionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="text-right space-y-1">
                      <p className="text-sm text-gray-400">Revenue</p>
                      <p className="text-lg font-semibold text-green-400">₹{vendor.revenue.toLocaleString()}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm text-gray-400">Orders</p>
                      <p className="text-lg font-semibold text-blue-400">{vendor.totalOrders}</p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVendor(vendor)}
                            className="border-gray-600 text-white hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-white">Vendor Details</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Complete vendor information and verification status
                            </DialogDescription>
                          </DialogHeader>
                          {selectedVendor && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-gray-400">Business Name</Label>
                                  <p className="text-white font-medium">{selectedVendor.name}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-400">Business Type</Label>
                                  <p className="text-white">{selectedVendor.businessType}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-400">Email</Label>
                                  <p className="text-white">{selectedVendor.email}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-400">Phone</Label>
                                  <p className="text-white">{selectedVendor.phone}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-400">Location</Label>
                                  <p className="text-white">{selectedVendor.location}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-400">Join Date</Label>
                                  <p className="text-white">{new Date(selectedVendor.joinDate).toLocaleDateString()}</p>
                                </div>
                              </div>

                              <div>
                                <Label className="text-gray-400 mb-2 block">Documents Submitted</Label>
                                <div className="space-y-2">
                                  {selectedVendor.documents.map((doc: string, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                                      <div className="flex items-center space-x-2">
                                        <FileText className="h-4 w-4 text-blue-400" />
                                        <span className="text-white capitalize">{doc.replace('_', ' ')}</span>
                                      </div>
                                      <Button variant="ghost" size="sm">
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {selectedVendor.status === 'pending' && (
                                <div className="flex space-x-3">
                                  <Button
                                    onClick={() => handleApproveVendor(selectedVendor.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve Vendor
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleRejectVendor(selectedVendor.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              )}

                              {selectedVendor.status === 'active' && (
                                <Button
                                  variant="destructive"
                                  onClick={() => handleSuspendVendor(selectedVendor.id)}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Suspend Vendor
                                </Button>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {vendor.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveVendor(vendor.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectVendor(vendor.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {vendorsData.filter(v => v.status === 'pending').map((vendor) => (
            <Card key={vendor.id} className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{vendor.name}</h3>
                      <p className="text-gray-400">{vendor.businessType} • {vendor.location}</p>
                      <p className="text-sm text-gray-500">Applied on {new Date(vendor.joinDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => handleApproveVendor(vendor.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectVendor(vendor.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Vendor Analytics</CardTitle>
              <CardDescription className="text-gray-400">
                Comprehensive analytics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}