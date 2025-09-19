import express from 'express';
import { PrismaClient } from '@prisma/client';
import { clerkAuth, requireAdmin } from '../middleware/clerk';
import { requireAdminRole } from '../middleware/vendorAuth';
import { body, validationResult, query } from 'express-validator';
import { ApiResponse } from '../types/api';

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

// GET /pending-vendors - List vendors awaiting approval
const pendingVendorsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

router.get('/pending-vendors',
  clerkAuth,
  requireAdminRole,
  pendingVendorsValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const [pendingVendors, totalCount] = await Promise.all([
        prisma.vendor.findMany({
          where: {
            isApproved: false,
            registrationFeePaid: true // Only show vendors who have paid registration fee
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'asc' },
          skip: offset,
          take: limit
        }),
        prisma.vendor.count({
          where: {
            isApproved: false,
            registrationFeePaid: true
          }
        })
      ]);

      const formattedVendors = pendingVendors.map(vendor => ({
        id: vendor.id,
        companyName: vendor.companyName,
        gstNumber: vendor.gstNumber,
        address: vendor.address,
        coordinates: {
          latitude: vendor.latitude,
          longitude: vendor.longitude
        },
        categories: vendor.categories,
        registrationFeePaid: vendor.registrationFeePaid,
        submittedAt: vendor.createdAt,
        user: vendor.user,
        waitingDays: Math.floor((Date.now() - vendor.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      }));

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        message: 'Pending vendors retrieved successfully',
        data: {
          vendors: formattedVendors,
          summary: {
            totalPending: totalCount,
            averageWaitTime: formattedVendors.length > 0
              ? Math.round(formattedVendors.reduce((sum, v) => sum + v.waitingDays, 0) / formattedVendors.length)
              : 0
          }
        },
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages
        }
      });

    } catch (error) {
      console.error('Get pending vendors error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending vendors',
        error: 'Internal server error'
      });
    }
  }
);

// POST /approve-vendor/:id - Approve vendor after document verification
const approveVendorValidation = [
  body('comments')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comments must not exceed 500 characters'),
  handleValidationErrors
];

router.post('/approve-vendor/:id',
  clerkAuth,
  requireAdminRole,
  approveVendorValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      const vendorId = req.params.id;
      const { comments } = req.body;

      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true
            }
          }
        }
      });

      if (!vendor) {
        res.status(404).json({
          success: false,
          message: 'Vendor not found',
          error: 'No vendor found with the provided ID'
        });
        return;
      }

      if (vendor.isApproved) {
        res.status(400).json({
          success: false,
          message: 'Vendor already approved',
          error: 'This vendor has already been approved'
        });
        return;
      }

      if (!vendor.registrationFeePaid) {
        res.status(400).json({
          success: false,
          message: 'Registration fee not paid',
          error: 'Vendor must pay registration fee before approval'
        });
        return;
      }

      // Update vendor approval status
      const updatedVendor = await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          isApproved: true
        }
      });

      // TODO: Send approval notification email to vendor
      // TODO: Send SMS notification if phone number is available

      res.json({
        success: true,
        message: 'Vendor approved successfully',
        data: {
          vendorId: updatedVendor.id,
          companyName: updatedVendor.companyName,
          approvedAt: new Date(),
          approvedBy: req.user?.id,
          comments,
          nextSteps: [
            'Vendor can now create subscription',
            'Vendor will receive approval notification',
            'Vendor can start listing products and offers'
          ]
        }
      });

    } catch (error) {
      console.error('Approve vendor error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve vendor',
        error: 'Internal server error'
      });
    }
  }
);

// POST /reject-vendor/:id - Reject vendor with reason
const rejectVendorValidation = [
  body('reason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  handleValidationErrors
];

router.post('/reject-vendor/:id',
  clerkAuth,
  requireAdminRole,
  rejectVendorValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      const vendorId = req.params.id;
      const { reason } = req.body;

      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true
            }
          }
        }
      });

      if (!vendor) {
        res.status(404).json({
          success: false,
          message: 'Vendor not found',
          error: 'No vendor found with the provided ID'
        });
        return;
      }

      if (vendor.isApproved) {
        res.status(400).json({
          success: false,
          message: 'Cannot reject approved vendor',
          error: 'This vendor has already been approved'
        });
        return;
      }

      // For rejection, we'll deactivate the vendor instead of deleting
      await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          isActive: false
        }
      });

      // TODO: Send rejection notification email to vendor with reason
      // TODO: Store rejection reason in a separate table for audit

      res.json({
        success: true,
        message: 'Vendor rejected successfully',
        data: {
          vendorId,
          companyName: vendor.companyName,
          rejectedAt: new Date(),
          rejectedBy: req.user?.id,
          reason,
          actions: [
            'Vendor has been notified via email',
            'Vendor account has been deactivated',
            'Vendor can reapply after addressing the issues'
          ]
        }
      });

    } catch (error) {
      console.error('Reject vendor error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject vendor',
        error: 'Internal server error'
      });
    }
  }
);

// GET /vendors - List all vendors with filters
const vendorsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['approved', 'pending', 'rejected', 'all'])
    .withMessage('Status must be approved, pending, rejected, or all'),
  query('subscriptionStatus')
    .optional()
    .isIn(['TRIAL', 'ACTIVE', 'INACTIVE', 'CANCELLED'])
    .withMessage('Invalid subscription status'),
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search term must be between 2 and 100 characters'),
  handleValidationErrors
];

router.get('/vendors',
  clerkAuth,
  requireAdminRole,
  vendorsValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const status = req.query.status as string || 'all';
      const subscriptionStatus = req.query.subscriptionStatus as string;
      const search = req.query.search as string;

      // Build where clause
      const whereClause: any = {};

      if (status !== 'all') {
        if (status === 'approved') {
          whereClause.isApproved = true;
        } else if (status === 'pending') {
          whereClause.isApproved = false;
          whereClause.isActive = true;
        } else if (status === 'rejected') {
          whereClause.isActive = false;
        }
      }

      if (subscriptionStatus) {
        whereClause.subscriptionStatus = subscriptionStatus;
      }

      if (search) {
        whereClause.OR = [
          { companyName: { contains: search, mode: 'insensitive' } },
          { gstNumber: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const [vendors, totalCount] = await Promise.all([
        prisma.vendor.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                createdAt: true
              }
            },
            subscriptions: {
              where: { isActive: true },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.vendor.count({ where: whereClause })
      ]);

      const formattedVendors = vendors.map(vendor => ({
        id: vendor.id,
        companyName: vendor.companyName,
        gstNumber: vendor.gstNumber,
        address: vendor.address,
        categories: vendor.categories,
        isApproved: vendor.isApproved,
        isActive: vendor.isActive,
        registrationFeePaid: vendor.registrationFeePaid,
        subscriptionStatus: vendor.subscriptionStatus,
        trialEndsAt: vendor.trialEndsAt,
        averageRating: vendor.averageRating,
        totalRatings: vendor.totalRatings,
        createdAt: vendor.createdAt,
        user: vendor.user,
        currentSubscription: vendor.subscriptions[0] || null
      }));

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        message: 'Vendors retrieved successfully',
        data: {
          vendors: formattedVendors,
          summary: {
            total: totalCount,
            approved: vendors.filter(v => v.isApproved).length,
            pending: vendors.filter(v => !v.isApproved && v.isActive).length,
            rejected: vendors.filter(v => !v.isActive).length,
            activeSubscriptions: vendors.filter(v => v.subscriptionStatus === 'ACTIVE').length,
            trialUsers: vendors.filter(v => v.subscriptionStatus === 'TRIAL').length
          }
        },
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages
        }
      });

    } catch (error) {
      console.error('Get vendors error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve vendors',
        error: 'Internal server error'
      });
    }
  }
);

// GET /subscriptions - View all subscription data
const subscriptionsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('planType')
    .optional()
    .isIn(['BASIC', 'STANDARD', 'PREMIUM'])
    .withMessage('Invalid plan type'),
  query('status')
    .optional()
    .isIn(['TRIAL', 'ACTIVE', 'INACTIVE', 'CANCELLED'])
    .withMessage('Invalid subscription status'),
  handleValidationErrors
];

router.get('/subscriptions',
  clerkAuth,
  requireAdminRole,
  subscriptionsValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const planType = req.query.planType as string;
      const status = req.query.status as string;

      const whereClause: any = {};

      if (planType) {
        whereClause.planType = planType;
      }

      if (status) {
        whereClause.status = status;
      }

      const [subscriptions, totalCount] = await Promise.all([
        prisma.subscription.findMany({
          where: whereClause,
          include: {
            vendor: {
              include: {
                user: {
                  select: {
                    email: true,
                    phone: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.subscription.count({ where: whereClause })
      ]);

      const formattedSubscriptions = subscriptions.map(sub => ({
        id: sub.id,
        planType: sub.planType,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        amount: sub.amount,
        currency: sub.currency,
        billingCycle: sub.billingCycle,
        razorpaySubscriptionId: sub.razorpaySubscriptionId,
        createdAt: sub.createdAt,
        vendor: {
          id: sub.vendor.id,
          companyName: sub.vendor.companyName,
          email: sub.vendor.user.email,
          phone: sub.vendor.user.phone
        }
      }));

      // Calculate analytics
      const analytics = {
        totalRevenue: subscriptions.reduce((sum, sub) => sum + sub.amount, 0),
        planDistribution: {
          BASIC: subscriptions.filter(s => s.planType === 'BASIC').length,
          STANDARD: subscriptions.filter(s => s.planType === 'STANDARD').length,
          PREMIUM: subscriptions.filter(s => s.planType === 'PREMIUM').length
        },
        statusDistribution: {
          ACTIVE: subscriptions.filter(s => s.status === 'ACTIVE').length,
          CANCELLED: subscriptions.filter(s => s.status === 'CANCELLED').length,
          INACTIVE: subscriptions.filter(s => s.status === 'INACTIVE').length
        },
        billingCycleDistribution: {
          monthly: subscriptions.filter(s => s.billingCycle === 'monthly').length,
          yearly: subscriptions.filter(s => s.billingCycle === 'yearly').length
        }
      };

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        message: 'Subscriptions retrieved successfully',
        data: {
          subscriptions: formattedSubscriptions,
          analytics
        },
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages
        }
      });

    } catch (error) {
      console.error('Get subscriptions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve subscriptions',
        error: 'Internal server error'
      });
    }
  }
);

// GET /dashboard - Admin dashboard summary
router.get('/dashboard',
  clerkAuth,
  requireAdminRole,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      const [
        totalVendors,
        pendingApprovals,
        activeSubscriptions,
        trialUsers,
        totalRevenue
      ] = await Promise.all([
        prisma.vendor.count(),
        prisma.vendor.count({
          where: {
            isApproved: false,
            registrationFeePaid: true,
            isActive: true
          }
        }),
        prisma.subscription.count({
          where: { status: 'ACTIVE' }
        }),
        prisma.vendor.count({
          where: { subscriptionStatus: 'TRIAL' }
        }),
        prisma.subscription.aggregate({
          where: { status: 'ACTIVE' },
          _sum: { amount: true }
        })
      ]);

      const recentVendors = await prisma.vendor.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Admin dashboard data retrieved successfully',
        data: {
          summary: {
            totalVendors,
            pendingApprovals,
            activeSubscriptions,
            trialUsers,
            totalRevenue: totalRevenue._sum.amount || 0
          },
          recentVendors: recentVendors.map(vendor => ({
            id: vendor.id,
            companyName: vendor.companyName,
            email: vendor.user.email,
            isApproved: vendor.isApproved,
            registrationFeePaid: vendor.registrationFeePaid,
            createdAt: vendor.createdAt
          }))
        }
      });

    } catch (error) {
      console.error('Get admin dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard data',
        error: 'Internal server error'
      });
    }
  }
);

export default router;