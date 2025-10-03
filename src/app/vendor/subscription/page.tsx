'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Check,
  X,
  Calendar,
  AlertCircle,
  Loader2,
  Crown,
  Zap,
  Star,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Subscription {
  id: string;
  tier: 'BASIC' | 'PROFESSIONAL' | 'PREMIUM';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'GRACE_PERIOD';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  cancelledAt?: string;
}

const PLANS = [
  {
    tier: 'BASIC',
    name: 'Basic',
    price: 99,
    icon: Star,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    features: [
      'Up to 10 products',
      'Basic analytics',
      '1 story per day',
      'Email support',
      'Mobile app listing',
    ],
    limitations: [
      'No ad campaigns',
      'No featured placement',
      'Basic visibility',
    ],
  },
  {
    tier: 'PROFESSIONAL',
    name: 'Professional',
    price: 199,
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/5',
    borderColor: 'border-primary',
    popular: true,
    features: [
      'Up to 50 products',
      'Advanced analytics',
      '5 stories per day',
      'Priority email support',
      'Featured in category',
      '1 ad campaign',
      'Product recommendations',
    ],
    limitations: [
      'Limited ad budget',
    ],
  },
  {
    tier: 'PREMIUM',
    name: 'Premium',
    price: 299,
    icon: Crown,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    features: [
      'Unlimited products',
      'Premium analytics & insights',
      'Unlimited stories',
      '24/7 priority support',
      'Homepage featured placement',
      'Unlimited ad campaigns',
      'Custom branding',
      'Dedicated account manager',
      'API access',
    ],
    limitations: [],
  },
];

export default function VendorSubscriptionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/vendor/subscription');
      if (!response.ok) throw new Error('Failed to fetch subscription');

      const data = await response.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);
      const response = await fetch('/api/vendor/subscription/cancel', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to cancel subscription');

      toast({
        title: 'Success',
        description: 'Subscription cancelled. You have 30 days grace period.',
      });

      setCancelDialogOpen(false);
      fetchSubscription();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleUpgrade = async (tier: string, price: number) => {
    if (!scriptLoaded || !window.Razorpay) {
      toast({
        title: 'Payment system not ready',
        description: 'Please wait a moment and try again',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUpgrading(true);

      // Create order
      const response = await fetch('/api/vendor/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) throw new Error('Failed to create order');

      const data = await response.json();

      // Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: price * 100,
        currency: 'INR',
        name: 'GrabtoGo',
        description: `${tier} Subscription`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            const verifyResponse = await fetch('/api/vendor/subscription/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                tier,
              }),
            });

            if (!verifyResponse.ok) throw new Error('Payment verification failed');

            toast({
              title: 'Success',
              description: 'Subscription upgraded successfully',
            });

            fetchSubscription();
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: 'Payment verification failed',
              description: 'Please contact support',
              variant: 'destructive',
            });
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#10B981',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to upgrade subscription',
        variant: 'destructive',
      });
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading subscription...</p>
        </div>
      </div>
    );
  }

  const currentPlan = PLANS.find((p) => p.tier === subscription?.tier);
  const daysRemaining = subscription
    ? differenceInDays(new Date(subscription.endDate), new Date())
    : 0;
  const isGracePeriod = subscription?.status === 'GRACE_PERIOD';
  const isCancelled = subscription?.status === 'CANCELLED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600 mt-1">Manage your subscription plan and billing</p>
      </div>

      {/* Current Subscription */}
      {subscription && currentPlan && (
        <Card className={`border-2 ${currentPlan.borderColor}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentPlan.bgColor}`}>
                  <currentPlan.icon className={`w-6 h-6 ${currentPlan.color}`} />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {currentPlan.name} Plan
                    <Badge variant={isGracePeriod || isCancelled ? 'destructive' : 'default'}>
                      {subscription.status.replace('_', ' ')}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {isGracePeriod
                      ? `Grace period: ${daysRemaining} days remaining`
                      : isCancelled
                      ? 'Subscription cancelled'
                      : `Active until ${format(new Date(subscription.endDate), 'MMM dd, yyyy')}`}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">₹{currentPlan.price}</p>
                <p className="text-sm text-gray-600">per month</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(isGracePeriod || isCancelled) && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900">
                    {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired'}
                  </h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    {daysRemaining > 0
                      ? 'Renew your subscription to continue accessing premium features.'
                      : 'Your subscription has expired. Renew now to regain access.'}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Started</span>
                </div>
                <p className="font-medium">{format(new Date(subscription.startDate), 'MMM dd, yyyy')}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Renews on</span>
                </div>
                <p className="font-medium">{format(new Date(subscription.endDate), 'MMM dd, yyyy')}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Auto-renew</span>
                </div>
                <p className="font-medium">{subscription.autoRenew ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>

            {!isCancelled && !isGracePeriod && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCancelDialogOpen(true)}>
                  Cancel Subscription
                </Button>
              </div>
            )}

            {(isCancelled || isGracePeriod) && (
              <Button onClick={() => handleUpgrade(currentPlan.tier, currentPlan.price)} disabled={upgrading}>
                {upgrading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Renew Subscription'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {subscription ? 'Upgrade Your Plan' : 'Choose a Plan'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = plan.tier === subscription?.tier;
            const isUpgrade = subscription && plan.price > (currentPlan?.price || 0);
            const Icon = plan.icon;

            return (
              <Card
                key={plan.tier}
                className={`relative ${plan.popular ? `border-2 ${plan.borderColor}` : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className={`p-2 rounded-lg ${plan.bgColor} w-fit`}>
                    <Icon className={`w-6 h-6 ${plan.color}`} />
                  </div>
                  <CardTitle className="flex items-center gap-2 mt-4">
                    {plan.name}
                    {isCurrent && <Badge variant="secondary">Current</Badge>}
                  </CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">₹{plan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <X className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  {!isCurrent && (
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleUpgrade(plan.tier, plan.price)}
                      disabled={upgrading}
                    >
                      {upgrading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isUpgrade ? (
                        'Upgrade'
                      ) : (
                        'Choose Plan'
                      )}
                    </Button>
                  )}

                  {isCurrent && !isCancelled && !isGracePeriod && (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will remain active until the end of the current billing period. After
              that, you'll have a 30-day grace period before your data is deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
