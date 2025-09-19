import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { featureService } from '../services/featureService';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/features/status/:vendorId
 * @desc Get comprehensive feature status for a vendor
 * @access Private (Vendor)
 */
router.get(
  '/status/:vendorId',
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

      const result = await featureService.getVendorFeatureStatus(vendorId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: result.featureStatus,
      });
    } catch (error) {
      console.error('Get feature status error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/features/check-action
 * @desc Check if vendor can perform a specific action
 * @access Private (Vendor)
 */
router.post(
  '/check-action',
  requireAuth,
  [
    body('vendorId').isString().notEmpty().withMessage('Vendor ID is required'),
    body('action').isString().notEmpty().withMessage('Action is required'),
    body('additionalData').optional().isObject(),
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

      const { vendorId, action, additionalData } = req.body;

      const canPerform = await featureService.canPerformAction(vendorId, action, additionalData);

      res.json({
        success: true,
        data: {
          canPerform,
          action,
          vendorId,
        },
      });
    } catch (error) {
      console.error('Check action error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/features/gallery-limits/:vendorId
 * @desc Check gallery image limits for a vendor
 * @access Private (Vendor)
 */
router.get(
  '/gallery-limits/:vendorId',
  requireAuth,
  [
    param('vendorId').isString().notEmpty().withMessage('Vendor ID is required'),
    query('currentCount').optional().isInt({ min: 0 }).toInt(),
    query('additionalCount').optional().isInt({ min: 1 }).toInt(),
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
      const { currentCount = 0, additionalCount = 1 } = req.query;

      const canAdd = await featureService.canAddGalleryImages(
        vendorId,
        currentCount as number,
        additionalCount as number
      );

      const limits = await featureService.getVendorFeatureLimits(vendorId);

      res.json({
        success: true,
        data: {
          canAdd,
          currentCount,
          additionalCount,
          limits: limits?.galleryImages || 'N/A',
        },
      });
    } catch (error) {
      console.error('Get gallery limits error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/features/status-update-limits/:vendorId
 * @desc Check status update limits for a vendor
 * @access Private (Vendor)
 */
router.get(
  '/status-update-limits/:vendorId',
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

      const canCreate = await featureService.canCreateStatusUpdate(vendorId);
      const limits = await featureService.getVendorFeatureLimits(vendorId);

      res.json({
        success: true,
        data: {
          canCreate,
          dailyLimit: limits?.statusUpdatesPerDay || 'N/A',
        },
      });
    } catch (error) {
      console.error('Get status update limits error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/features/feature-listing/:vendorId
 * @desc Check feature listing eligibility for a vendor
 * @access Private (Vendor)
 */
router.get(
  '/feature-listing/:vendorId',
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

      const eligibility = await featureService.getFeatureListingEligibility(vendorId);

      res.json({
        success: true,
        data: eligibility,
      });
    } catch (error) {
      console.error('Get feature listing eligibility error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/features/analytics-level/:vendorId
 * @desc Get analytical dashboard level for a vendor
 * @access Private (Vendor)
 */
router.get(
  '/analytics-level/:vendorId',
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

      const level = await featureService.getAnalyticalDashboardLevel(vendorId);

      if (!level) {
        return res.status(404).json({
          success: false,
          error: 'No active subscription found',
        });
      }

      res.json({
        success: true,
        data: {
          level,
          features: {
            basic: ['Basic metrics', 'Order tracking', 'Customer count'],
            extended: ['Advanced metrics', 'Revenue analytics', 'Customer insights', 'Performance trends'],
            professional: ['Complete analytics suite', 'Predictive insights', 'Custom reports', 'Export capabilities', 'Real-time data'],
          },
        },
      });
    } catch (error) {
      console.error('Get analytics level error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/features/module-access/:vendorId
 * @desc Check access to specific modules (video, social ads, campaigns, etc.)
 * @access Private (Vendor)
 */
router.get(
  '/module-access/:vendorId',
  requireAuth,
  [
    param('vendorId').isString().notEmpty().withMessage('Vendor ID is required'),
    query('modules').optional().isString(),
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
      const { modules } = req.query;

      const requestedModules = modules ? (modules as string).split(',') : [
        'video',
        'socialAds',
        'campaigns',
        'whatsappBlast',
        'futureDev'
      ];

      const moduleAccess: Record<string, boolean> = {};

      for (const module of requestedModules) {
        switch (module.trim()) {
          case 'video':
            moduleAccess.video = await featureService.canUseVideoModule(vendorId);
            break;
          case 'socialAds':
            moduleAccess.socialAds = await featureService.canUseSocialMediaAds(vendorId);
            break;
          case 'campaigns':
            moduleAccess.campaigns = await featureService.canUseCampaigns(vendorId);
            break;
          case 'whatsappBlast':
            moduleAccess.whatsappBlast = await featureService.canUseWhatsAppEmailBlast(vendorId);
            break;
          case 'futureDev':
            moduleAccess.futureDev = await featureService.canUseFutureDevAccess(vendorId);
            break;
          default:
            moduleAccess[module] = false;
        }
      }

      res.json({
        success: true,
        data: {
          moduleAccess,
          requestedModules,
        },
      });
    } catch (error) {
      console.error('Get module access error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

export default router;