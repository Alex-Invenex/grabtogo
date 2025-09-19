import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { referralService } from '../services/referralService';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/referrals/create
 * @desc Create a new referral
 * @access Private (Vendor)
 */
router.post(
  '/create',
  requireAuth,
  [
    body('referrerVendorId').isString().notEmpty().withMessage('Referrer vendor ID is required'),
    body('referredEmail').isEmail().withMessage('Valid referred email is required'),
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

      const { referrerVendorId, referredEmail } = req.body;

      const result = await referralService.createReferral({
        referrerVendorId,
        referredEmail,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.status(201).json({
        success: true,
        message: result.message || 'Referral created successfully',
        data: {
          referral: result.referral,
          referralLink: result.referralLink,
          instructions: {
            step1: 'Share the referral link with your contact',
            step2: 'They will sign up using your referral code',
            step3: 'You earn 10% commission on their first payment',
            note: 'Commission is paid automatically after their first successful payment',
          },
        },
      });
    } catch (error) {
      console.error('Create referral error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/referrals/validate/:referralCode
 * @desc Validate a referral code during signup
 * @access Public
 */
router.get(
  '/validate/:referralCode',
  [param('referralCode').isString().notEmpty().withMessage('Referral code is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { referralCode } = req.params;

      const result = await referralService.getReferralByCode(referralCode);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          referral: result.referral,
          referrerInfo: result.referrerInfo,
          message: `You've been referred by ${result.referrerInfo?.companyName}! You'll help them earn a commission when you make your first payment.`,
        },
      });
    } catch (error) {
      console.error('Validate referral code error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/referrals/process-signup
 * @desc Process referral when a referred user signs up
 * @access Private
 */
router.post(
  '/process-signup',
  requireAuth,
  [
    body('referralCode').isString().notEmpty().withMessage('Referral code is required'),
    body('referredVendorId').isString().notEmpty().withMessage('Referred vendor ID is required'),
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

      const { referralCode, referredVendorId } = req.body;

      const result = await referralService.processReferralSignup({
        referralCode,
        referredVendorId,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: result.message,
        data: {
          referral: result.referral,
        },
      });
    } catch (error) {
      console.error('Process referral signup error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/referrals/:referralId/pay-commission
 * @desc Calculate and pay commission for a successful referral
 * @access Private (Admin/System)
 */
router.post(
  '/:referralId/pay-commission',
  requireAuth,
  [
    param('referralId').isString().notEmpty().withMessage('Referral ID is required'),
    body('referredVendorFirstPayment').isFloat({ min: 0 }).withMessage('Valid payment amount is required'),
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

      const { referralId } = req.params;
      const { referredVendorFirstPayment } = req.body;

      const result = await referralService.calculateAndPayCommission(
        referralId,
        referredVendorFirstPayment
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: result.message,
        data: {
          referral: result.referral,
          commissionAmount: result.commissionAmount,
        },
      });
    } catch (error) {
      console.error('Pay commission error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/referrals/stats/:vendorId
 * @desc Get referral statistics for a vendor
 * @access Private (Vendor)
 */
router.get(
  '/stats/:vendorId',
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

      const result = await referralService.getReferralStats(vendorId);

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
          referrals: result.referrals,
        },
      });
    } catch (error) {
      console.error('Get referral stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/referrals/vendor/:vendorId
 * @desc Get all referrals for a vendor (both made and received)
 * @access Private (Vendor)
 */
router.get(
  '/vendor/:vendorId',
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

      const result = await referralService.getAllReferralsForVendor(vendorId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          referralsMade: result.referralsMade,
          referralsReceived: result.referralsReceived,
        },
      });
    } catch (error) {
      console.error('Get all referrals for vendor error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

export default router;