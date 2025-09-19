import { PrismaClient, PaymentStatus, PaymentType, InvoiceStatus } from '@prisma/client';
import { razorpayService, RazorpayService } from './razorpayService';

const prisma = new PrismaClient();

interface CreatePaymentOptions {
  vendorId?: string;
  customerId?: string;
  orderId?: string;
  subscriptionId?: string;
  paymentType: PaymentType;
  amount: number;
  description?: string;
  metadata?: any;
}

interface RegistrationFeePaymentOptions {
  vendorId: string;
  userEmail: string;
  userName: string;
}

interface SubscriptionPaymentOptions {
  vendorId: string;
  planType: 'BASIC' | 'STANDARD' | 'PREMIUM';
  userEmail: string;
  userName: string;
}

class PaymentService {
  /**
   * Create registration fee payment
   */
  async createRegistrationFeePayment(options: RegistrationFeePaymentOptions) {
    try {
      // Check if registration fee already exists
      const existingFee = await prisma.registrationFee.findUnique({
        where: { vendorId: options.vendorId },
      });

      if (existingFee && existingFee.status === PaymentStatus.SUCCESS) {
        return {
          success: false,
          error: 'Registration fee already paid',
        };
      }

      // Calculate amount with GST
      const feeCalculation = RazorpayService.calculateGST(299);
      const amountInPaise = RazorpayService.rupeesToPaise(feeCalculation.total);

      // Create Razorpay order
      const orderResult = await razorpayService.createOrder({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `reg_fee_${options.vendorId}_${Date.now()}`,
        notes: {
          vendorId: options.vendorId,
          paymentType: 'REGISTRATION_FEE',
          userEmail: options.userEmail,
        },
      });

      if (!orderResult.success || !orderResult.order) {
        return {
          success: false,
          error: orderResult.error || 'Failed to create payment order',
        };
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          vendorId: options.vendorId,
          razorpayOrderId: orderResult.order.id,
          paymentType: PaymentType.REGISTRATION_FEE,
          status: PaymentStatus.PENDING,
          amount: feeCalculation.amount,
          tax: feeCalculation.gst,
          totalAmount: feeCalculation.total,
          currency: 'INR',
          description: 'Vendor Registration Fee',
          metadata: {
            userEmail: options.userEmail,
            userName: options.userName,
          },
        },
      });

      // Create or update registration fee record
      const registrationFee = await prisma.registrationFee.upsert({
        where: { vendorId: options.vendorId },
        update: {
          paymentId: payment.id,
          status: PaymentStatus.PENDING,
        },
        create: {
          vendorId: options.vendorId,
          paymentId: payment.id,
          amount: feeCalculation.amount,
          tax: feeCalculation.gst,
          total: feeCalculation.total,
          status: PaymentStatus.PENDING,
        },
      });

      return {
        success: true,
        payment,
        registrationFee,
        razorpayOrder: orderResult.order,
      };
    } catch (error) {
      console.error('Create registration fee payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create subscription payment
   */
  async createSubscriptionPayment(options: SubscriptionPaymentOptions) {
    try {
      // Get subscription plan details
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { planType: options.planType },
      });

      if (!plan) {
        return {
          success: false,
          error: 'Subscription plan not found',
        };
      }

      // Calculate amount with GST
      const planCalculation = RazorpayService.calculateGST(plan.price);
      const amountInPaise = RazorpayService.rupeesToPaise(planCalculation.total);

      // Create Razorpay order
      const orderResult = await razorpayService.createOrder({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `sub_${options.planType.toLowerCase()}_${options.vendorId}_${Date.now()}`,
        notes: {
          vendorId: options.vendorId,
          planType: options.planType,
          paymentType: 'SUBSCRIPTION',
          userEmail: options.userEmail,
        },
      });

      if (!orderResult.success || !orderResult.order) {
        return {
          success: false,
          error: orderResult.error || 'Failed to create payment order',
        };
      }

      // Create subscription record
      const subscription = await prisma.subscription.create({
        data: {
          vendorId: options.vendorId,
          planType: options.planType,
          status: 'TRIAL', // Start with trial
          startDate: new Date(),
          endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
          amount: plan.price,
          currency: 'INR',
          billingCycle: 'monthly',
        },
      });

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          vendorId: options.vendorId,
          subscriptionId: subscription.id,
          razorpayOrderId: orderResult.order.id,
          paymentType: PaymentType.SUBSCRIPTION,
          status: PaymentStatus.PENDING,
          amount: planCalculation.amount,
          tax: planCalculation.gst,
          totalAmount: planCalculation.total,
          currency: 'INR',
          description: `${options.planType} Plan Subscription`,
          metadata: {
            userEmail: options.userEmail,
            userName: options.userName,
            planType: options.planType,
          },
        },
      });

      return {
        success: true,
        payment,
        subscription,
        plan,
        razorpayOrder: orderResult.order,
      };
    } catch (error) {
      console.error('Create subscription payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Verify payment and update status
   */
  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    try {
      // Verify signature
      const isValid = razorpayService.verifyPaymentSignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      if (!isValid) {
        return {
          success: false,
          error: 'Invalid payment signature',
        };
      }

      // Get payment details from Razorpay
      const paymentResult = await razorpayService.getPayment(razorpayPaymentId);
      if (!paymentResult.success || !paymentResult.payment) {
        return {
          success: false,
          error: 'Failed to fetch payment details',
        };
      }

      const razorpayPayment = paymentResult.payment;

      // Find payment record
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId },
        include: {
          vendor: true,
          subscription: true,
          registrationFee: true,
        },
      });

      if (!payment) {
        return {
          success: false,
          error: 'Payment record not found',
        };
      }

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId,
          status: RazorpayService.mapRazorpayStatus(razorpayPayment.status),
          paidAt: razorpayPayment.status === 'captured' ? new Date() : null,
          metadata: {
            ...payment.metadata,
            razorpayPayment,
          },
        },
      });

      // Handle specific payment types
      if (payment.paymentType === PaymentType.REGISTRATION_FEE && payment.registrationFee) {
        await prisma.registrationFee.update({
          where: { id: payment.registrationFee.id },
          data: {
            status: updatedPayment.status,
            paidAt: updatedPayment.paidAt,
          },
        });

        // Update vendor registration fee status
        if (payment.vendorId && updatedPayment.status === PaymentStatus.SUCCESS) {
          await prisma.vendor.update({
            where: { id: payment.vendorId },
            data: { registrationFeePaid: true },
          });
        }
      }

      if (payment.paymentType === PaymentType.SUBSCRIPTION && payment.subscription) {
        await prisma.subscription.update({
          where: { id: payment.subscription.id },
          data: {
            status: updatedPayment.status === PaymentStatus.SUCCESS ? 'ACTIVE' : 'INACTIVE',
          },
        });

        // Update vendor subscription status
        if (payment.vendorId && updatedPayment.status === PaymentStatus.SUCCESS) {
          await prisma.vendor.update({
            where: { id: payment.vendorId },
            data: { subscriptionStatus: 'ACTIVE' },
          });
        }
      }

      // Generate invoice if payment is successful
      if (updatedPayment.status === PaymentStatus.SUCCESS) {
        await this.generateInvoice(updatedPayment.id);
      }

      return {
        success: true,
        payment: updatedPayment,
      };
    } catch (error) {
      console.error('Verify payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate invoice for payment
   */
  async generateInvoice(paymentId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          vendor: { include: { user: true } },
          customer: { include: { user: true } },
        },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      const invoiceNumber = `INV-${Date.now()}`;
      const items = [
        {
          name: payment.description || 'Payment',
          amount: payment.amount,
          tax: payment.tax,
          total: payment.totalAmount,
        },
      ];

      const invoice = await prisma.invoice.create({
        data: {
          paymentId: payment.id,
          vendorId: payment.vendorId,
          customerId: payment.customerId,
          invoiceNumber,
          status: InvoiceStatus.PAID,
          issueDate: new Date(),
          paidDate: payment.paidAt,
          subtotal: payment.amount,
          taxAmount: payment.tax || 0,
          totalAmount: payment.totalAmount,
          currency: payment.currency,
          description: payment.description,
          items,
          metadata: {
            paymentType: payment.paymentType,
            razorpayPaymentId: payment.razorpayPaymentId,
          },
        },
      });

      return {
        success: true,
        invoice,
      };
    } catch (error) {
      console.error('Generate invoice error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get payment history for vendor/customer
   */
  async getPaymentHistory(vendorId?: string, customerId?: string, limit = 10, offset = 0) {
    try {
      const where: any = {};
      if (vendorId) where.vendorId = vendorId;
      if (customerId) where.customerId = customerId;

      const payments = await prisma.payment.findMany({
        where,
        include: {
          vendor: { include: { user: true } },
          customer: { include: { user: true } },
          invoice: true,
          subscription: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await prisma.payment.count({ where });

      return {
        success: true,
        payments,
        total,
        hasMore: offset + payments.length < total,
      };
    } catch (error) {
      console.error('Get payment history error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, amount?: number, reason?: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment || !payment.razorpayPaymentId) {
        return {
          success: false,
          error: 'Payment not found or not processed',
        };
      }

      const refundOptions: any = {};
      if (amount) {
        refundOptions.amount = RazorpayService.rupeesToPaise(amount);
      }
      if (reason) {
        refundOptions.notes = { reason };
      }

      const refundResult = await razorpayService.createRefund(
        payment.razorpayPaymentId,
        refundOptions
      );

      if (!refundResult.success) {
        return {
          success: false,
          error: refundResult.error,
        };
      }

      // Update payment status
      const refundAmount = amount || payment.totalAmount;
      const isPartialRefund = amount && amount < payment.totalAmount;

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: isPartialRefund ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.REFUNDED,
          refundAmount,
          refundedAt: new Date(),
          metadata: {
            ...payment.metadata,
            refund: refundResult.refund,
          },
        },
      });

      return {
        success: true,
        refund: refundResult.refund,
      };
    } catch (error) {
      console.error('Process refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get subscription plans
   */
  async getSubscriptionPlans() {
    try {
      const plans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      });

      return {
        success: true,
        plans,
      };
    } catch (error) {
      console.error('Get subscription plans error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

const paymentService = new PaymentService();
export { PaymentService, paymentService };