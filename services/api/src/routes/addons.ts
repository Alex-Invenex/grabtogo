import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AddonType } from '@prisma/client';
import { addonService } from '../services/addonService';
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

// Apply security headers to all addon routes
router.use(setPaymentSecurityHeaders);

/**
 * @route POST /api/addons/create-order
 * @desc Create Razorpay order for addon purchase
 * @access Private (Vendor)
 */
router.post(
  '/create-order',
  paymentRateLimit,
  requireAuth,
  sanitizePaymentData,
  logPaymentAttempt,
  preventDuplicatePayments,
  [
    body('vendorId').isString().notEmpty().withMessage('Vendor ID is required'),
    body('addonType').isIn(Object.values(AddonType)).withMessage('Valid addon type is required'),
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

      const { vendorId, addonType, userEmail, userName, userPhone } = req.body;

      const result = await addonService.createAddonOrder({
        vendorId,
        addonType,
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
        message: 'Addon order created successfully',
        data: {
          addon: result.addon,
          payment: result.payment,
          razorpayOrder: result.razorpayOrder,
          pricing: result.pricing,
          instructions: {
            step1: 'Complete the payment using Razorpay checkout',
            step2: 'Addon will be activated immediately after successful payment',
            note: `Valid for ${result.addon?.metadata?.validityDays || 30} days from activation`,
          },
        },
      });
    } catch (error) {
      console.error('Create addon order error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/addons/available/:vendorId
 * @desc Get available addons for a vendor
 * @access Private (Vendor)
 */
router.get(
  '/available/:vendorId',
  requireAuth,
  [param('vendorId').isString().notEmpty().withMessage('Vendor ID is required')],
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

      const result = await addonService.getAvailableAddons(vendorId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          availableAddons: result.availableAddons,
          activeAddons: result.activeAddons,
        },
      });
    } catch (error) {
      console.error('Get available addons error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/addons/use
 * @desc Use an addon (increment usage count)
 * @access Private (Vendor)
 */
router.post(
  '/use',
  requireAuth,
  [
    body('vendorId').isString().notEmpty().withMessage('Vendor ID is required'),
    body('addonType').isIn(Object.values(AddonType)).withMessage('Valid addon type is required'),
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

      const { vendorId, addonType } = req.body;

      const result = await addonService.useAddon(vendorId, addonType);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Addon used successfully',
        data: {
          addon: result.addon,
          remainingUsage: result.remainingUsage,
        },
      });
    } catch (error) {
      console.error('Use addon error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/addons/:addonId/cancel
 * @desc Cancel an addon
 * @access Private (Vendor)
 */
router.post(
  '/:addonId/cancel',
  requireAuth,
  [param('addonId').isString().notEmpty().withMessage('Addon ID is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { addonId } = req.params;
      const vendorId = req.body.vendorId || req.user?.vendorId;

      if (!vendorId) {
        return res.status(400).json({
          success: false,
          error: 'Vendor ID is required',
        });
      }

      const result = await addonService.cancelAddon(vendorId, addonId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Addon cancelled successfully',
        data: {
          addon: result.addon,
        },
      });
    } catch (error) {
      console.error('Cancel addon error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/addons/usage-stats/:vendorId
 * @desc Get addon usage statistics for a vendor
 * @access Private (Vendor)
 */
router.get(
  '/usage-stats/:vendorId',
  requireAuth,
  [param('vendorId').isString().notEmpty().withMessage('Vendor ID is required')],
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

      const result = await addonService.getAddonUsageStats(vendorId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          stats: result.stats,
          addons: result.addons,
        },
      });
    } catch (error) {
      console.error('Get addon usage stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

export default router;