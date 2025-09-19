import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { upiAutoPayService } from '../services/upiAutoPayService';
import { requireAuth } from '../middleware/auth';
import {
  paymentRateLimit,
  validateVendorEligibility,
  sanitizePaymentData,
  logPaymentAttempt,
  preventDuplicatePayments,
  setPaymentSecurityHeaders,
} from '../middleware/paymentSecurity';

const router = express.Router();
const prisma = new PrismaClient();

// Apply security headers to all UPI subscription routes
router.use(setPaymentSecurityHeaders);

/**
 * @route POST /api/upi-subscriptions/create
 * @desc Create UPI AutoPay recurring subscription
 * @access Private (Vendor)
 */
router.post(
  '/create',
  paymentRateLimit,
  requireAuth,
  sanitizePaymentData,
  logPaymentAttempt,
  preventDuplicatePayments,
  [
    body('vendorId').isString().notEmpty().withMessage('Vendor ID is required'),
    body('planType').isIn(['BASIC', 'STANDARD', 'PREMIUM']).withMessage('Valid plan type is required'),
    body('userEmail').isEmail().withMessage('Valid email is required'),
    body('userName').isString().notEmpty().withMessage('User name is required'),
    body('userPhone').optional().isMobilePhone('en-IN').withMessage('Valid Indian phone number required'),
  ],
  validateVendorEligibility,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { vendorId, planType, userEmail, userName, userPhone } = req.body;

      const result = await upiAutoPayService.createUPIAutoPaySubscription({
        vendorId,
        planType,
        userEmail,
        userName,
        userPhone,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.status(201).json({
        success: true,
        message: 'UPI AutoPay subscription created successfully',
        data: {
          subscription: result.subscription,
          razorpaySubscription: result.razorpaySubscription,
          customerId: result.customerId,
          checkoutUrl: result.checkoutUrl,
          instructions: {
            step1: 'Click on the checkout URL to set up UPI AutoPay',
            step2: 'Approve the UPI AutoPay mandate on your UPI app',
            step3: 'Your subscription will automatically renew every month',
            note: 'You can cancel anytime from your dashboard',
          },
        },
      });
    } catch (error) {
      console.error('UPI AutoPay subscription creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/upi-subscriptions/:subscriptionId/cancel
 * @desc Cancel UPI AutoPay subscription
 * @access Private (Vendor)
 */
router.post(
  '/:subscriptionId/cancel',
  requireAuth,
  [
    param('subscriptionId').isString().notEmpty().withMessage('Subscription ID is required'),
    body('cancelAtCycleEnd').optional().isBoolean().withMessage('Cancel at cycle end must be boolean'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { subscriptionId } = req.params;
      const { cancelAtCycleEnd = true } = req.body;

      const result = await upiAutoPayService.cancelUPIAutoPaySubscription(
        subscriptionId,
        cancelAtCycleEnd
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: cancelAtCycleEnd
          ? 'Subscription will be cancelled at the end of current billing cycle'
          : 'Subscription cancelled immediately',
        data: {
          subscription: result.subscription,
        },
      });
    } catch (error) {
      console.error('Cancel UPI AutoPay subscription error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/upi-subscriptions/:subscriptionId/pause
 * @desc Pause UPI AutoPay subscription
 * @access Private (Vendor)
 */
router.post(
  '/:subscriptionId/pause',
  requireAuth,
  [
    param('subscriptionId').isString().notEmpty().withMessage('Subscription ID is required'),
    body('pauseAt').optional().isInt({ min: Math.floor(Date.now() / 1000) }).withMessage('Valid future timestamp required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { subscriptionId } = req.params;
      const { pauseAt } = req.body;

      const result = await upiAutoPayService.pauseUPIAutoPaySubscription(subscriptionId, pauseAt);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Subscription paused successfully',
        data: {
          subscription: result.subscription,
        },
      });
    } catch (error) {
      console.error('Pause UPI AutoPay subscription error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/upi-subscriptions/:subscriptionId/resume
 * @desc Resume UPI AutoPay subscription
 * @access Private (Vendor)
 */
router.post(
  '/:subscriptionId/resume',
  requireAuth,
  [param('subscriptionId').isString().notEmpty().withMessage('Subscription ID is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { subscriptionId } = req.params;

      const result = await upiAutoPayService.resumeUPIAutoPaySubscription(subscriptionId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Subscription resumed successfully',
        data: {
          subscription: result.subscription,
        },
      });
    } catch (error) {
      console.error('Resume UPI AutoPay subscription error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/upi-subscriptions/:subscriptionId
 * @desc Get UPI AutoPay subscription details
 * @access Private (Vendor)
 */
router.get(
  '/:subscriptionId',
  requireAuth,
  [param('subscriptionId').isString().notEmpty().withMessage('Subscription ID is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { subscriptionId } = req.params;

      const result = await upiAutoPayService.getSubscriptionDetails(subscriptionId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          razorpaySubscription: result.razorpaySubscription,
          subscription: result.dbSubscription,
        },
      });
    } catch (error) {
      console.error('Get UPI AutoPay subscription error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/upi-subscriptions/vendor/:vendorId
 * @desc Get all UPI AutoPay subscriptions for a vendor
 * @access Private (Vendor)
 */
router.get(
  '/vendor/:vendorId',
  requireAuth,
  [
    param('vendorId').isString().notEmpty().withMessage('Vendor ID is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { vendorId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      // Get subscriptions from database
      const subscriptions = await prisma.subscription.findMany({
        where: { vendorId },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit as number,
        skip: offset as number,
      });

      const total = await prisma.subscription.count({
        where: { vendorId },
      });

      res.json({
        success: true,
        data: {
          subscriptions,
          total,
          hasMore: offset + subscriptions.length < total,
        },
      });
    } catch (error) {
      console.error('Get vendor subscriptions error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

export default router;