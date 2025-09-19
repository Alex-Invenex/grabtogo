import express from 'express';
import { PrismaClient } from '@prisma/client';
import { clerkAuth, requireVendor } from '../middleware/clerk';
import {
  requireVendorRole,
  requireApprovedVendor,
  requireRegistrationFeePaid,
  requireBasicVendorAccess
} from '../middleware/vendorAuth';
import { body, validationResult } from 'express-validator';
import { ApiResponse } from '../types/api';
import { VendorProfile, UpdateVendorProfileRequest, BusinessHours } from '../types/vendor';
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

// GET /profile - Get vendor profile with subscription status
router.get('/profile', clerkAuth, requireVendor, async (req, res: express.Response<ApiResponse>) => {
  try {
    if (!req.user?.vendor) {
      res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
        error: 'No vendor profile associated with this user'
      });
      return;
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: req.user.vendor.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true
          }
        },
        subscriptions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!vendor) {
      res.status(404).json({
        success: false,
        message: 'Vendor not found',
        error: 'Vendor profile does not exist'
      });
      return;
    }

    // Check trial status
    const now = new Date();
    const trialEnded = vendor.trialEndsAt ? now > vendor.trialEndsAt : false;
    const daysLeftInTrial = vendor.trialEndsAt
      ? Math.max(0, Math.ceil((vendor.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const profileData: VendorProfile = {
      id: vendor.id,
      companyName: vendor.companyName,
      gstNumber: vendor.gstNumber || undefined,
      address: vendor.address,
      latitude: vendor.latitude || undefined,
      longitude: vendor.longitude || undefined,
      subscriptionStatus: vendor.subscriptionStatus,
      trialEndsAt: vendor.trialEndsAt || undefined,
      isApproved: vendor.isApproved,
      registrationFeePaid: vendor.registrationFeePaid,
      averageRating: vendor.averageRating || undefined,
      totalRatings: vendor.totalRatings,
      isActive: vendor.isActive,
      businessHours: vendor.businessHours ? vendor.businessHours as unknown as BusinessHours : undefined,
      categories: vendor.categories,
      subscription: vendor.subscriptions[0] ? {
        id: vendor.subscriptions[0].id,
        planType: vendor.subscriptions[0].planType,
        status: vendor.subscriptions[0].status,
        startDate: vendor.subscriptions[0].startDate,
        endDate: vendor.subscriptions[0].endDate || undefined,
        amount: vendor.subscriptions[0].amount,
        currency: vendor.subscriptions[0].currency,
        billingCycle: vendor.subscriptions[0].billingCycle,
        razorpaySubscriptionId: vendor.subscriptions[0].razorpaySubscriptionId || undefined,
        autoRenewal: true
      } : undefined
    };

    res.json({
      success: true,
      message: 'Vendor profile retrieved successfully',
      data: {
        profile: profileData,
        user: vendor.user,
        trialStatus: {
          isInTrial: vendor.subscriptionStatus === 'TRIAL',
          trialEnded,
          daysLeft: daysLeftInTrial
        },
        onboardingStatus: {
          registrationFeePaid: vendor.registrationFeePaid,
          isApproved: vendor.isApproved,
          hasActiveSubscription: vendor.subscriptionStatus === 'ACTIVE',
          nextStep: !vendor.registrationFeePaid
            ? 'PAY_REGISTRATION_FEE'
            : !vendor.isApproved
            ? 'AWAIT_APPROVAL'
            : vendor.subscriptionStatus !== 'ACTIVE'
            ? 'CHOOSE_SUBSCRIPTION'
            : 'COMPLETE'
        }
      }
    });

  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendor profile',
      error: 'Internal server error'
    });
  }
});

// PUT /profile - Update vendor details
const updateProfileValidation = [
  body('companyName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('gstNumber')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GST number format'),
  body('address')
    .optional()
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be between 10 and 200 characters'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array')
    .custom((categories) => {
      if (categories && categories.length > 10) {
        throw new Error('Maximum 10 categories allowed');
      }
      return true;
    }),
  handleValidationErrors
];

router.put('/profile', clerkAuth, requireVendor, updateProfileValidation, async (req: express.Request, res: express.Response<ApiResponse>) => {
  try {
    if (!req.user?.vendor) {
      res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
        error: 'No vendor profile associated with this user'
      });
      return;
    }

    const updateData: UpdateVendorProfileRequest = req.body;

    const updatedVendor = await prisma.vendor.update({
      where: { id: req.user.vendor.id },
      data: {
        ...(updateData.companyName && { companyName: updateData.companyName }),
        ...(updateData.gstNumber && { gstNumber: updateData.gstNumber }),
        ...(updateData.address && { address: updateData.address }),
        ...(updateData.latitude !== undefined && { latitude: updateData.latitude }),
        ...(updateData.longitude !== undefined && { longitude: updateData.longitude }),
        ...(updateData.businessHours && { businessHours: updateData.businessHours as any }),
        ...(updateData.categories && { categories: updateData.categories })
      }
    });

    res.json({
      success: true,
      message: 'Vendor profile updated successfully',
      data: {
        id: updatedVendor.id,
        companyName: updatedVendor.companyName,
        gstNumber: updatedVendor.gstNumber,
        address: updatedVendor.address,
        latitude: updatedVendor.latitude,
        longitude: updatedVendor.longitude,
        businessHours: updatedVendor.businessHours,
        categories: updatedVendor.categories
      }
    });

  } catch (error) {
    console.error('Update vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor profile',
      error: 'Internal server error'
    });
  }
});

// POST /verify-documents - Upload and submit documents for admin approval
router.post('/verify-documents', clerkAuth, requireVendor, async (req, res: express.Response<ApiResponse>) => {
  try {
    // This is a placeholder for document upload functionality
    // In a real implementation, you would:
    // 1. Handle file uploads (using multer middleware)
    // 2. Upload files to AWS S3 or similar storage
    // 3. Store document metadata in database
    // 4. Trigger admin notification

    res.json({
      success: true,
      message: 'Document verification feature coming soon',
      data: {
        supportedDocuments: [
          'GST Certificate',
          'Business License',
          'FSSAI License',
          'Bank Statement',
          'Identity Proof',
          'Address Proof'
        ],
        uploadInstructions: [
          'Documents should be clear and readable',
          'Supported formats: PDF, JPG, PNG',
          'Maximum file size: 5MB per document',
          'Ensure all details are visible'
        ]
      }
    });

  } catch (error) {
    console.error('Document verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process document verification',
      error: 'Internal server error'
    });
  }
});

// GET /subscription-status - Check current subscription and trial status
router.get('/subscription-status', clerkAuth, requireVendor, async (req, res: express.Response<ApiResponse>) => {
  try {
    if (!req.user?.vendor) {
      res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
        error: 'No vendor profile associated with this user'
      });
      return;
    }

    const vendor = req.user.vendor;
    const now = new Date();

    // Get active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        vendorId: vendor.id,
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate trial status
    const trialEnded = vendor.trialEndsAt ? now > vendor.trialEndsAt : false;
    const daysLeftInTrial = vendor.trialEndsAt
      ? Math.max(0, Math.ceil((vendor.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    // Get subscription plans for reference
    const availablePlans = razorpayService.getSubscriptionPlans();

    res.json({
      success: true,
      message: 'Subscription status retrieved successfully',
      data: {
        currentStatus: vendor.subscriptionStatus,
        trialStatus: {
          isInTrial: vendor.subscriptionStatus === 'TRIAL',
          trialEndsAt: vendor.trialEndsAt,
          trialEnded,
          daysLeft: daysLeftInTrial
        },
        activeSubscription: activeSubscription ? {
          id: activeSubscription.id,
          planType: activeSubscription.planType,
          status: activeSubscription.status,
          startDate: activeSubscription.startDate,
          endDate: activeSubscription.endDate,
          amount: activeSubscription.amount,
          currency: activeSubscription.currency,
          billingCycle: activeSubscription.billingCycle,
          razorpaySubscriptionId: activeSubscription.razorpaySubscriptionId
        } : null,
        availablePlans,
        canUpgrade: vendor.subscriptionStatus === 'TRIAL' || vendor.subscriptionStatus === 'ACTIVE',
        requiresPayment: vendor.subscriptionStatus === 'INACTIVE' || vendor.subscriptionStatus === 'CANCELLED' || trialEnded
      }
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscription status',
      error: 'Internal server error'
    });
  }
});

// POST /pay-registration-fee - Initiate registration fee payment
router.post('/pay-registration-fee', clerkAuth, requireVendor, async (req, res: express.Response<ApiResponse>) => {
  try {
    if (!req.user?.vendor) {
      res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
        error: 'No vendor profile associated with this user'
      });
      return;
    }

    if (req.user.vendor.registrationFeePaid) {
      res.status(400).json({
        success: false,
        message: 'Registration fee already paid',
        error: 'Your registration fee has already been processed'
      });
      return;
    }

    const order = await razorpayService.createRegistrationFeeOrder(req.user.vendor.id);

    res.json({
      success: true,
      message: 'Registration fee payment order created',
      data: {
        order,
        paymentInstructions: 'Complete the payment using the provided order details'
      }
    });

  } catch (error) {
    console.error('Create registration fee order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create registration fee payment',
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// POST /registration-fee-success - Handle successful registration fee payment
router.post('/registration-fee-success', clerkAuth, requireVendor, async (req, res: express.Response<ApiResponse>) => {
  try {
    if (!req.user?.vendor) {
      res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
        error: 'No vendor profile associated with this user'
      });
      return;
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    await razorpayService.processRegistrationFeePayment(req.user.vendor.id, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    res.json({
      success: true,
      message: 'Registration fee payment processed successfully',
      data: {
        registrationFeePaid: true,
        nextStep: 'Document verification and admin approval'
      }
    });

  } catch (error) {
    console.error('Process registration fee payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process registration fee payment',
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;