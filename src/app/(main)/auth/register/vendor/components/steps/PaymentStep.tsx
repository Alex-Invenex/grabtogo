'use client';

import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { CreditCard, Loader2, CheckCircle, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PACKAGES, REGISTRATION_FEE, GST_RATE } from '../../lib/constants';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentStep() {
  const { watch } = useFormContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    'pending' | 'processing' | 'success' | 'failed'
  >('pending');
  const [paymentError, setPaymentError] = useState('');

  const formData = watch();

  const calculateTotals = () => {
    const registrationFee = REGISTRATION_FEE;
    const gst = registrationFee * GST_RATE;
    const packagePrice = formData.selectedPackage
      ? formData.billingCycle === 'yearly'
        ? PACKAGES[formData.selectedPackage as keyof typeof PACKAGES].yearly
        : PACKAGES[formData.selectedPackage as keyof typeof PACKAGES].monthly
      : 0;

    const total = registrationFee + gst + packagePrice;

    return { registrationFee, gst, packagePrice, total };
  };

  const { registrationFee, gst, packagePrice, total } = calculateTotals();

  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');
    setPaymentError('');

    try {
      // Create order on backend
      const orderResponse = await fetch('/api/vendor-registration/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          vendorData: formData,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'GrabtoGo',
        description: 'Vendor Registration Fee',
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/api/vendor-registration/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                vendorData: formData,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              setPaymentStatus('success');
              // Trigger confetti animation
              if (typeof window !== 'undefined' && window.confetti) {
                window.confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                });
              }
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            setPaymentStatus('failed');
            setPaymentError(error instanceof Error ? error.message : 'Payment verification failed');
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          vendor_registration: 'true',
          package: formData.selectedPackage,
          billing_cycle: formData.billingCycle,
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentStatus('pending');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      setPaymentStatus('failed');
      setPaymentError(error instanceof Error ? error.message : 'Payment failed');
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-green-900">Payment Successful!</h2>
          <p className="text-gray-600 mt-2">
            Your vendor registration has been completed successfully.
          </p>
        </div>
        <div className="p-6 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-3">What's Next?</h3>
          <div className="space-y-2 text-sm text-green-800">
            <p>• You will receive a confirmation email within 5 minutes</p>
            <p>• Our team will review your application within 24-48 hours</p>
            <p>• You will be notified via email once your account is approved</p>
            <p>• Admin team has been notified at info@grabtogo.in</p>
          </div>
        </div>
        <Button onClick={() => (window.location.href = '/vendor/dashboard')} className="w-full">
          Go to Vendor Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Payment</h2>
        <p className="text-gray-600 mt-1">Complete your vendor registration payment</p>
      </div>

      {/* Payment Summary */}
      <div className="p-6 bg-gray-50 rounded-lg space-y-4">
        <h3 className="font-semibold text-lg">Payment Summary</h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Registration Fee</span>
            <span>₹{registrationFee}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (18%)</span>
            <span>₹{gst}</span>
          </div>
          {packagePrice > 0 && (
            <div className="flex justify-between">
              <span>
                {PACKAGES[formData.selectedPackage as keyof typeof PACKAGES]?.name} Package (
                {formData.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})
              </span>
              <span>₹{packagePrice}</span>
            </div>
          )}
          <div className="border-t pt-3 flex justify-between font-bold text-xl">
            <span>Total Amount</span>
            <span className="text-blue-600">₹{total}</span>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Your payment is secured by Razorpay with 256-bit SSL encryption. We do not store your card
          details.
        </AlertDescription>
      </Alert>

      {/* Payment Error */}
      {paymentStatus === 'failed' && paymentError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{paymentError}</AlertDescription>
        </Alert>
      )}

      {/* Vendor Information */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Vendor Information</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>
            <strong>Name:</strong> {formData.fullName}
          </p>
          <p>
            <strong>Business:</strong> {formData.companyName}
          </p>
          <p>
            <strong>Email:</strong> {formData.email}
          </p>
          <p>
            <strong>Phone:</strong> {formData.phone}
          </p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        <h3 className="font-semibold">Accepted Payment Methods</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Visa', 'Mastercard', 'UPI', 'Net Banking'].map((method) => (
            <div key={method} className="p-3 border rounded-lg text-center text-sm font-medium">
              {method}
            </div>
          ))}
        </div>
      </div>

      {/* Pay Button */}
      <Button
        onClick={handlePayment}
        disabled={isProcessing || paymentStatus === 'processing'}
        className="w-full h-12 text-lg"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Pay ₹{total} Securely
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        By clicking "Pay Securely", you agree to our Terms of Service and acknowledge that you have
        read our Privacy Policy.
      </p>
    </div>
  );
}
