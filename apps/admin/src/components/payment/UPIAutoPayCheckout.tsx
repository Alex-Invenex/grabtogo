'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import {
  CreditCard,
  Smartphone,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Repeat,
  Zap,
  Info,
} from 'lucide-react';

interface UPIAutoPayCheckoutProps {
  subscription: {
    id: string;
    planType: string;
    amount: number;
    razorpaySubscriptionId: string;
  };
  onSuccess: (subscriptionId: string) => void;
  onError: (error: any) => void;
  loading?: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const UPIAutoPayCheckout: React.FC<UPIAutoPayCheckoutProps> = ({
  subscription,
  onSuccess,
  onError,
  loading = false,
}) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      if (window.Razorpay) {
        setScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        toast.error('Failed to load payment gateway');
      };
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    };

    loadRazorpayScript();
  }, []);

  const handleUPIAutoPaySetup = () => {
    if (!scriptLoaded || !window.Razorpay) {
      toast.error('Payment gateway not loaded. Please try again.');
      return;
    }

    setProcessing(true);
    setStep(2);

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      subscription_id: subscription.razorpaySubscriptionId,
      name: 'GrabtoGo',
      description: `${subscription.planType} Plan - Monthly Subscription`,
      theme: {
        color: '#f97316',
      },
      recurring: 1,
      callback_url: `${process.env.NEXT_PUBLIC_API_URL}/webhooks/razorpay`,
      notes: {
        subscription_type: 'upi_autopay',
        plan_type: subscription.planType,
      },
      prefill: {
        method: 'upi',
      },
      config: {
        display: {
          blocks: {
            utib: {
              name: 'Pay using UPI',
              instruments: [
                {
                  method: 'upi',
                },
              ],
            },
          },
          sequence: ['block.utib'],
          preferences: {
            show_default_blocks: false,
          },
        },
      },
      handler: (response: any) => {
        setProcessing(false);
        setStep(3);
        toast.success('UPI AutoPay mandate created successfully!');
        onSuccess(subscription.id);
      },
      modal: {
        ondismiss: () => {
          setProcessing(false);
          setStep(1);
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setProcessing(false);
        setStep(1);
        onError(response.error);
        toast.error('UPI AutoPay setup failed: ' + response.error.description);
      });
      rzp.open();
    } catch (error) {
      setProcessing(false);
      setStep(1);
      console.error('Razorpay error:', error);
      onError(error);
      toast.error('Failed to open UPI AutoPay setup');
    }
  };

  const calculateGST = (amount: number) => {
    const gst = Math.round(amount * 0.18 * 100) / 100;
    return {
      base: amount,
      gst,
      total: Math.round((amount + gst) * 100) / 100,
    };
  };

  const pricing = calculateGST(subscription.amount);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Smartphone className="w-6 h-6 text-orange-500" />
            <CardTitle className="text-2xl">UPI AutoPay Setup</CardTitle>
          </div>
          <CardDescription>
            Set up automatic monthly payments for your {subscription.planType} plan
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-500" />
            Why UPI AutoPay?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>No manual payment required - automatic renewal</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>Secure & encrypted transactions</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>Cancel anytime from your dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>Works with all major UPI apps (GPay, PhonePe, Paytm)</span>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Monthly Billing Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{subscription.planType} Plan (Monthly)</span>
              <span>₹{pricing.base}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>GST (18%)</span>
              <span>₹{pricing.gst}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total per month</span>
              <span>₹{pricing.total}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <strong>First charge:</strong> Tomorrow at the same time<br />
                <strong>Recurring:</strong> Every month automatically
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Process</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: 'Click Setup UPI AutoPay',
                description: 'Initialize the UPI AutoPay mandate',
                icon: step >= 1 ? CheckCircle : Clock,
                color: step >= 1 ? 'text-green-500' : 'text-gray-400',
              },
              {
                step: 2,
                title: 'Approve on your UPI app',
                description: 'Confirm the auto-debit mandate',
                icon: step >= 2 ? CheckCircle : step === 2 ? Clock : Clock,
                color: step >= 2 ? 'text-green-500' : step === 2 ? 'text-blue-500' : 'text-gray-400',
              },
              {
                step: 3,
                title: 'Subscription activated',
                description: 'Your plan will auto-renew monthly',
                icon: step >= 3 ? CheckCircle : Clock,
                color: step >= 3 ? 'text-green-500' : 'text-gray-400',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <strong className="text-orange-800">100% Secure:</strong>
              <span className="text-orange-700 ml-1">
                Your payment information is encrypted and processed securely by Razorpay.
                We never store your UPI PIN or banking details.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="text-center">
        {step === 1 && (
          <Button
            onClick={handleUPIAutoPaySetup}
            disabled={!scriptLoaded || loading || processing}
            size="lg"
            className="w-full max-w-md"
          >
            {processing ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Opening UPI Setup...
              </>
            ) : !scriptLoaded ? (
              'Loading Payment Gateway...'
            ) : (
              <>
                <Repeat className="w-4 h-4 mr-2" />
                Setup UPI AutoPay
              </>
            )}
          </Button>
        )}

        {step === 2 && (
          <div className="text-center p-6">
            <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">Waiting for UPI Approval</h3>
            <p className="text-muted-foreground">
              Please approve the UPI AutoPay mandate on your UPI app
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="text-center p-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              UPI AutoPay Activated!
            </h3>
            <p className="text-muted-foreground">
              Your subscription will automatically renew every month
            </p>
            <Badge variant="success" className="mt-2">
              Setup Complete
            </Badge>
          </div>
        )}
      </div>

      {/* Help */}
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Need help? Contact our support team at</p>
            <p className="font-medium">support@grabtogo.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UPIAutoPayCheckout;