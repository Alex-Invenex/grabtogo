import Razorpay from 'razorpay';
import { PrismaClient } from '@prisma/client';
import { razorpayService } from './razorpayService';

const prisma = new PrismaClient();

interface CreateUPIAutoPayOptions {
  customerId: string;
  vendorId: string;
  planType: 'BASIC' | 'STANDARD' | 'PREMIUM';
  maxAmount: number; // Maximum amount that can be charged per billing cycle
  frequency: 'monthly' | 'quarterly' | 'yearly';
  customerEmail: string;
  customerPhone: string;
  customerName: string;
}

interface CreateRecurringSubscriptionOptions {
  vendorId: string;
  planType: 'BASIC' | 'STANDARD' | 'PREMIUM';
  userEmail: string;
  userName: string;
  userPhone?: string;
}

class UPIAutoPayService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  /**
   * Create UPI AutoPay recurring subscription
   */
  async createUPIAutoPaySubscription(options: CreateRecurringSubscriptionOptions) {
    try {
      const { vendorId, planType, userEmail, userName, userPhone } = options;

      // Get subscription plan details
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { planType },
      });

      if (!plan) {
        return {
          success: false,
          error: 'Subscription plan not found',
        };
      }

      // Create or get customer in Razorpay
      const customerResult = await this.createOrGetCustomer({
        email: userEmail,
        name: userName,
        contact: userPhone,
      });

      if (!customerResult.success) {
        return customerResult;
      }

      const customerId = customerResult.customer.id;

      // Create Razorpay plan if not exists
      const planResult = await this.createOrGetPlan(planType, plan);
      if (!planResult.success) {
        return planResult;
      }

      const razorpayPlanId = planResult.plan.id;

      // Calculate amount with GST (18%)
      const baseAmount = plan.price;
      const gstAmount = Math.round(baseAmount * 0.18 * 100) / 100;
      const totalAmount = baseAmount + gstAmount;
      const amountInPaise = Math.round(totalAmount * 100);

      // Create subscription with UPI AutoPay
      const subscriptionData = {
        plan_id: razorpayPlanId,
        customer_id: customerId,
        total_count: 120, // 10 years worth of monthly payments
        quantity: 1,
        start_at: Math.floor(Date.now() / 1000) + 86400, // Start tomorrow
        expire_by: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // Expire in 1 year
        addons: [
          {
            item: {
              name: 'GST (18%)',
              amount: Math.round(gstAmount * 100),
              currency: 'INR',
            },
          },
        ],
        notes: {
          vendorId,
          planType,
          billing_cycle: 'monthly',
          payment_method: 'upi_autopay',
        },
        offer_id: undefined, // No offer for now
      };

      const subscription = await this.razorpay.subscriptions.create(subscriptionData);

      // Create subscription record in database
      const dbSubscription = await prisma.subscription.create({
        data: {
          vendorId,
          planType,
          razorpaySubscriptionId: subscription.id,
          status: 'TRIAL', // Start with trial
          startDate: new Date(subscription.start_at * 1000),
          endDate: new Date((subscription.start_at + 30 * 24 * 60 * 60) * 1000), // 30 days from start
          amount: plan.price,
          currency: 'INR',
          billingCycle: 'monthly',
        },
      });

      // Create initial payment record for tracking
      await prisma.payment.create({
        data: {
          vendorId,
          subscriptionId: dbSubscription.id,
          paymentType: 'SUBSCRIPTION',
          status: 'PENDING',
          amount: baseAmount,
          tax: gstAmount,
          totalAmount: totalAmount,
          currency: 'INR',
          description: `${planType} Plan UPI AutoPay Subscription`,
          metadata: {
            razorpaySubscriptionId: subscription.id,
            razorpayCustomerId: customerId,
            razorpayPlanId: razorpayPlanId,
            paymentMethod: 'upi_autopay',
            userEmail,
            userName,
          },
        },
      });

      return {
        success: true,
        subscription: dbSubscription,
        razorpaySubscription: subscription,
        customerId,
        checkoutUrl: this.generateUPIAutoPayCheckoutUrl(subscription.id),
      };
    } catch (error) {
      console.error('Create UPI AutoPay subscription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create or get existing customer
   */
  private async createOrGetCustomer(customerData: {
    email: string;
    name: string;
    contact?: string;
  }) {
    try {
      // Try to find existing customer by email
      const customers = await this.razorpay.customers.all({
        email: customerData.email,
      });

      if (customers.items && customers.items.length > 0) {
        return {
          success: true,
          customer: customers.items[0],
        };
      }

      // Create new customer
      const customer = await this.razorpay.customers.create({
        name: customerData.name,
        email: customerData.email,
        contact: customerData.contact,
        fail_existing: false,
        notes: {
          created_by: 'grabtogo_platform',
        },
      });

      return {
        success: true,
        customer,
      };
    } catch (error) {
      console.error('Create/get customer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Customer creation failed',
      };
    }
  }

  /**
   * Create or get Razorpay plan
   */
  private async createOrGetPlan(planType: string, planData: any) {
    try {
      // Check if plan already exists in Razorpay
      const planId = `grabtogo_${planType.toLowerCase()}_monthly_v2`;

      try {
        const existingPlan = await this.razorpay.plans.fetch(planId);
        return {
          success: true,
          plan: existingPlan,
        };
      } catch (fetchError) {
        // Plan doesn't exist, create it
      }

      // Create new plan
      const plan = await this.razorpay.plans.create({
        id: planId,
        period: 'monthly',
        interval: 1,
        item: {
          name: `GrabtoGo ${planType} Plan`,
          amount: planData.price * 100, // Convert to paise
          currency: 'INR',
          description: planData.description,
        },
        notes: {
          planType,
          platform: 'grabtogo',
          features: JSON.stringify(planData.features),
        },
      });

      return {
        success: true,
        plan,
      };
    } catch (error) {
      console.error('Create/get plan error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Plan creation failed',
      };
    }
  }

  /**
   * Generate checkout URL for UPI AutoPay
   */
  private generateUPIAutoPayCheckoutUrl(subscriptionId: string): string {
    // In a real implementation, you would generate a secure checkout URL
    // For now, return a placeholder that frontend can handle
    return `${process.env.WEB_APP_URL}/checkout/upi-autopay?subscription_id=${subscriptionId}`;
  }

  /**
   * Cancel UPI AutoPay subscription
   */
  async cancelUPIAutoPaySubscription(subscriptionId: string, cancelAtCycleEnd = true) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { razorpaySubscriptionId: subscriptionId },
      });

      if (!subscription) {
        return {
          success: false,
          error: 'Subscription not found',
        };
      }

      // Cancel in Razorpay
      const cancelledSubscription = await this.razorpay.subscriptions.cancel(
        subscriptionId,
        cancelAtCycleEnd
      );

      // Update database
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
        },
      });

      return {
        success: true,
        subscription: cancelledSubscription,
      };
    } catch (error) {
      console.error('Cancel UPI AutoPay subscription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cancellation failed',
      };
    }
  }

  /**
   * Pause UPI AutoPay subscription
   */
  async pauseUPIAutoPaySubscription(subscriptionId: string, pauseAt?: number) {
    try {
      const pauseData: any = {};
      if (pauseAt) {
        pauseData.pause_at = pauseAt;
      }

      const pausedSubscription = await this.razorpay.subscriptions.pause(
        subscriptionId,
        pauseData
      );

      // Update database
      await prisma.subscription.updateMany({
        where: { razorpaySubscriptionId: subscriptionId },
        data: { status: 'INACTIVE' },
      });

      return {
        success: true,
        subscription: pausedSubscription,
      };
    } catch (error) {
      console.error('Pause UPI AutoPay subscription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pause failed',
      };
    }
  }

  /**
   * Resume UPI AutoPay subscription
   */
  async resumeUPIAutoPaySubscription(subscriptionId: string) {
    try {
      const resumedSubscription = await this.razorpay.subscriptions.resume(subscriptionId);

      // Update database
      await prisma.subscription.updateMany({
        where: { razorpaySubscriptionId: subscriptionId },
        data: { status: 'ACTIVE' },
      });

      return {
        success: true,
        subscription: resumedSubscription,
      };
    } catch (error) {
      console.error('Resume UPI AutoPay subscription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Resume failed',
      };
    }
  }

  /**
   * Get subscription details
   */
  async getSubscriptionDetails(subscriptionId: string) {
    try {
      const razorpaySubscription = await this.razorpay.subscriptions.fetch(subscriptionId);

      const dbSubscription = await prisma.subscription.findFirst({
        where: { razorpaySubscriptionId: subscriptionId },
        include: {
          vendor: { include: { user: true } },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      return {
        success: true,
        razorpaySubscription,
        dbSubscription,
      };
    } catch (error) {
      console.error('Get subscription details error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch subscription',
      };
    }
  }

  /**
   * Process subscription charge (called from webhook)
   */
  async processSubscriptionCharge(webhookPayload: any) {
    try {
      const subscription = webhookPayload.payload.subscription.entity;
      const payment = webhookPayload.payload.payment?.entity;

      if (!payment) {
        return {
          success: false,
          error: 'No payment data in webhook',
        };
      }

      const dbSubscription = await prisma.subscription.findFirst({
        where: { razorpaySubscriptionId: subscription.id },
      });

      if (!dbSubscription) {
        return {
          success: false,
          error: 'Subscription not found in database',
        };
      }

      // Create payment record for this charge
      const paymentRecord = await prisma.payment.create({
        data: {
          vendorId: dbSubscription.vendorId,
          subscriptionId: dbSubscription.id,
          razorpayPaymentId: payment.id,
          paymentType: 'SUBSCRIPTION',
          status: payment.status === 'captured' ? 'SUCCESS' : 'PENDING',
          amount: payment.amount / 100, // Convert from paise
          totalAmount: payment.amount / 100,
          currency: payment.currency,
          description: 'Monthly subscription charge',
          paidAt: payment.status === 'captured' ? new Date() : null,
          metadata: {
            razorpaySubscriptionId: subscription.id,
            webhookCharge: true,
            paymentMethod: 'upi_autopay',
          },
        },
      });

      // Update subscription end date
      if (payment.status === 'captured') {
        const currentEndDate = new Date(dbSubscription.endDate || dbSubscription.startDate);
        const newEndDate = new Date(currentEndDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Add 30 days

        await prisma.subscription.update({
          where: { id: dbSubscription.id },
          data: {
            endDate: newEndDate,
            status: 'ACTIVE',
          },
        });
      }

      return {
        success: true,
        payment: paymentRecord,
      };
    } catch (error) {
      console.error('Process subscription charge error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process charge',
      };
    }
  }
}

const upiAutoPayService = new UPIAutoPayService();
export { UPIAutoPayService, upiAutoPayService };