import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  SubscriptionPlan,
  CreateSubscriptionRequest,
  RazorpaySubscription,
  PaymentSuccessRequest
} from '../types/subscription';
import { CustomError } from '../types/api';

const prisma = new PrismaClient();

class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  // Get all subscription plans
  getSubscriptionPlans(): SubscriptionPlan[] {
    return [
      {
        planType: 'BASIC',
        name: 'Basic Plan',
        description: 'Perfect for small restaurants and cafes',
        features: [
          'Up to 50 products',
          'Up to 20 offers per month',
          'Basic analytics (30 days)',
          'Email support',
          'Order management',
          'Customer reviews'
        ],
        pricing: {
          monthly: {
            amount: 9900, // ₹99 in paise
            currency: 'INR'
          },
          yearly: {
            amount: 99900, // ₹999 in paise
            currency: 'INR',
            discount: 17 // 17% discount (₹1188 - ₹999 = ₹189 saved)
          }
        },
        limits: {
          productsPerMonth: 50,
          offersPerMonth: 20,
          analyticsRetention: 30,
          customerSupportLevel: 'email'
        }
      },
      {
        planType: 'STANDARD',
        name: 'Standard Plan',
        description: 'Ideal for growing restaurants and chains',
        features: [
          'Up to 200 products',
          'Up to 50 offers per month',
          'Advanced analytics (90 days)',
          'Priority email & chat support',
          'Advanced order management',
          'Customer reviews & ratings',
          'Inventory management',
          'Social media integration'
        ],
        pricing: {
          monthly: {
            amount: 19900, // ₹199 in paise
            currency: 'INR'
          },
          yearly: {
            amount: 199900, // ₹1999 in paise
            currency: 'INR',
            discount: 17 // 17% discount
          }
        },
        limits: {
          productsPerMonth: 200,
          offersPerMonth: 50,
          analyticsRetention: 90,
          customerSupportLevel: 'priority'
        }
      },
      {
        planType: 'PREMIUM',
        name: 'Premium Plan',
        description: 'Complete solution for enterprise restaurants',
        features: [
          'Unlimited products',
          'Unlimited offers',
          'Premium analytics (1 year)',
          '24/7 phone support',
          'Enterprise order management',
          'Advanced customer insights',
          'Complete inventory management',
          'Multi-location support',
          'Custom integrations',
          'Dedicated account manager'
        ],
        pricing: {
          monthly: {
            amount: 29900, // ₹299 in paise
            currency: 'INR'
          },
          yearly: {
            amount: 299900, // ₹2999 in paise
            currency: 'INR',
            discount: 17 // 17% discount
          }
        },
        limits: {
          productsPerMonth: -1, // unlimited
          offersPerMonth: -1, // unlimited
          analyticsRetention: 365,
          customerSupportLevel: 'premium'
        }
      }
    ];
  }

  // Create registration fee payment order
  async createRegistrationFeeOrder(vendorId: string): Promise<any> {
    const baseAmount = 29900; // ₹299 in paise
    const taxRate = 0.18; // 18% GST
    const taxAmount = Math.round(baseAmount * taxRate);
    const totalAmount = baseAmount + taxAmount;

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: true }
    });

    if (!vendor) {
      throw new CustomError('Vendor not found', 404);
    }

    if (vendor.registrationFeePaid) {
      throw new CustomError('Registration fee already paid', 400);
    }

    const orderData = {
      amount: totalAmount,
      currency: 'INR',
      receipt: `reg_fee_${vendorId}_${Date.now()}`,
      notes: {
        vendor_id: vendorId,
        payment_type: 'registration_fee',
        base_amount: baseAmount,
        tax_amount: taxAmount,
        company_name: vendor.companyName
      }
    };

    try {
      // For demo purposes, simulate order creation
      const simulatedOrder = {
        id: `order_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        entity: 'order',
        amount: totalAmount,
        amount_paid: 0,
        amount_due: totalAmount,
        currency: 'INR',
        receipt: orderData.receipt,
        status: 'created',
        notes: orderData.notes,
        created_at: Math.floor(Date.now() / 1000),
        breakdown: {
          baseAmount: baseAmount / 100,
          taxAmount: taxAmount / 100,
          totalAmount: totalAmount / 100,
          currency: 'INR'
        }
      };

      return simulatedOrder;
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      throw new CustomError('Failed to create payment order', 500);
    }
  }

  // Create subscription
  async createSubscription(
    vendorId: string,
    request: CreateSubscriptionRequest
  ): Promise<RazorpaySubscription> {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: true }
    });

    if (!vendor) {
      throw new CustomError('Vendor not found', 404);
    }

    if (!vendor.registrationFeePaid) {
      throw new CustomError('Registration fee must be paid before subscribing', 400);
    }

    if (!vendor.isApproved) {
      throw new CustomError('Vendor must be approved before subscribing', 400);
    }

    const plans = this.getSubscriptionPlans();
    const selectedPlan = plans.find(p => p.planType === request.planType);

    if (!selectedPlan) {
      throw new CustomError('Invalid subscription plan', 400);
    }

    const amount = request.billingCycle === 'yearly'
      ? selectedPlan.pricing.yearly.amount
      : selectedPlan.pricing.monthly.amount;

    try {
      // For demo purposes, simulate subscription creation
      const simulatedSubscription: RazorpaySubscription = {
        id: `sub_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        entity: 'subscription',
        plan_id: `${request.planType.toLowerCase()}_${request.billingCycle}`,
        customer_id: vendor.user.email,
        status: 'created',
        quantity: 1,
        notes: {
          vendor_id: vendorId,
          plan_type: request.planType,
          billing_cycle: request.billingCycle,
          company_name: vendor.companyName
        },
        charge_at: Math.floor(Date.now() / 1000) + 300,
        start_at: Math.floor(Date.now() / 1000) + 300,
        total_count: request.billingCycle === 'yearly' ? 1 : 12,
        paid_count: 0,
        customer_notify: true,
        created_at: Math.floor(Date.now() / 1000),
        auth_attempts: 0
      };

      // Save subscription to database
      const endDate = new Date();
      if (request.billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      await prisma.subscription.create({
        data: {
          vendorId,
          planType: request.planType,
          razorpaySubscriptionId: simulatedSubscription.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate,
          amount: amount / 100, // Convert paise to rupees
          currency: 'INR',
          billingCycle: request.billingCycle
        }
      });

      // Update vendor subscription status
      await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          subscriptionStatus: 'ACTIVE'
        }
      });

      return simulatedSubscription;

    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw new CustomError('Failed to create subscription', 500);
    }
  }

  // Verify payment signature
  verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === razorpaySignature;
  }

  // Process successful registration fee payment
  async processRegistrationFeePayment(
    vendorId: string,
    paymentDetails: any
  ): Promise<void> {
    // Update vendor registration fee status
    await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        registrationFeePaid: true
      }
    });

    console.log(`Registration fee payment successful for vendor: ${vendorId}`);
  }

  // Cancel subscription
  async cancelSubscription(vendorId: string): Promise<void> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        vendorId,
        status: 'ACTIVE'
      }
    });

    if (!subscription) {
      throw new CustomError('No active subscription found', 404);
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED'
      }
    });

    // Update vendor subscription status
    await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        subscriptionStatus: 'CANCELLED'
      }
    });
  }

  // Get subscription invoices
  async getSubscriptionInvoices(vendorId: string): Promise<any[]> {
    const subscriptions = await prisma.subscription.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' }
    });

    return subscriptions.map(sub => ({
      id: `inv_${sub.id}`,
      subscriptionId: sub.id,
      invoiceNumber: `INV-${sub.id.slice(-8).toUpperCase()}`,
      amount: sub.amount,
      currency: sub.currency,
      status: 'paid',
      issuedAt: sub.createdAt,
      dueDate: sub.createdAt,
      paidAt: sub.createdAt,
      planType: sub.planType,
      billingCycle: sub.billingCycle
    }));
  }
}

export default new RazorpayService();