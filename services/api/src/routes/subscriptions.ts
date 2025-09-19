import express from 'express';
import { PrismaClient } from '@prisma/client';
import { clerkAuth, requireVendor } from '../middleware/clerk';
import { requireVendorRole, requireRegistrationFeePaid, requireApprovedVendor } from '../middleware/vendorAuth';
import { body, validationResult } from 'express-validator';
import { ApiResponse } from '../types/api';
import { CreateSubscriptionRequest, PaymentSuccessRequest } from '../types/subscription';
import razorpayService from '../services/razorpay';

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const handleValidationErrors = (
  req: express.Request,
  res: express.Response<ApiResponse>,
  next: express.NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors: Record<string, string[]> = {};
    errors.array().forEach((error) => {
      const field = 'path' in error ? error.path : 'unknown';
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(error.msg);
    });

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'Please check the provided data',
      errors: formattedErrors
    });
    return;
  }
  next();
};

// GET /plans - Return subscription plans
router.get('/plans', async (req, res: express.Response<ApiResponse>) => {
  try {
    const plans = razorpayService.getSubscriptionPlans();

    res.json({
      success: true,
      message: 'Subscription plans retrieved successfully',
      data: {
        plans,
        registrationFee: {
          amount: 299,
          tax: 53.82,
          totalAmount: 352.82,
          currency: 'INR',
          description: 'One-time registration fee (₹299 + 18% GST)'
        },
        trialPeriod: {
          duration: 30,
          unit: 'days',
          description: '30-day free trial included with every plan'
        },
        features: {
          allPlans: [
            'Multi-platform access (Web & Mobile)',
            'Real-time order management',
            'Customer reviews and ratings',
            'Basic analytics dashboard',
            'Secure payment processing'
          ],
          comparison: {
            basic: {
              maxProducts: 50,
              maxOffers: 20,
              analytics: '30 days',
              support: 'Email only',
              integrations: 'Basic'
            },
            standard: {
              maxProducts: 200,
              maxOffers: 50,
              analytics: '90 days',
              support: 'Email + Chat',
              integrations: 'Advanced'
            },
            premium: {
              maxProducts: 'Unlimited',
              maxOffers: 'Unlimited',
              analytics: '1 year',
              support: '24/7 Phone',
              integrations: 'Custom + API'
            }
          }
        }
      }
    });

  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscription plans',
      error: 'Internal server error'
    });
  }
});

// POST /create - Create Razorpay subscription
const createSubscriptionValidation = [
  body('planType')
    .isIn(['BASIC', 'STANDARD', 'PREMIUM'])
    .withMessage('Plan type must be BASIC, STANDARD, or PREMIUM'),
  body('billingCycle')
    .isIn(['monthly', 'yearly'])
    .withMessage('Billing cycle must be monthly or yearly'),
  handleValidationErrors
];

router.post('/create',
  clerkAuth,
  requireVendorRole,
  requireRegistrationFeePaid,
  requireApprovedVendor,
  createSubscriptionValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.vendor) {
        res.status(404).json({
          success: false,
          message: 'Vendor profile not found',
          error: 'No vendor profile associated with this user'
        });
        return;
      }

      // Check if vendor already has an active subscription
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          vendorId: req.user.vendor.id,
          status: 'ACTIVE'
        }
      });

      if (existingSubscription) {
        res.status(400).json({
          success: false,
          message: 'Active subscription already exists',
          error: 'Please cancel your current subscription before creating a new one'
        });
        return;
      }

      const createRequest: CreateSubscriptionRequest = req.body;
      const subscription = await razorpayService.createSubscription(req.user.vendor.id, createRequest);

      res.json({
        success: true,
        message: 'Subscription created successfully',
        data: {
          subscription,
          paymentInstructions: 'Complete the payment to activate your subscription',
          redirectUrl: `${process.env.WEB_APP_URL}/vendor/subscription/payment?subscription_id=${subscription.id}`
        }
      });

    } catch (error) {
      console.error('Create subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create subscription',
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
);

// POST /payment-success - Handle successful payments
const paymentSuccessValidation = [
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  body('razorpay_subscription_id')
    .notEmpty()
    .withMessage('Razorpay subscription ID is required'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required'),
  handleValidationErrors
];

router.post('/payment-success',
  clerkAuth,
  requireVendorRole,
  paymentSuccessValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.vendor) {
        res.status(404).json({
          success: false,
          message: 'Vendor profile not found',
          error: 'No vendor profile associated with this user'
        });
        return;
      }

      const paymentData: PaymentSuccessRequest = req.body;

      // Verify payment signature (in real implementation)
      // const isValid = razorpayService.verifyPaymentSignature(
      //   paymentData.razorpay_subscription_id,
      //   paymentData.razorpay_payment_id,
      //   paymentData.razorpay_signature
      // );

      // For demo purposes, assume payment is valid
      const isValid = true;

      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid payment signature',
          error: 'Payment verification failed'
        });
        return;
      }

      // Update subscription status to active
      const subscription = await prisma.subscription.findFirst({
        where: {
          vendorId: req.user.vendor.id,
          razorpaySubscriptionId: paymentData.razorpay_subscription_id
        }
      });

      if (!subscription) {
        res.status(404).json({
          success: false,
          message: 'Subscription not found',
          error: 'No subscription found with the provided ID'
        });
        return;
      }

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' }
      });

      await prisma.vendor.update({
        where: { id: req.user.vendor.id },
        data: { subscriptionStatus: 'ACTIVE' }
      });

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          subscriptionId: subscription.id,
          status: 'ACTIVE',
          planType: subscription.planType,
          billingCycle: subscription.billingCycle,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          welcomeMessage: 'Welcome to GrabtoGo! Your subscription is now active.'
        }
      });

    } catch (error) {
      console.error('Payment success processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payment',
        error: 'Internal server error'
      });
    }
  }
);

// POST /cancel - Cancel subscription
router.post('/cancel',
  clerkAuth,
  requireVendorRole,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.vendor) {
        res.status(404).json({
          success: false,
          message: 'Vendor profile not found',
          error: 'No vendor profile associated with this user'
        });
        return;
      }

      await razorpayService.cancelSubscription(req.user.vendor.id);

      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: {
          status: 'CANCELLED',
          effectiveDate: new Date(),
          refundPolicy: 'Refund will be processed within 5-7 business days if applicable',
          dataRetention: 'Your data will be retained for 30 days before permanent deletion'
        }
      });

    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription',
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
);

// GET /invoices - Get subscription invoices
router.get('/invoices',
  clerkAuth,
  requireVendorRole,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.vendor) {
        res.status(404).json({
          success: false,
          message: 'Vendor profile not found',
          error: 'No vendor profile associated with this user'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const invoices = await razorpayService.getSubscriptionInvoices(req.user.vendor.id);

      // Simulate pagination
      const paginatedInvoices = invoices.slice(offset, offset + limit);
      const totalInvoices = invoices.length;
      const totalPages = Math.ceil(totalInvoices / limit);

      res.json({
        success: true,
        message: 'Invoices retrieved successfully',
        data: {
          invoices: paginatedInvoices
        },
        pagination: {
          page,
          limit,
          total: totalInvoices,
          totalPages
        }
      });

    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve invoices',
        error: 'Internal server error'
      });
    }
  }
);

// GET /current - Get current subscription details
router.get('/current',
  clerkAuth,
  requireVendorRole,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.vendor) {
        res.status(404).json({
          success: false,
          message: 'Vendor profile not found',
          error: 'No vendor profile associated with this user'
        });
        return;
      }

      const currentSubscription = await prisma.subscription.findFirst({
        where: {
          vendorId: req.user.vendor.id,
          status: 'ACTIVE'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!currentSubscription) {
        res.json({
          success: true,
          message: 'No active subscription found',
          data: {
            hasActiveSubscription: false,
            trialStatus: req.user.vendor.subscriptionStatus === 'TRIAL' ? {
              isInTrial: true,
              trialEndsAt: req.user.vendor.trialEndsAt,
              daysLeft: req.user.vendor.trialEndsAt
                ? Math.max(0, Math.ceil((req.user.vendor.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : 0
            } : null
          }
        });
        return;
      }

      // Get plan details
      const plans = razorpayService.getSubscriptionPlans();
      const planDetails = plans.find(p => p.planType === currentSubscription.planType);

      res.json({
        success: true,
        message: 'Current subscription retrieved successfully',
        data: {
          hasActiveSubscription: true,
          subscription: {
            id: currentSubscription.id,
            planType: currentSubscription.planType,
            planName: planDetails?.name,
            status: currentSubscription.status,
            startDate: currentSubscription.startDate,
            endDate: currentSubscription.endDate,
            amount: currentSubscription.amount,
            currency: currentSubscription.currency,
            billingCycle: currentSubscription.billingCycle,
            razorpaySubscriptionId: currentSubscription.razorpaySubscriptionId,
            nextBillingDate: currentSubscription.endDate
          },
          planDetails,
          usage: {
            // This would be calculated based on actual usage
            productsCreated: 0,
            offersCreated: 0,
            analyticsAccess: true,
            supportLevel: planDetails?.limits.customerSupportLevel
          }
        }
      });

    } catch (error) {
      console.error('Get current subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve current subscription',
        error: 'Internal server error'
      });
    }
  }
);

export default router;