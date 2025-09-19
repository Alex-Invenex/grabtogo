'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  notes?: Record<string, any>;
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutProps {
  orderId: string;
  amount: number;
  currency?: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  onSuccess: (response: RazorpayResponse) => void;
  onError: (error: any) => void;
  onClose?: () => void;
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  notes?: Record<string, any>;
}

const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
  orderId,
  amount,
  currency = 'INR',
  description,
  prefill,
  onSuccess,
  onError,
  onClose,
  loading = false,
  disabled = false,
  children,
  className,
  notes,
}) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);

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

  const handlePayment = () => {
    if (!scriptLoaded || !window.Razorpay) {
      toast.error('Payment gateway not loaded. Please try again.');
      return;
    }

    setProcessing(true);

    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      amount: amount * 100, // Convert to paise
      currency,
      name: 'GrabtoGo',
      description,
      order_id: orderId,
      handler: (response: RazorpayResponse) => {
        setProcessing(false);
        onSuccess(response);
      },
      prefill,
      notes,
      theme: {
        color: '#f97316', // Orange color matching the theme
      },
      modal: {
        ondismiss: () => {
          setProcessing(false);
          if (onClose) {
            onClose();
          }
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setProcessing(false);
        onError(response.error);
      });
      rzp.open();
    } catch (error) {
      setProcessing(false);
      console.error('Razorpay error:', error);
      onError(error);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading || processing || !scriptLoaded}
      className={className}
    >
      {processing
        ? 'Processing...'
        : loading
        ? 'Loading...'
        : !scriptLoaded
        ? 'Loading Payment Gateway...'
        : children || 'Pay Now'
      }
    </Button>
  );
};

export default RazorpayCheckout;