import express from 'express';
import crypto from 'crypto';
import { PrismaClient, PaymentStatus } from '@prisma/client';
import { razorpayService, RazorpayService } from '../services/razorpayService';
import { paymentService } from '../services/paymentService';
import { webhookRateLimit } from '../middleware/paymentSecurity';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to capture raw body for webhook signature verification
const rawBodyParser = express.raw({ type: 'application/json', limit: '50mb' });

/**
 * @route POST /api/webhooks/razorpay
 * @desc Handle Razorpay webhooks
 * @access Public (webhook endpoint)
 */
router.post('/razorpay', webhookRateLimit, rawBodyParser, async (req, res) => {
  try {
    const body = req.body.toString();
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      console.error('Missing Razorpay signature');
      return res.status(400).json({
        success: false,
        error: 'Missing signature',
      });
    }

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.error('Invalid Razorpay webhook signature');
      return res.status(400).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    const payload = JSON.parse(body);

    // Store webhook for debugging and replay
    await prisma.paymentWebhook.create({
      data: {
        razorpaySignature: signature,
        eventType: payload.event,
        paymentId: payload.payload?.payment?.entity?.id,
        orderId: payload.payload?.order?.entity?.id,
        subscriptionId: payload.payload?.subscription?.entity?.id,
        status: payload.payload?.payment?.entity?.status || payload.payload?.subscription?.entity?.status,
        amount: payload.payload?.payment?.entity?.amount || payload.payload?.subscription?.entity?.amount,
        currency: payload.payload?.payment?.entity?.currency || 'INR',
        payload: payload,
        processed: false,
      },
    });

    // Process webhook based on event type
    let result;
    switch (payload.event) {
      case 'payment.captured':
        result = await handlePaymentCaptured(payload);
        break;
      case 'payment.failed':
        result = await handlePaymentFailed(payload);
        break;
      case 'payment.authorized':
        result = await handlePaymentAuthorized(payload);
        break;
      case 'subscription.activated':
        result = await handleSubscriptionActivated(payload);
        break;
      case 'subscription.charged':
        result = await handleSubscriptionCharged(payload);
        break;
      case 'subscription.pending':
        result = await handleSubscriptionPending(payload);
        break;
      case 'subscription.halted':
        result = await handleSubscriptionHalted(payload);
        break;
      case 'subscription.cancelled':
        result = await handleSubscriptionCancelled(payload);
        break;
      case 'refund.created':
        result = await handleRefundCreated(payload);
        break;
      case 'refund.processed':
        result = await handleRefundProcessed(payload);
        break;
      default:
        console.log(`Unhandled webhook event: ${payload.event}`);
        result = { success: true, message: 'Event noted but not processed' };
    }

    // Mark webhook as processed
    if (result.success) {
      await prisma.paymentWebhook.updateMany({
        where: {
          razorpaySignature: signature,
          processed: false,
        },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });
    } else {
      await prisma.paymentWebhook.updateMany({
        where: {
          razorpaySignature: signature,
          processed: false,
        },
        data: {
          errorMessage: result.error,
        },
      });
    }

    res.status(200).json({
      success: result.success,
      message: result.message || 'Webhook processed',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Handle payment captured event
 */
async function handlePaymentCaptured(payload: any) {
  try {
    const payment = payload.payload.payment.entity;
    const orderId = payment.order_id;

    // Find payment record
    const paymentRecord = await prisma.payment.findFirst({
      where: { razorpayOrderId: orderId },
      include: {
        vendor: true,
        subscription: true,
        registrationFee: true,
      },
    });

    if (!paymentRecord) {
      return {
        success: false,
        error: 'Payment record not found',
      };
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: {
        razorpayPaymentId: payment.id,
        status: PaymentStatus.SUCCESS,
        paidAt: new Date(),
        metadata: {
          ...paymentRecord.metadata,
          webhookPayment: payment,
        },
      },
    });

    // Handle specific payment types
    if (paymentRecord.paymentType === 'REGISTRATION_FEE' && paymentRecord.registrationFee) {
      await prisma.registrationFee.update({
        where: { id: paymentRecord.registrationFee.id },
        data: {
          status: PaymentStatus.SUCCESS,
          paidAt: new Date(),
        },
      });

      // Update vendor registration status
      if (paymentRecord.vendorId) {
        await prisma.vendor.update({
          where: { id: paymentRecord.vendorId },
          data: { registrationFeePaid: true },
        });
      }
    }

    if (paymentRecord.paymentType === 'SUBSCRIPTION' && paymentRecord.subscription) {
      await prisma.subscription.update({
        where: { id: paymentRecord.subscription.id },
        data: { status: 'ACTIVE' },
      });

      // Update vendor subscription status
      if (paymentRecord.vendorId) {
        await prisma.vendor.update({
          where: { id: paymentRecord.vendorId },
          data: { subscriptionStatus: 'ACTIVE' },
        });
      }
    }

    // Generate invoice
    await paymentService.generateInvoice(paymentRecord.id);

    return {
      success: true,
      message: 'Payment captured successfully',
    };
  } catch (error) {
    console.error('Handle payment captured error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(payload: any) {
  try {
    const payment = payload.payload.payment.entity;
    const orderId = payment.order_id;

    // Find payment record
    const paymentRecord = await prisma.payment.findFirst({
      where: { razorpayOrderId: orderId },
    });

    if (!paymentRecord) {
      return {
        success: false,
        error: 'Payment record not found',
      };
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: {
        razorpayPaymentId: payment.id,
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
        failureReason: payment.error_description || 'Payment failed',
        metadata: {
          ...paymentRecord.metadata,
          webhookPayment: payment,
        },
      },
    });

    return {
      success: true,
      message: 'Payment failure recorded',
    };
  } catch (error) {
    console.error('Handle payment failed error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handle payment authorized event
 */
async function handlePaymentAuthorized(payload: any) {
  try {
    const payment = payload.payload.payment.entity;
    const orderId = payment.order_id;

    // Find payment record
    const paymentRecord = await prisma.payment.findFirst({
      where: { razorpayOrderId: orderId },
    });

    if (!paymentRecord) {
      return {
        success: false,
        error: 'Payment record not found',
      };
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: {
        razorpayPaymentId: payment.id,
        status: PaymentStatus.PROCESSING,
        metadata: {
          ...paymentRecord.metadata,
          webhookPayment: payment,
        },
      },
    });

    return {
      success: true,
      message: 'Payment authorization recorded',
    };
  } catch (error) {
    console.error('Handle payment authorized error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handle subscription activated event
 */
async function handleSubscriptionActivated(payload: any) {
  try {
    const subscription = payload.payload.subscription.entity;

    // Find subscription record
    const subscriptionRecord = await prisma.subscription.findFirst({
      where: { razorpaySubscriptionId: subscription.id },
    });

    if (!subscriptionRecord) {
      return {
        success: false,
        error: 'Subscription record not found',
      };
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscriptionRecord.id },
      data: {
        status: 'ACTIVE',
      },
    });

    // Update vendor subscription status
    if (subscriptionRecord.vendorId) {
      await prisma.vendor.update({
        where: { id: subscriptionRecord.vendorId },
        data: { subscriptionStatus: 'ACTIVE' },
      });
    }

    return {
      success: true,
      message: 'Subscription activated',
    };
  } catch (error) {
    console.error('Handle subscription activated error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handle subscription charged event
 */
async function handleSubscriptionCharged(payload: any) {
  try {
    const subscription = payload.payload.subscription.entity;
    const payment = payload.payload.payment?.entity;

    if (payment) {
      // Create payment record for subscription charge
      const subscriptionRecord = await prisma.subscription.findFirst({
        where: { razorpaySubscriptionId: subscription.id },
      });

      if (subscriptionRecord) {
        await prisma.payment.create({
          data: {
            vendorId: subscriptionRecord.vendorId,
            subscriptionId: subscriptionRecord.id,
            razorpayPaymentId: payment.id,
            paymentType: 'SUBSCRIPTION',
            status: RazorpayService.mapRazorpayStatus(payment.status),
            amount: RazorpayService.paiseToRupees(payment.amount),
            totalAmount: RazorpayService.paiseToRupees(payment.amount),
            currency: payment.currency,
            description: 'Subscription renewal',
            paidAt: new Date(),
            metadata: {
              webhookPayment: payment,
              subscriptionCharge: true,
            },
          },
        });
      }
    }

    return {
      success: true,
      message: 'Subscription charge recorded',
    };
  } catch (error) {
    console.error('Handle subscription charged error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handle subscription pending event
 */
async function handleSubscriptionPending(payload: any) {
  try {
    const subscription = payload.payload.subscription.entity;

    // Find subscription record
    const subscriptionRecord = await prisma.subscription.findFirst({
      where: { razorpaySubscriptionId: subscription.id },
    });

    if (subscriptionRecord) {
      await prisma.subscription.update({
        where: { id: subscriptionRecord.id },
        data: { status: 'INACTIVE' },
      });
    }

    return {
      success: true,
      message: 'Subscription pending status updated',
    };
  } catch (error) {
    console.error('Handle subscription pending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handle subscription halted event
 */
async function handleSubscriptionHalted(payload: any) {
  try {
    const subscription = payload.payload.subscription.entity;

    // Find subscription record
    const subscriptionRecord = await prisma.subscription.findFirst({
      where: { razorpaySubscriptionId: subscription.id },
    });

    if (subscriptionRecord) {
      await prisma.subscription.update({
        where: { id: subscriptionRecord.id },
        data: { status: 'INACTIVE' },
      });

      // Update vendor subscription status
      if (subscriptionRecord.vendorId) {
        await prisma.vendor.update({
          where: { id: subscriptionRecord.vendorId },
          data: { subscriptionStatus: 'INACTIVE' },
        });
      }
    }

    return {
      success: true,
      message: 'Subscription halted',
    };
  } catch (error) {
    console.error('Handle subscription halted error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(payload: any) {
  try {
    const subscription = payload.payload.subscription.entity;

    // Find subscription record
    const subscriptionRecord = await prisma.subscription.findFirst({
      where: { razorpaySubscriptionId: subscription.id },
    });

    if (subscriptionRecord) {
      await prisma.subscription.update({
        where: { id: subscriptionRecord.id },
        data: { status: 'CANCELLED' },
      });

      // Update vendor subscription status
      if (subscriptionRecord.vendorId) {
        await prisma.vendor.update({
          where: { id: subscriptionRecord.vendorId },
          data: { subscriptionStatus: 'CANCELLED' },
        });
      }
    }

    return {
      success: true,
      message: 'Subscription cancelled',
    };
  } catch (error) {
    console.error('Handle subscription cancelled error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handle refund created event
 */
async function handleRefundCreated(payload: any) {
  try {
    const refund = payload.payload.refund.entity;
    const paymentId = refund.payment_id;

    // Find payment record
    const paymentRecord = await prisma.payment.findFirst({
      where: { razorpayPaymentId: paymentId },
    });

    if (paymentRecord) {
      const refundAmount = RazorpayService.paiseToRupees(refund.amount);
      const isPartialRefund = refundAmount < paymentRecord.totalAmount;

      await prisma.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: isPartialRefund ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.REFUNDED,
          refundAmount,
          refundedAt: new Date(),
          metadata: {
            ...paymentRecord.metadata,
            refund,
          },
        },
      });
    }

    return {
      success: true,
      message: 'Refund created',
    };
  } catch (error) {
    console.error('Handle refund created error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handle refund processed event
 */
async function handleRefundProcessed(payload: any) {
  try {
    // Similar to refund created, but indicates the refund is fully processed
    return await handleRefundCreated(payload);
  } catch (error) {
    console.error('Handle refund processed error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export default router;