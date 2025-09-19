import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { paymentService } from '../services/paymentService';
import { authenticateToken } from '../middleware/auth';
import {
  validatePaymentAmount,
  validateVendorEligibility,
  sanitizePaymentData,
  logPaymentAttempt,
  preventDuplicatePayments,
  setPaymentSecurityHeaders,
} from '../middleware/paymentSecurity';

const router = express.Router();

// Apply security headers to all payment routes
router.use(setPaymentSecurityHeaders);

/**
 * @route POST /api/payments/registration-fee
 * @desc Create registration fee payment
 * @access Private (Vendor)
 */
router.post(
  '/registration-fee',
  authenticateToken,
  sanitizePaymentData,
  logPaymentAttempt,
  preventDuplicatePayments,
  [
    body('vendorId').isString().notEmpty().withMessage('Vendor ID is required'),
    body('userEmail').isEmail().withMessage('Valid email is required'),
    body('userName').isString().notEmpty().withMessage('User name is required'),
  ],
  validateVendorEligibility,
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { vendorId, userEmail, userName } = req.body;

      const result = await paymentService.createRegistrationFeePayment({
        vendorId,
        userEmail,
        userName,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.status(201).json({
        success: true,
        data: {
          payment: result.payment,
          registrationFee: result.registrationFee,
          razorpayOrder: result.razorpayOrder,
        },
      });
    } catch (error) {
      console.error('Registration fee payment error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/payments/subscription
 * @desc Create subscription payment
 * @access Private (Vendor)
 */
router.post(
  '/subscription',
  authenticateToken,
  sanitizePaymentData,
  logPaymentAttempt,
  preventDuplicatePayments,
  [
    body('vendorId').isString().notEmpty().withMessage('Vendor ID is required'),
    body('planType').isIn(['BASIC', 'STANDARD', 'PREMIUM']).withMessage('Valid plan type is required'),
    body('userEmail').isEmail().withMessage('Valid email is required'),
    body('userName').isString().notEmpty().withMessage('User name is required'),
  ],
  validateVendorEligibility,
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { vendorId, planType, userEmail, userName } = req.body;

      const result = await paymentService.createSubscriptionPayment({
        vendorId,
        planType,
        userEmail,
        userName,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.status(201).json({
        success: true,
        data: {
          payment: result.payment,
          subscription: result.subscription,
          plan: result.plan,
          razorpayOrder: result.razorpayOrder,
        },
      });
    } catch (error) {
      console.error('Subscription payment error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/payments/verify
 * @desc Verify payment
 * @access Private
 */
router.post(
  '/verify',
  authenticateToken,
  [
    body('razorpayOrderId').isString().notEmpty().withMessage('Razorpay Order ID is required'),
    body('razorpayPaymentId').isString().notEmpty().withMessage('Razorpay Payment ID is required'),
    body('razorpaySignature').isString().notEmpty().withMessage('Razorpay Signature is required'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      const result = await paymentService.verifyPayment(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          payment: result.payment,
        },
      });
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/payments/history
 * @desc Get payment history
 * @access Private
 */
router.get(
  '/history',
  authenticateToken,
  [
    query('vendorId').optional().isString(),
    query('customerId').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { vendorId, customerId, limit = 10, offset = 0 } = req.query;

      const result = await paymentService.getPaymentHistory(
        vendorId as string,
        customerId as string,
        limit as number,
        offset as number
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          payments: result.payments,
          total: result.total,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/payments/:paymentId/refund
 * @desc Process refund
 * @access Private (Admin only)
 */
router.post(
  '/:paymentId/refund',
  authenticateToken,
  // TODO: Add admin role check middleware
  [
    param('paymentId').isString().notEmpty().withMessage('Payment ID is required'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { paymentId } = req.params;
      const { amount, reason } = req.body;

      const result = await paymentService.processRefund(paymentId, amount, reason);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          refund: result.refund,
        },
      });
    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/payments/subscription-plans
 * @desc Get subscription plans
 * @access Public
 */
router.get('/subscription-plans', async (req, res) => {
  try {
    const result = await paymentService.getSubscriptionPlans();

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        plans: result.plans,
      },
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route GET /api/payments/:paymentId
 * @desc Get payment details
 * @access Private
 */
router.get(
  '/:paymentId',
  authenticateToken,
  [param('paymentId').isString().notEmpty().withMessage('Payment ID is required')],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { paymentId } = req.params;

      // TODO: Implement getPaymentById in paymentService
      // For now, return a placeholder response
      res.json({
        success: true,
        message: 'Payment details endpoint - to be implemented',
        paymentId,
      });
    } catch (error) {
      console.error('Get payment details error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

export default router;