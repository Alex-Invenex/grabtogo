import express from 'express';
import multer from 'multer';
import { PrismaClient, OfferType, DiscountType } from '@prisma/client';
import { clerkAuth, requireVendor } from '../middleware/clerk';
import { requireVendorRole, requireBasicVendorAccess, requireActiveSubscription } from '../middleware/vendorAuth';
import { body, query, validationResult } from 'express-validator';
import { ApiResponse } from '../types/api';
import {
  Offer,
  CreateOfferRequest,
  UpdateOfferRequest,
  OfferFilter,
  NearbyOffersRequest,
  OfferClaimRequest,
  FlashDeal
} from '../types/offer';
import UploadService from '../services/upload';
import LocationService from '../services/locationService';
import { io } from '../server';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

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

// GET / - List all offers with filters
const listOffersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  query('offerType')
    .optional()
    .isIn(['DISCOUNT', 'BOGO', 'FLASH_DEAL', 'COMBO', 'FREE_DELIVERY'])
    .withMessage('Invalid offer type'),
  query('discountType')
    .optional()
    .isIn(['PERCENTAGE', 'FIXED_AMOUNT'])
    .withMessage('Invalid discount type'),
  query('minDiscount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Minimum discount must be between 0 and 100'),
  query('maxDiscount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Maximum discount must be between 0 and 100'),
  query('isFlashDeal')
    .optional()
    .isBoolean()
    .withMessage('isFlashDeal must be a boolean'),
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Radius must be between 0.1 and 100 km'),
  handleValidationErrors
];

router.get('/', listOffersValidation, async (req: express.Request, res: express.Response<ApiResponse>) => {
  try {
    const filter: OfferFilter = {
      category: req.query.category as string,
      offerType: req.query.offerType as OfferType,
      discountType: req.query.discountType as DiscountType,
      minDiscount: req.query.minDiscount ? parseFloat(req.query.minDiscount as string) : undefined,
      maxDiscount: req.query.maxDiscount ? parseFloat(req.query.maxDiscount as string) : undefined,
      isActive: true,
      isFlashDeal: req.query.isFlashDeal ? req.query.isFlashDeal === 'true' : undefined,
      search: req.query.search as string,
      latitude: req.query.latitude ? parseFloat(req.query.latitude as string) : undefined,
      longitude: req.query.longitude ? parseFloat(req.query.longitude as string) : undefined,
      radius: req.query.radius ? parseFloat(req.query.radius as string) : 10
    };

    const result = await LocationService.searchOffers(filter);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const paginatedOffers = result.offers.slice(offset, offset + limit);
    const totalPages = Math.ceil(result.totalCount / limit);

    res.json({
      success: true,
      message: 'Offers retrieved successfully',
      data: {
        offers: paginatedOffers,
        searchResults: {
          totalFound: result.totalCount,
          searchRadius: result.searchRadius,
          searchLocation: result.searchLocation,
          availableCategories: result.categories,
          priceRange: result.priceRange
        }
      },
      pagination: {
        page,
        limit,
        total: result.totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve offers',
      error: 'Internal server error'
    });
  }
});

// GET /nearby - Get offers within radius based on lat/lng
const nearbyOffersValidation = [
  query('latitude')
    .notEmpty()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  query('longitude')
    .notEmpty()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Radius must be between 0.1 and 100 km'),
  query('category')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  handleValidationErrors
];

router.get('/nearby', nearbyOffersValidation, async (req: express.Request, res: express.Response<ApiResponse>) => {
  try {
    const nearbyRequest: NearbyOffersRequest = {
      latitude: parseFloat(req.query.latitude as string),
      longitude: parseFloat(req.query.longitude as string),
      radius: req.query.radius ? parseFloat(req.query.radius as string) : 10,
      category: req.query.category as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const result = await LocationService.discoverNearbyOffers(nearbyRequest);

    res.json({
      success: true,
      message: `Found ${result.totalCount} offers within ${result.searchRadius}km`,
      data: {
        offers: result.offers,
        discoveryResults: {
          totalFound: result.totalCount,
          searchRadius: result.searchRadius,
          searchLocation: result.searchLocation,
          availableCategories: result.categories,
          priceRange: result.priceRange
        },
        recommendations: {
          hasFlashDeals: result.offers.some(o => o.isFlashDeal),
          avgDistance: result.offers.length > 0
            ? result.offers.reduce((sum, o) => sum + o.distance, 0) / result.offers.length
            : 0,
          topCategory: result.categories[0] || 'General'
        }
      }
    });

  } catch (error) {
    console.error('Get nearby offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve nearby offers',
      error: 'Internal server error'
    });
  }
});

// GET /vendor/:vendorId - Get offers by specific vendor
router.get('/vendor/:vendorId', async (req: express.Request, res: express.Response<ApiResponse>) => {
  try {
    const vendorId = req.params.vendorId;
    const userLatitude = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const userLongitude = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;

    const offers = await LocationService.getVendorOffersWithDistance(
      vendorId,
      userLatitude,
      userLongitude
    );

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        companyName: true,
        address: true,
        latitude: true,
        longitude: true,
        averageRating: true,
        totalRatings: true,
        categories: true,
        businessHours: true
      }
    });

    if (!vendor) {
      res.status(404).json({
        success: false,
        message: 'Vendor not found',
        error: 'The specified vendor does not exist'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Vendor offers retrieved successfully',
      data: {
        vendor,
        offers,
        summary: {
          totalOffers: offers.length,
          activeOffers: offers.filter(o => o.isActive).length,
          flashDeals: offers.filter(o => o.isFlashDeal).length,
          avgDiscount: offers.length > 0
            ? offers.reduce((sum, o) => sum + (o.discountPercentage || 0), 0) / offers.length
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Get vendor offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendor offers',
      error: 'Internal server error'
    });
  }
});

// POST / - Create new offer (vendor only)
const createOfferValidation = [
  body('title')
    .notEmpty()
    .withMessage('Offer title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .notEmpty()
    .withMessage('Offer description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('offerType')
    .isIn(['DISCOUNT', 'BOGO', 'FLASH_DEAL', 'COMBO', 'FREE_DELIVERY'])
    .withMessage('Invalid offer type'),
  body('discountType')
    .isIn(['PERCENTAGE', 'FIXED_AMOUNT'])
    .withMessage('Invalid discount type'),
  body('originalPrice')
    .isFloat({ min: 0 })
    .withMessage('Original price must be a positive number'),
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
  body('validFrom')
    .isISO8601()
    .withMessage('Valid from date must be a valid ISO date'),
  body('validUntil')
    .isISO8601()
    .withMessage('Valid until date must be a valid ISO date'),
  body('maxCustomersPerDay')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max customers per day must be a positive integer'),
  body('maxCustomersTotal')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max customers total must be a positive integer'),
  handleValidationErrors
];

router.post('/',
  clerkAuth,
  requireBasicVendorAccess,
  createOfferValidation,
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

      const createData: CreateOfferRequest = req.body;

      // Validate dates
      const validFrom = new Date(createData.validFrom);
      const validUntil = new Date(createData.validUntil);

      if (validFrom >= validUntil) {
        res.status(400).json({
          success: false,
          message: 'Invalid date range',
          error: 'Valid from date must be before valid until date'
        });
        return;
      }

      // Calculate discounted price
      let discountedPrice = createData.originalPrice;
      if (createData.discountType === DiscountType.PERCENTAGE && createData.discountPercentage) {
        discountedPrice = createData.originalPrice * (1 - createData.discountPercentage / 100);
      } else if (createData.discountType === DiscountType.FIXED_AMOUNT && createData.discountAmount) {
        discountedPrice = createData.originalPrice - createData.discountAmount;
      }

      const offer = await prisma.offer.create({
        data: {
          vendorId: req.user.vendor.id,
          productId: createData.productId,
          title: createData.title,
          description: createData.description,
          offerType: createData.offerType || 'DISCOUNT',
          discountType: createData.discountType || 'PERCENTAGE',
          originalPrice: createData.originalPrice,
          discountedPrice,
          discountPercentage: createData.discountPercentage,
                    maxCustomersPerDay: createData.maxCustomersPerDay,
          maxCustomersTotal: createData.maxCustomersTotal,
          validFrom,
          validUntil,
          termsAndConditions: createData.termsAndConditions,
          images: createData.images || [],
          tags: createData.tags || [],
          isFlashDeal: createData.isFlashDeal || false,
          flashDealEndsAt: createData.flashDealEndsAt ? new Date(createData.flashDealEndsAt) : undefined,
          buyQuantity: createData.bogoDetails?.buyQuantity,
          getQuantity: createData.bogoDetails?.getQuantity
        }
      });

      // If it's a flash deal, emit real-time update
      if (offer.isFlashDeal) {
        io.emit('new_flash_deal', {
          offerId: offer.id,
          vendorId: offer.vendorId,
          title: offer.title,
          discountPercentage: offer.discountPercentage,
          flashDealEndsAt: offer.flashDealEndsAt
        });
      }

      res.status(201).json({
        success: true,
        message: 'Offer created successfully',
        data: { offer }
      });

    } catch (error) {
      console.error('Create offer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create offer',
        error: 'Internal server error'
      });
    }
  }
);

// PUT /:id - Update offer (vendor only)
const updateOfferValidation = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Original price must be a positive number'),
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
  body('validFrom')
    .optional()
    .isISO8601()
    .withMessage('Valid from date must be a valid ISO date'),
  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Valid until date must be a valid ISO date'),
  handleValidationErrors
];

router.put('/:id',
  clerkAuth,
  requireBasicVendorAccess,
  updateOfferValidation,
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

      const offerId = req.params.id;
      const updateData: UpdateOfferRequest = req.body;

      // Check if offer belongs to vendor
      const existingOffer = await prisma.offer.findFirst({
        where: {
          id: offerId,
          vendorId: req.user.vendor.id
        }
      });

      if (!existingOffer) {
        res.status(404).json({
          success: false,
          message: 'Offer not found',
          error: 'Offer not found or does not belong to your vendor account'
        });
        return;
      }

      // Calculate new discounted price if needed
      let discountedPrice = existingOffer.discountedPrice;
      const originalPrice = updateData.originalPrice || existingOffer.originalPrice;

      if (updateData.discountPercentage !== undefined) {
        discountedPrice = originalPrice * (1 - updateData.discountPercentage / 100);
      } else if (updateData.discountAmount !== undefined) {
        discountedPrice = originalPrice - updateData.discountAmount;
      }

      const updatedOffer = await prisma.offer.update({
        where: { id: offerId },
        data: {
          ...(updateData.title && { title: updateData.title }),
          ...(updateData.description && { description: updateData.description }),
          ...(updateData.originalPrice !== undefined && { originalPrice: updateData.originalPrice }),
          ...(updateData.discountPercentage !== undefined && { discountPercentage: updateData.discountPercentage }),
          ...(updateData.discountAmount !== undefined && { discountAmount: updateData.discountAmount }),
          ...(discountedPrice !== existingOffer.discountedPrice && { discountedPrice }),
          ...(updateData.maxCustomersPerDay !== undefined && { maxCustomersPerDay: updateData.maxCustomersPerDay }),
          ...(updateData.maxCustomersTotal !== undefined && { maxCustomersTotal: updateData.maxCustomersTotal }),
          ...(updateData.validFrom && { validFrom: new Date(updateData.validFrom) }),
          ...(updateData.validUntil && { validUntil: new Date(updateData.validUntil) }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
          ...(updateData.termsAndConditions && { termsAndConditions: updateData.termsAndConditions }),
          ...(updateData.images && { images: updateData.images }),
          ...(updateData.tags && { tags: updateData.tags }),
          ...(updateData.isFlashDeal !== undefined && { isFlashDeal: updateData.isFlashDeal }),
          ...(updateData.flashDealEndsAt && { flashDealEndsAt: new Date(updateData.flashDealEndsAt) }),
          ...(updateData.bogoDetails && { bogoDetails: updateData.bogoDetails as any })
        }
      });

      res.json({
        success: true,
        message: 'Offer updated successfully',
        data: { offer: updatedOffer }
      });

    } catch (error) {
      console.error('Update offer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update offer',
        error: 'Internal server error'
      });
    }
  }
);

// DELETE /:id - Delete offer (vendor only)
router.delete('/:id',
  clerkAuth,
  requireBasicVendorAccess,
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

      const offerId = req.params.id;

      // Check if offer belongs to vendor
      const existingOffer = await prisma.offer.findFirst({
        where: {
          id: offerId,
          vendorId: req.user.vendor.id
        }
      });

      if (!existingOffer) {
        res.status(404).json({
          success: false,
          message: 'Offer not found',
          error: 'Offer not found or does not belong to your vendor account'
        });
        return;
      }

      // Soft delete by setting isActive to false
      await prisma.offer.update({
        where: { id: offerId },
        data: {
          isActive: false,
          status: 'INACTIVE'
        }
      });

      res.json({
        success: true,
        message: 'Offer deleted successfully',
        data: {
          offerId,
          note: 'Offer has been deactivated and will not appear in listings'
        }
      });

    } catch (error) {
      console.error('Delete offer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete offer',
        error: 'Internal server error'
      });
    }
  }
);

// POST /:id/claim - Customer claims an offer
const claimOfferValidation = [
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10'),
  handleValidationErrors
];

router.post('/:id/claim',
  clerkAuth,
  claimOfferValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      const offerId = req.params.id;
      const quantity = req.body.quantity || 1;
      const customerId = req.user?.customer?.id;

      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'Customer account required',
          error: 'Only customers can claim offers'
        });
        return;
      }

      // Get offer with vendor details
      const offer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: {
          vendor: {
            select: {
              companyName: true,
              address: true
            }
          }
        }
      });

      if (!offer) {
        res.status(404).json({
          success: false,
          message: 'Offer not found',
          error: 'The specified offer does not exist'
        });
        return;
      }

      // Validate offer availability
      if (!offer.isActive || offer.status !== 'ACTIVE') {
        res.status(400).json({
          success: false,
          message: 'Offer not available',
          error: 'This offer is no longer active'
        });
        return;
      }

      const now = new Date();
      if (now < offer.validFrom || now > offer.validUntil) {
        res.status(400).json({
          success: false,
          message: 'Offer expired',
          error: 'This offer is no longer valid'
        });
        return;
      }

      // Check availability limits
      if (offer.maxCustomersTotal && offer.currentCustomerCount >= offer.maxCustomersTotal) {
        res.status(400).json({
          success: false,
          message: 'Offer sold out',
          error: 'This offer has reached its maximum number of customers'
        });
        return;
      }

      // Check if customer already claimed today (for daily limits)
      if (offer.maxCustomersPerDay) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysClaims = await prisma.order.count({
          where: {
            offerId,
            customerId,
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          }
        });

        if (todaysClaims >= quantity) {
          res.status(400).json({
            success: false,
            message: 'Daily limit reached',
            error: 'You have already claimed this offer today'
          });
          return;
        }
      }

      // Create order and update offer counter
      const result = await prisma.$transaction(async (tx) => {
        // Create order
        const order = await tx.order.create({
          data: {
            customerId,
            vendorId: offer.vendorId,
            productId: offer.productId,
            offerId: offer.id,
            orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            totalAmount: offer.originalPrice * quantity,
            discountAmount: (offer.originalPrice - (offer.discountedPrice || offer.originalPrice)) * quantity,
            finalAmount: (offer.discountedPrice || offer.originalPrice) * quantity,
            status: 'PENDING'
          }
        });

        // Update offer counter
        await tx.offer.update({
          where: { id: offerId },
          data: {
            currentCustomerCount: {
              increment: quantity
            }
          }
        });

        return order;
      });

      // Generate claim code
      const claimCode = `GRAB-${result.orderNumber.slice(-8).toUpperCase()}`;

      res.json({
        success: true,
        message: 'Offer claimed successfully',
        data: {
          claimCode,
          order: result,
          vendor: offer.vendor,
          redemptionInstructions: `Show this code to ${offer.vendor.companyName} to redeem your offer: ${claimCode}`,
          offerDetails: {
            title: offer.title,
            originalPrice: offer.originalPrice,
            finalPrice: offer.discountedPrice,
            savings: offer.originalPrice - (offer.discountedPrice || offer.originalPrice)
          }
        }
      });

    } catch (error) {
      console.error('Claim offer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to claim offer',
        error: 'Internal server error'
      });
    }
  }
);

// GET /trending - Get trending offers
router.get('/trending', async (req: express.Request, res: express.Response<ApiResponse>) => {
  try {
    const latitude = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const longitude = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const trendingOffers = await LocationService.getTrendingOffers(latitude, longitude, radius, limit);

    res.json({
      success: true,
      message: 'Trending offers retrieved successfully',
      data: {
        offers: trendingOffers,
        summary: {
          totalTrending: trendingOffers.length,
          avgDiscount: trendingOffers.length > 0
            ? trendingOffers.reduce((sum, o) => sum + (o.discountPercentage || 0), 0) / trendingOffers.length
            : 0,
          flashDealsCount: trendingOffers.filter(o => o.isFlashDeal).length
        }
      }
    });

  } catch (error) {
    console.error('Get trending offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trending offers',
      error: 'Internal server error'
    });
  }
});

// GET /flash-deals - Get active flash deals
router.get('/flash-deals', async (req: express.Request, res: express.Response<ApiResponse>) => {
  try {
    const latitude = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const longitude = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10;

    const filter: OfferFilter = {
      isFlashDeal: true,
      isActive: true,
      latitude,
      longitude,
      radius
    };

    const result = await LocationService.searchOffers(filter);

    // Transform to flash deals with time remaining
    const flashDeals: FlashDeal[] = result.offers.map(offer => {
      const now = Date.now();
      const endTime = offer.flashDealEndsAt ? offer.flashDealEndsAt.getTime() : offer.validUntil.getTime();
      const timeRemaining = Math.max(0, endTime - now) / 1000; // in seconds

      let urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (timeRemaining < 3600) urgencyLevel = 'CRITICAL'; // < 1 hour
      else if (timeRemaining < 7200) urgencyLevel = 'HIGH'; // < 2 hours
      else if (timeRemaining < 14400) urgencyLevel = 'MEDIUM'; // < 4 hours

      const claimedPercentage = offer.maxCustomersTotal
        ? (offer.currentCustomerCount / offer.maxCustomersTotal) * 100
        : 0;

      return {
        ...offer,
        timeRemaining,
        urgencyLevel,
        claimedPercentage
      };
    }).filter(deal => deal.timeRemaining > 0); // Only active deals

    res.json({
      success: true,
      message: 'Flash deals retrieved successfully',
      data: {
        flashDeals,
        summary: {
          totalActive: flashDeals.length,
          criticalDeals: flashDeals.filter(d => d.urgencyLevel === 'CRITICAL').length,
          avgTimeRemaining: flashDeals.length > 0
            ? flashDeals.reduce((sum, d) => sum + d.timeRemaining, 0) / flashDeals.length
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Get flash deals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve flash deals',
      error: 'Internal server error'
    });
  }
});

export default router;