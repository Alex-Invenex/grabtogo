'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Megaphone, Eye, Clock, TrendingUp, DollarSign, Loader2, Pause, Play, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow, format } from 'date-fns';

interface AdCampaign {
  id: string;
  title: string;
  description: string;
  adType: 'HOMEPAGE_BANNER' | 'SEARCH_AD' | 'POPUP';
  targetUrl: string;
  imageUrl?: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  impressions: number;
  clicks: number;
  createdAt: string;
}

export default function VendorAdsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/vendor/ads');
      if (!response.ok) throw new Error('Failed to fetch campaigns');

      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    try {
      const response = await fetch(`/api/vendor/ads/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update campaign');

      toast({
        title: 'Success',
        description: `Campaign ${newStatus === 'ACTIVE' ? 'activated' : 'paused'} successfully`,
      });

      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to update campaign',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/vendor/ads/${campaignToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete campaign');

      toast({
        title: 'Success',
        description: 'Campaign deleted successfully',
      });

      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const getCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  };

  const getBudgetProgress = (spent: number, budget: number) => {
    return (spent / budget) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'PAUSED':
        return 'bg-yellow-500';
      case 'COMPLETED':
        return 'bg-blue-500';
      case 'PENDING_PAYMENT':
        return 'bg-orange-500';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAdTypeLabel = (type: string) => {
    switch (type) {
      case 'HOMEPAGE_BANNER':
        return 'Homepage Banner';
      case 'SEARCH_AD':
        return 'Search Ad';
      case 'POPUP':
        return 'Popup Ad';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE');
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ad Campaigns</h1>
          <p className="text-gray-600 mt-1">Promote your business with targeted advertising</p>
        </div>
        <Link href="/vendor/ads/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
              <Megaphone className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCampaigns.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-primary">₹{totalSpent.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Impressions</p>
                <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first ad campaign to reach more customers
              </p>
              <Link href="/vendor/ads/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => {
            const budgetProgress = getBudgetProgress(campaign.spent, campaign.budget);
            const ctr = getCTR(campaign.clicks, campaign.impressions);

            return (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">{getAdTypeLabel(campaign.adType)}</Badge>
                      </div>
                      <CardTitle className="text-lg line-clamp-1">{campaign.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {campaign.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Ad Preview */}
                  {campaign.imageUrl && (
                    <img
                      src={campaign.imageUrl}
                      alt={campaign.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 py-3 border-y">
                    <div>
                      <p className="text-xs text-gray-600">Impressions</p>
                      <p className="text-lg font-bold">{campaign.impressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Clicks</p>
                      <p className="text-lg font-bold">{campaign.clicks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">CTR</p>
                      <p className="text-lg font-bold">{ctr}%</p>
                    </div>
                  </div>

                  {/* Budget Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Budget Spent</span>
                      <span className="font-medium">
                        ₹{campaign.spent.toFixed(2)} / ₹{campaign.budget.toFixed(2)}
                      </span>
                    </div>
                    <Progress value={budgetProgress} className="h-2" />
                  </div>

                  {/* Time Remaining */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {new Date(campaign.endDate) > new Date()
                      ? `Ends ${formatDistanceToNow(new Date(campaign.endDate), { addSuffix: true })}`
                      : `Ended ${formatDistanceToNow(new Date(campaign.endDate), { addSuffix: true })}`}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {campaign.status === 'PENDING_PAYMENT' ? (
                      <Link href={`/vendor/ads/${campaign.id}/payment`} className="flex-1">
                        <Button className="w-full" size="sm">
                          Complete Payment
                        </Button>
                      </Link>
                    ) : (
                      <>
                        {(campaign.status === 'ACTIVE' || campaign.status === 'PAUSED') && (
                          <Button
                            variant="outline"
                            className="flex-1"
                            size="sm"
                            onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                          >
                            {campaign.status === 'ACTIVE' ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setCampaignToDelete(campaign.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your campaign.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCampaign}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
