import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Rate limiting for payment endpoints
 */
export const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 payment requests per windowMs
  message: {
    success: false,
    error: 'Too many payment requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to include user identification
  keyGenerator: (req: Request) => {
    const userId = req.user?.id || req.ip;
    return `payment_${userId}`;
  },
});

/**
 * Rate limiting for webhook endpoints
 */
export const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // allow more webhook requests as they come from Razorpay
  message: {
    success: false,
    error: 'Too many webhook requests.',
  },
  standardHeaders: false,
  legacyHeaders: false,
});

/**
 * Validate payment amount to prevent manipulation
 */
export const validatePaymentAmount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { paymentType, planType, vendorId } = req.body;

    // Define valid amounts for different payment types
    const validAmounts: Record<string, number> = {
      REGISTRATION_FEE: 352.82, // ₹299 + 18% GST
    };

    // For subscription payments, validate against database plans
    if (paymentType === 'SUBSCRIPTION' && planType) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { planType },
      });

      if (!plan) {
        return res.status(400).json({
          success: false,
          error: 'Invalid subscription plan',
        });
      }

      // Calculate expected amount with GST
      const expectedAmount = Math.round((plan.price * 1.18) * 100) / 100;
      validAmounts.SUBSCRIPTION = expectedAmount;
    }

    // Store expected amount in request for later validation
    req.expectedAmount = validAmounts[paymentType];

    if (!req.expectedAmount) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment type',
      });
    }

    next();
  } catch (error) {
    console.error('Payment amount validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Validate vendor eligibility for payments
 */
export const validateVendorEligibility = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { vendorId, paymentType } = req.body;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required',
      });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        registrationFee: true,
        subscriptions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found',
      });
    }

    // Check vendor is active
    if (!vendor.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Vendor account is inactive',
      });
    }

    // Validate based on payment type
    if (paymentType === 'REGISTRATION_FEE') {
      // Check if registration fee already paid
      if (vendor.registrationFeePaid) {
        return res.status(400).json({
          success: false,
          error: 'Registration fee already paid',
        });
      }
    }

    if (paymentType === 'SUBSCRIPTION') {
      // Check if registration fee is paid first
      if (!vendor.registrationFeePaid) {
        return res.status(400).json({
          success: false,
          error: 'Registration fee must be paid before subscribing',
        });
      }

      // Check for existing active subscription
      const activeSubscription = vendor.subscriptions[0];
      if (activeSubscription && activeSubscription.status === 'ACTIVE') {
        const endDate = new Date(activeSubscription.endDate || 0);
        if (endDate > new Date()) {
          return res.status(400).json({
            success: false,
            error: 'Active subscription already exists',
          });
        }
      }
    }

    // Store vendor data in request for later use
    req.vendor = vendor;
    next();
  } catch (error) {
    console.error('Vendor eligibility validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Sanitize payment data to prevent injection attacks
 */
export const sanitizePaymentData = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sensitiveFields = ['razorpayPaymentId', 'razorpaySignature'];

  // Remove potentially harmful characters from sensitive fields
  sensitiveFields.forEach(field => {
    if (req.body[field]) {
      // Only allow alphanumeric characters, hyphens, and underscores
      req.body[field] = req.body[field].replace(/[^a-zA-Z0-9\-_]/g, '');
    }
  });

  // Validate email format if present
  if (req.body.userEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.userEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }
  }

  // Validate phone format if present
  if (req.body.userPhone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(req.body.userPhone.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone format',
      });
    }
  }

  next();
};

/**
 * Log payment attempts for audit trail
 */
export const logPaymentAttempt = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logData = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.originalUrl,
    vendorId: req.body.vendorId,
    paymentType: req.body.paymentType,
    userId: req.user?.id,
  };

  // In production, you might want to use a dedicated logging service
  console.log('Payment attempt:', logData);

  // Store in audit log (implement as needed)
  // await auditLogger.log('payment_attempt', logData);

  next();
};

/**
 * Prevent duplicate payment requests
 */
export const preventDuplicatePayments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { vendorId, paymentType } = req.body;

    // Create a unique key for this payment request
    const requestKey = `${vendorId}_${paymentType}_${Date.now()}`;

    // Check for recent similar requests (within last 5 minutes)
    const recentPayment = await prisma.payment.findFirst({
      where: {
        vendorId,
        paymentType,
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        },
      },
    });

    if (recentPayment) {
      return res.status(400).json({
        success: false,
        error: 'A similar payment request is already being processed. Please wait.',
      });
    }

    // Store request key for tracking
    req.paymentRequestKey = requestKey;
    next();
  } catch (error) {
    console.error('Duplicate payment prevention error:', error);
    next(); // Continue on error to not block legitimate requests
  }
};

/**
 * Validate webhook signature for security
 */
export const validateWebhookSignature = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing webhook signature',
      });
    }

    const body = req.body.toString();
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return res.status(500).json({
        success: false,
        error: 'Webhook configuration error',
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook signature',
      });
    }

    next();
  } catch (error) {
    console.error('Webhook signature validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook validation error',
    });
  }
};

/**
 * Security headers for payment endpoints
 */
export const setPaymentSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Prevent caching of payment pages
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
};

export {
  paymentRateLimit,
  webhookRateLimit,
  validatePaymentAmount,
  validateVendorEligibility,
  sanitizePaymentData,
  logPaymentAttempt,
  preventDuplicatePayments,
  validateWebhookSignature,
  setPaymentSecurityHeaders,
};