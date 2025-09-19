'use client'

import { useState } from 'react'
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
  Flag,
  MessageSquare,
  Image,
  Star,
  Ban,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Share
} from "lucide-react"

export default function ContentModeration() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Mock data for content moderation
  const contentReports = [
    {
      id: 1,
      type: 'offer',
      title: 'Flash Sale - 90% Off Electronics',
      vendor: 'Tech Solutions Hub',
      reportedBy: 'user123@gmail.com',
      reason: 'Misleading pricing',
      status: 'pending',
      reportDate: '2024-01-20T10:30:00Z',
      description: 'This offer claims 90% off but the original price appears inflated',
      severity: 'medium',
      content: {
        offerText: 'MEGA FLASH SALE! Get 90% off on all electronics. Limited time offer!',
        originalPrice: '₹50,000',
        salePrice: '₹5,000',
        image: '/placeholder-offer.jpg'
      }
    },
    {
      id: 2,
      type: 'review',
      title: 'Fake Review on Fresh Market Plus',
      vendor: 'Fresh Market Plus',
      reportedBy: 'concerned_customer@gmail.com',
      reason: 'Fake review',
      status: 'pending',
      reportDate: '2024-01-20T09:15:00Z',
      description: 'Multiple reviews with similar language patterns, likely fake',
      severity: 'high',
      content: {
        reviewText: 'Amazing store! Best quality products ever! 10/10 would recommend to everyone! Super fast delivery and excellent customer service!!!',
        reviewer: 'fake_user_123',
        rating: 5,
        reviewDate: '2024-01-19'
      }
    },
    {
      id: 3,
      type: 'product',
      title: 'Inappropriate Product Listing',
      vendor: 'Random Vendor',
      reportedBy: 'moderator@grabtogo.com',
      reason: 'Inappropriate content',
      status: 'resolved',
      reportDate: '2024-01-19T16:45:00Z',
      description: 'Product contains inappropriate imagery',
      severity: 'high',
      content: {
        productName: 'Adult Content Product',
        category: 'Restricted',
        action: 'Product removed and vendor warned'
      }
    },
    {
      id: 4,
      type: 'vendor_profile',
      title: 'Vendor Profile Misinformation',
      vendor: 'Questionable Store',
      reportedBy: 'user456@gmail.com',
      reason: 'False business information',
      status: 'under_review',
      reportDate: '2024-01-19T14:20:00Z',
      description: 'Vendor claims to be certified but no valid certificates found',
      severity: 'medium',
      content: {
        claim: 'ISO 9001 Certified Business',
        evidence: 'No valid certificates on file',
        businessLicense: 'Expired'
      }
    },
    {
      id: 5,
      type: 'user_behavior',
      title: 'Harassment Complaint',
      vendor: 'N/A',
      reportedBy: 'victim_user@gmail.com',
      reason: 'User harassment',
      status: 'pending',
      reportDate: '2024-01-20T11:00:00Z',
      description: 'User receiving threatening messages from another user',
      severity: 'high',
      content: {
        reportedUser: 'aggressive_user_789',
        messageType: 'Threatening messages',
        platform: 'In-app messaging'
      }
    }
  ]

  const moderationStats = {
    totalReports: 156,
    pendingReports: 23,
    resolvedToday: 12,
    avgResolutionTime: '2.4 hours',
    flaggedOffers: 8,
    suspendedUsers: 3,
    removedContent: 45
  }

  const filteredReports = contentReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reason.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || report.type === selectedCategory
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
      case 'under_review':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Under Review</Badge>
      case 'resolved':
        return <Badge className="bg-green-500 hover:bg-green-600">Resolved</Badge>
      case 'rejected':
        return <Badge className="bg-gray-500 hover:bg-gray-600">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>
      case 'medium':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Medium</Badge>
      case 'low':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Low</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'offer':
        return <Star className="h-4 w-4" />
      case 'review':
        return <MessageSquare className="h-4 w-4" />
      case 'product':
        return <Image className="h-4 w-4" />
      case 'vendor_profile':
        return <Flag className="h-4 w-4" />
      case 'user_behavior':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Flag className="h-4 w-4" />
    }
  }

  const handleApproveReport = (reportId: number) => {
    console.log('Approving report:', reportId)
    // Implementation for approving report
  }

  const handleRejectReport = (reportId: number) => {
    console.log('Rejecting report:', reportId)
    // Implementation for rejecting report
  }

  const handleTakeAction = (reportId: number, action: string) => {
    console.log('Taking action:', action, 'on report:', reportId)
    // Implementation for taking specific actions
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
          <p className="text-gray-400">Review and moderate platform content and user reports</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-yellow-400 border-yellow-400">
            {moderationStats.pendingReports} Pending
          </Badge>
          <Badge variant="outline" className="text-green-400 border-green-400">
            {moderationStats.resolvedToday} Resolved Today
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Reports</CardTitle>
            <Flag className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{moderationStats.totalReports}</div>
            <p className="text-xs text-gray-400">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{moderationStats.pendingReports}</div>
            <p className="text-xs text-gray-400">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Resolution Time</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{moderationStats.avgResolutionTime}</div>
            <p className="text-xs text-gray-400">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Actions Taken</CardTitle>
            <Ban className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{moderationStats.removedContent}</div>
            <p className="text-xs text-gray-400">Content removed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reports by title, vendor, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="offer">Offers</SelectItem>
                <SelectItem value="review">Reviews</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="vendor_profile">Vendor Profiles</SelectItem>
                <SelectItem value="user_behavior">User Behavior</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="reports">All Reports</TabsTrigger>
          <TabsTrigger value="high_priority">High Priority ({contentReports.filter(r => r.severity === 'high').length})</TabsTrigger>
          <TabsTrigger value="automated">Auto-Flagged</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gray-700 rounded-lg">
                      {getTypeIcon(report.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                        {getStatusBadge(report.status)}
                        {getSeverityBadge(report.severity)}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-400 mb-3">
                        <div className="flex items-center space-x-1">
                          <Flag className="h-4 w-4" />
                          <span>{report.vendor}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{report.reason}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(report.reportDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{report.description}</p>
                      <p className="text-xs text-gray-500">Reported by: {report.reportedBy}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-white hover:bg-gray-700"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700 max-w-3xl">
                        <DialogHeader>
                          <DialogTitle className="text-white">Content Review</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            Review reported content and take appropriate action
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-gray-400">Report Type</Label>
                              <p className="text-white capitalize">{report.type.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <Label className="text-gray-400">Severity</Label>
                              <div className="mt-1">{getSeverityBadge(report.severity)}</div>
                            </div>
                            <div>
                              <Label className="text-gray-400">Reported By</Label>
                              <p className="text-white">{report.reportedBy}</p>
                            </div>
                            <div>
                              <Label className="text-gray-400">Report Date</Label>
                              <p className="text-white">{new Date(report.reportDate).toLocaleString()}</p>
                            </div>
                          </div>

                          <div>
                            <Label className="text-gray-400 mb-2 block">Content Details</Label>
                            <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                              {Object.entries(report.content).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                  <span className="text-white">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label className="text-gray-400 mb-2 block">Moderator Notes</Label>
                            <Textarea
                              placeholder="Add notes about your review decision..."
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>

                          <div className="flex space-x-3">
                            <Button
                              onClick={() => handleApproveReport(report.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Report
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleRejectReport(report.id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject Report
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleTakeAction(report.id, 'warn')}
                              className="border-gray-600 text-white hover:bg-gray-700"
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Warn Vendor
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {report.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveReport(report.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectReport(report.id)}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="high_priority" className="space-y-4">
          {filteredReports.filter(r => r.severity === 'high').map((report) => (
            <Card key={report.id} className="bg-red-500/10 border-red-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                    <p className="text-red-400">High Priority - Requires immediate attention</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">{report.description}</p>
                <div className="flex space-x-3">
                  <Button className="bg-red-600 hover:bg-red-700">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Take Immediate Action
                  </Button>
                  <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                    <Eye className="h-4 w-4 mr-2" />
                    Review Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="automated">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Auto-Flagged Content</CardTitle>
              <CardDescription className="text-gray-400">
                Content automatically flagged by AI moderation systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Auto-flagged content system coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}