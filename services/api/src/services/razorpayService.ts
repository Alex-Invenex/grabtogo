import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PaymentStatus, PaymentType } from '@prisma/client';

interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

interface CreateOrderOptions {
  amount: number; // Amount in paise (INR smallest unit)
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}

interface CreateSubscriptionOptions {
  planId: string;
  customerId: string;
  totalCount?: number;
  startAt?: number;
  addons?: Array<{
    item: {
      name: string;
      amount: number;
      currency: string;
    };
  }>;
  notes?: Record<string, any>;
}

interface PaymentVerificationData {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

interface WebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: any;
    };
    order?: {
      entity: any;
    };
    subscription?: {
      entity: any;
    };
  };
  created_at: number;
}

class RazorpayService {
  private razorpay: Razorpay;
  private webhookSecret: string;

  constructor(config: RazorpayConfig) {
    this.razorpay = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Create a new payment order
   */
  async createOrder(options: CreateOrderOptions) {
    try {
      const order = await this.razorpay.orders.create({
        amount: options.amount,
        currency: options.currency || 'INR',
        receipt: options.receipt || `receipt_${Date.now()}`,
        notes: options.notes || {},
      });

      return {
        success: true,
        order,
      };
    } catch (error) {
      console.error('Razorpay create order error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create a subscription plan
   */
  async createPlan(planData: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    item: {
      name: string;
      amount: number;
      currency: string;
      description?: string;
    };
    notes?: Record<string, any>;
  }) {
    try {
      const plan = await this.razorpay.plans.create(planData);
      return {
        success: true,
        plan,
      };
    } catch (error) {
      console.error('Razorpay create plan error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(options: CreateSubscriptionOptions) {
    try {
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: options.planId,
        customer_id: options.customerId,
        total_count: options.totalCount,
        start_at: options.startAt,
        addons: options.addons,
        notes: options.notes || {},
      });

      return {
        success: true,
        subscription,
      };
    } catch (error) {
      console.error('Razorpay create subscription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(customerData: {
    name: string;
    email: string;
    contact?: string;
    fail_existing?: boolean;
    notes?: Record<string, any>;
  }) {
    try {
      const customer = await this.razorpay.customers.create(customerData);
      return {
        success: true,
        customer,
      };
    } catch (error) {
      console.error('Razorpay create customer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(data: PaymentVerificationData): boolean {
    try {
      const generatedSignature = crypto
        .createHmac('sha256', this.razorpay.key_secret)
        .update(data.razorpayOrderId + '|' + data.razorpayPaymentId)
        .digest('hex');

      return generatedSignature === data.razorpaySignature;
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  /**
   * Fetch payment details
   */
  async getPayment(paymentId: string) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return {
        success: true,
        payment,
      };
    } catch (error) {
      console.error('Razorpay get payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetch order details
   */
  async getOrder(orderId: string) {
    try {
      const order = await this.razorpay.orders.fetch(orderId);
      return {
        success: true,
        order,
      };
    } catch (error) {
      console.error('Razorpay get order error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetch subscription details
   */
  async getSubscription(subscriptionId: string) {
    try {
      const subscription = await this.razorpay.subscriptions.fetch(subscriptionId);
      return {
        success: true,
        subscription,
      };
    } catch (error) {
      console.error('Razorpay get subscription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd = false) {
    try {
      const subscription = await this.razorpay.subscriptions.cancel(
        subscriptionId,
        cancelAtCycleEnd
      );
      return {
        success: true,
        subscription,
      };
    } catch (error) {
      console.error('Razorpay cancel subscription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Process refund
   */
  async createRefund(paymentId: string, options?: {
    amount?: number;
    speed?: 'normal' | 'optimum';
    notes?: Record<string, any>;
    receipt?: string;
  }) {
    try {
      const refund = await this.razorpay.payments.refund(paymentId, options);
      return {
        success: true,
        refund,
      };
    } catch (error) {
      console.error('Razorpay refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get refund details
   */
  async getRefund(paymentId: string, refundId: string) {
    try {
      const refund = await this.razorpay.payments.fetchRefund(paymentId, refundId);
      return {
        success: true,
        refund,
      };
    } catch (error) {
      console.error('Razorpay get refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Calculate GST (18%)
   */
  static calculateGST(amount: number): {
    amount: number;
    gst: number;
    total: number;
  } {
    const gst = Math.round(amount * 0.18 * 100) / 100; // 18% GST
    const total = Math.round((amount + gst) * 100) / 100;

    return {
      amount: Math.round(amount * 100) / 100,
      gst,
      total,
    };
  }

  /**
   * Convert rupees to paise
   */
  static rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100);
  }

  /**
   * Convert paise to rupees
   */
  static paiseToRupees(paise: number): number {
    return Math.round(paise / 100 * 100) / 100;
  }

  /**
   * Get payment status from Razorpay status
   */
  static mapRazorpayStatus(razorpayStatus: string): PaymentStatus {
    switch (razorpayStatus.toLowerCase()) {
      case 'created':
      case 'authorized':
        return PaymentStatus.PENDING;
      case 'captured':
        return PaymentStatus.SUCCESS;
      case 'failed':
        return PaymentStatus.FAILED;
      case 'refunded':
        return PaymentStatus.REFUNDED;
      case 'partially_refunded':
        return PaymentStatus.PARTIALLY_REFUNDED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}

// Create singleton instance
const razorpayService = new RazorpayService({
  keyId: process.env.RAZORPAY_KEY_ID!,
  keySecret: process.env.RAZORPAY_KEY_SECRET!,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET!,
});

export { RazorpayService, razorpayService };
export type {
  CreateOrderOptions,
  CreateSubscriptionOptions,
  PaymentVerificationData,
  WebhookPayload
};