import { PlanType } from '@prisma/client';

export interface SubscriptionPlan {
  planType: PlanType;
  name: string;
  description: string;
  features: string[];
  pricing: {
    monthly: {
      amount: number;
      currency: string;
      razorpayPlanId?: string;
    };
    yearly: {
      amount: number;
      currency: string;
      discount: number; // percentage
      razorpayPlanId?: string;
    };
  };
  limits: {
    productsPerMonth: number;
    offersPerMonth: number;
    analyticsRetention: number; // days
    customerSupportLevel: string;
  };
}

export interface CreateSubscriptionRequest {
  planType: PlanType;
  billingCycle: 'monthly' | 'yearly';
  paymentMethod?: 'razorpay' | 'upi' | 'card';
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface PaymentSuccessRequest {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

export interface RazorpaySubscription {
  id: string;
  entity: string;
  plan_id: string;
  customer_id: string;
  status: string;
  current_start?: number;
  current_end?: number;
  ended_at?: number;
  quantity: number;
  notes: Record<string, any>;
  charge_at: number;
  start_at: number;
  end_at?: number;
  auth_attempts: number;
  total_count: number;
  paid_count: number;
  customer_notify: boolean;
  created_at: number;
  expire_by?: number;
  short_url?: string;
}

export interface RegistrationFeePayment {
  amount: number; // 299
  tax: number; // 18% GST
  totalAmount: number; // 352.82
  currency: string;
  description: string;
  vendorId: string;
  razorpayOrderId?: string;
}

export interface SubscriptionInvoice {
  id: string;
  subscriptionId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  issuedAt: Date;
  dueDate: Date;
  paidAt?: Date;
  downloadUrl?: string;
  razorpayInvoiceId?: string;
}