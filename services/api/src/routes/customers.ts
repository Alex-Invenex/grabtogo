import express from 'express';
import { PrismaClient } from '@prisma/client';
import { clerkAuth, requireCustomer } from '../middleware/clerk';
import { body, query, validationResult } from 'express-validator';
import { ApiResponse } from '../types/api';
import LocationService from '../services/locationService';

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

// GET /profile - Get customer profile
router.get('/profile',
  clerkAuth,
  requireCustomer,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.customer) {
        res.status(404).json({
          success: false,
          message: 'Customer profile not found',
          error: 'No customer profile associated with this account'
        });
        return;
      }

      const customer = await prisma.customer.findUnique({
        where: { id: req.user.customer.id },
        include: {
          preferences: true,
          loyaltyPoints: {
            where: { isUsed: false },
            orderBy: { createdAt: 'desc' }
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              vendor: {
                select: {
                  id: true,
                  companyName: true
                }
              },
              offer: {
                select: {
                  id: true,
                  title: true
                }
              },
              product: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              favorites: true,
              wishlist: true,
              orders: true,
              reviews: true
            }
          }
        }
      });

      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found',
          error: 'Customer profile not found'
        });
        return;
      }

      // Calculate total loyalty points
      const totalPoints = customer.loyaltyPoints.reduce((sum, point) => sum + point.points, 0);

      res.json({
        success: true,
        message: 'Customer profile retrieved successfully',
        data: {
          customer: {
            id: customer.id,
            firstName: customer.firstName,
            lastName: customer.lastName,
            latitude: customer.latitude,
            longitude: customer.longitude,
            address: customer.address,
            isActive: customer.isActive,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt,
            preferences: customer.preferences,
            stats: {
              totalLoyaltyPoints: totalPoints,
              favoriteVendors: customer._count.favorites,
              wishlistItems: customer._count.wishlist,
              totalOrders: customer._count.orders,
              totalReviews: customer._count.reviews
            }
          },
          recentActivities: customer.activities
        }
      });

    } catch (error) {
      console.error('Get customer profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve customer profile',
        error: 'Internal server error'
      });
    }
  }
);

// PUT /profile - Update customer profile
const updateProfileValidation = [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('address')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  handleValidationErrors
];

router.put('/profile',
  clerkAuth,
  updateProfileValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.customer) {
        res.status(404).json({
          success: false,
          message: 'Customer profile not found',
          error: 'No customer profile associated with this account'
        });
        return;
      }

      const { firstName, lastName, address } = req.body;

      const updatedCustomer = await prisma.customer.update({
        where: { id: req.user.customer.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(address && { address })
        }
      });

      res.json({
        success: true,
        message: 'Customer profile updated successfully',
        data: { customer: updatedCustomer }
      });

    } catch (error) {
      console.error('Update customer profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update customer profile',
        error: 'Internal server error'
      });
    }
  }
);

// PUT /location - Update customer location
const updateLocationValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('address')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  handleValidationErrors
];

router.put('/location',
  clerkAuth,
  updateLocationValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.customer) {
        res.status(404).json({
          success: false,
          message: 'Customer profile not found',
          error: 'No customer profile associated with this account'
        });
        return;
      }

      const { latitude, longitude, address } = req.body;

      const updatedCustomer = await prisma.customer.update({
        where: { id: req.user.customer.id },
        data: {
          latitude,
          longitude,
          ...(address && { address })
        }
      });

      // Log location update activity
      await prisma.customerActivity.create({
        data: {
          customerId: req.user.customer.id,
          activityType: 'CHECK_IN',
          metadata: {
            latitude,
            longitude,
            address,
            timestamp: new Date().toISOString()
          }
        }
      });

      res.json({
        success: true,
        message: 'Customer location updated successfully',
        data: { customer: updatedCustomer }
      });

    } catch (error) {
      console.error('Update customer location error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update customer location',
        error: 'Internal server error'
      });
    }
  }
);

// GET /nearby-offers - Get personalized offers based on location
const nearbyOffersValidation = [
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
    .isFloat({ min: 0.1, max: 50 })
    .withMessage('Radius must be between 0.1 and 50 km'),
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a positive integer'),
  handleValidationErrors
];

router.get('/nearby-offers',
  clerkAuth,
  nearbyOffersValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.customer) {
        res.status(404).json({
          success: false,
          message: 'Customer profile not found',
          error: 'No customer profile associated with this account'
        });
        return;
      }

      // Get customer location and preferences
      const customer = await prisma.customer.findUnique({
        where: { id: req.user.customer.id },
        include: { preferences: true }
      });

      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found',
          error: 'Customer profile not found'
        });
        return;
      }

      // Use provided location or customer's saved location
      const latitude = parseFloat(req.query.latitude as string) || customer.latitude;
      const longitude = parseFloat(req.query.longitude as string) || customer.longitude;

      if (!latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: 'Location required',
          error: 'Please provide latitude and longitude or update your profile location'
        });
        return;
      }

      // Use customer preferences for personalization
      const radius = parseFloat(req.query.radius as string) || customer.preferences?.maxDistance || 10;
      const category = req.query.category as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      // Get nearby offers using LocationService
      const nearbyOffers = await LocationService.discoverNearbyOffers({
        latitude,
        longitude,
        radius,
        category,
        limit,
        offset
      });

      // Log customer activity
      await prisma.customerActivity.create({
        data: {
          customerId: req.user.customer.id,
          activityType: 'SEARCH',
          metadata: {
            searchType: 'nearby_offers',
            location: { latitude, longitude },
            radius,
            category,
            resultsCount: nearbyOffers.offers.length
          }
        }
      });

      // Check if customer has favorited any of these vendors
      const vendorIds = nearbyOffers.offers.map(offer => offer.vendor?.id).filter(Boolean) as string[];
      const favorites = await prisma.favorite.findMany({
        where: {
          customerId: req.user.customer.id,
          vendorId: { in: vendorIds }
        },
        select: { vendorId: true }
      });

      const favoriteVendorIds = new Set(favorites.map(f => f.vendorId));

      // Enhance offers with personalization data
      const personalizedOffers = nearbyOffers.offers.map(offer => ({
        ...offer,
        isFavoriteVendor: offer.vendor ? favoriteVendorIds.has(offer.vendor.id) : false,
        personalizedReason: getPersonalizationReason(offer, customer.preferences)
      }));

      res.json({
        success: true,
        message: 'Nearby offers retrieved successfully',
        data: {
          ...nearbyOffers,
          offers: personalizedOffers,
          customerLocation: { latitude, longitude },
          personalization: {
            preferredCategories: customer.preferences?.preferredCategories || [],
            maxDistance: customer.preferences?.maxDistance || 10,
            priceRange: {
              min: customer.preferences?.priceRangeMin,
              max: customer.preferences?.priceRangeMax
            }
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
  }
);

// POST /favorites/:vendorId - Add/remove favorite vendor
router.post('/favorites/:vendorId',
  clerkAuth,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.customer) {
        res.status(404).json({
          success: false,
          message: 'Customer profile not found',
          error: 'No customer profile associated with this account'
        });
        return;
      }

      const vendorId = req.params.vendorId;

      // Check if vendor exists
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { id: true, companyName: true }
      });

      if (!vendor) {
        res.status(404).json({
          success: false,
          message: 'Vendor not found',
          error: 'The specified vendor does not exist'
        });
        return;
      }

      // Check if already favorited
      const existingFavorite = await prisma.favorite.findUnique({
        where: {
          customerId_vendorId: {
            customerId: req.user.customer.id,
            vendorId
          }
        }
      });

      let isFavorited = false;
      let action = '';

      if (existingFavorite) {
        // Remove from favorites
        await prisma.favorite.delete({
          where: { id: existingFavorite.id }
        });
        action = 'removed';
      } else {
        // Add to favorites
        await prisma.favorite.create({
          data: {
            customerId: req.user.customer.id,
            vendorId
          }
        });
        isFavorited = true;
        action = 'added';
      }

      // Log activity
      await prisma.customerActivity.create({
        data: {
          customerId: req.user.customer.id,
          vendorId,
          activityType: 'VENDOR_VISIT',
          metadata: {
            action: 'favorite_' + action,
            vendorName: vendor.companyName
          }
        }
      });

      res.json({
        success: true,
        message: `Vendor ${action} ${isFavorited ? 'to' : 'from'} favorites successfully`,
        data: {
          vendorId,
          isFavorited,
          action
        }
      });

    } catch (error) {
      console.error('Toggle favorite vendor error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update favorite vendor',
        error: 'Internal server error'
      });
    }
  }
);

// GET /favorites - List favorite vendors
const favoritesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
];

router.get('/favorites',
  clerkAuth,
  favoritesValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.customer) {
        res.status(404).json({
          success: false,
          message: 'Customer profile not found',
          error: 'No customer profile associated with this account'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const [favorites, totalCount] = await Promise.all([
        prisma.favorite.findMany({
          where: { customerId: req.user.customer.id },
          include: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                address: true,
                latitude: true,
                longitude: true,
                averageRating: true,
                totalRatings: true,
                categories: true,
                isActive: true,
                offers: {
                  where: {
                    isActive: true,
                    status: 'ACTIVE',
                    validFrom: { lte: new Date() },
                    validUntil: { gte: new Date() }
                  },
                  take: 3,
                  orderBy: { createdAt: 'desc' },
                  select: {
                    id: true,
                    title: true,
                    discountPercentage: true,
                    isFlashDeal: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.favorite.count({
          where: { customerId: req.user.customer.id }
        })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        message: 'Favorite vendors retrieved successfully',
        data: {
          favorites: favorites.map(fav => ({
            id: fav.id,
            vendor: fav.vendor,
            favoritedAt: fav.createdAt
          })),
          totalCount,
          page,
          totalPages,
          limit
        }
      });

    } catch (error) {
      console.error('Get favorite vendors error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve favorite vendors',
        error: 'Internal server error'
      });
    }
  }
);

// POST /wishlist/:productId - Add/remove product from wishlist
router.post('/wishlist/:productId',
  clerkAuth,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.customer) {
        res.status(404).json({
          success: false,
          message: 'Customer profile not found',
          error: 'No customer profile associated with this account'
        });
        return;
      }

      const productId = req.params.productId;

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          vendor: {
            select: {
              id: true,
              companyName: true
            }
          }
        }
      });

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
          error: 'The specified product does not exist'
        });
        return;
      }

      // Check if already in wishlist
      const existingWishlistItem = await prisma.wishlist.findUnique({
        where: {
          customerId_productId: {
            customerId: req.user.customer.id,
            productId
          }
        }
      });

      let isWishlisted = false;
      let action = '';

      if (existingWishlistItem) {
        // Remove from wishlist
        await prisma.wishlist.delete({
          where: { id: existingWishlistItem.id }
        });
        action = 'removed';
      } else {
        // Add to wishlist
        await prisma.wishlist.create({
          data: {
            customerId: req.user.customer.id,
            productId
          }
        });
        isWishlisted = true;
        action = 'added';
      }

      // Log activity
      await prisma.customerActivity.create({
        data: {
          customerId: req.user.customer.id,
          productId,
          vendorId: product.vendor.id,
          activityType: 'PRODUCT_VIEW',
          metadata: {
            action: 'wishlist_' + action,
            productName: product.name,
            vendorName: product.vendor.companyName
          }
        }
      });

      res.json({
        success: true,
        message: `Product ${action} ${isWishlisted ? 'to' : 'from'} wishlist successfully`,
        data: {
          productId,
          isWishlisted,
          action
        }
      });

    } catch (error) {
      console.error('Toggle wishlist item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update wishlist',
        error: 'Internal server error'
      });
    }
  }
);

// GET /wishlist - List wishlist items with offer notifications
const wishlistValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
];

router.get('/wishlist',
  clerkAuth,
  wishlistValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user?.customer) {
        res.status(404).json({
          success: false,
          message: 'Customer profile not found',
          error: 'No customer profile associated with this account'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const [wishlistItems, totalCount] = await Promise.all([
        prisma.wishlist.findMany({
          where: { customerId: req.user.customer.id },
          include: {
            product: {
              include: {
                vendor: {
                  select: {
                    id: true,
                    companyName: true,
                    address: true,
                    averageRating: true,
                    totalRatings: true
                  }
                },
                offers: {
                  where: {
                    isActive: true,
                    status: 'ACTIVE',
                    validFrom: { lte: new Date() },
                    validUntil: { gte: new Date() }
                  },
                  orderBy: { discountPercentage: 'desc' },
                  take: 1,
                  select: {
                    id: true,
                    title: true,
                    originalPrice: true,
                    discountedPrice: true,
                    discountPercentage: true,
                    isFlashDeal: true,
                    flashDealEndsAt: true,
                    validUntil: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.wishlist.count({
          where: { customerId: req.user.customer.id }
        })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      // Check for items with active offers
      const itemsWithOffers = wishlistItems.map(item => ({
        id: item.id,
        product: item.product,
        addedAt: item.createdAt,
        hasActiveOffer: item.product.offers.length > 0,
        bestOffer: item.product.offers[0] || null,
        offerNotification: item.product.offers.length > 0 ? {
          message: `${item.product.name} is now on sale!`,
          discount: `${item.product.offers[0].discountPercentage}% off`,
          isFlashDeal: item.product.offers[0].isFlashDeal,
          endsAt: item.product.offers[0].flashDealEndsAt || item.product.offers[0].validUntil
        } : null
      }));

      res.json({
        success: true,
        message: 'Wishlist items retrieved successfully',
        data: {
          wishlistItems: itemsWithOffers,
          totalCount,
          page,
          totalPages,
          limit,
          summary: {
            total: totalCount,
            withActiveOffers: itemsWithOffers.filter(item => item.hasActiveOffer).length,
            flashDeals: itemsWithOffers.filter(item => item.bestOffer?.isFlashDeal).length
          }
        }
      });

    } catch (error) {
      console.error('Get wishlist items error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve wishlist items',
        error: 'Internal server error'
      });
    }
  }
);

// Helper function to determine personalization reason
function getPersonalizationReason(offer: any, preferences: any): string | null {
  if (!preferences) return null;

  const reasons = [];

  // Check category preference
  if (preferences.preferredCategories?.includes(offer.product?.category)) {
    reasons.push('Matches your preferred category');
  }

  // Check if it's from a vendor the user has favorited before
  if (offer.isFavoriteVendor) {
    reasons.push('From one of your favorite vendors');
  }

  // Check price range
  if (preferences.priceRangeMin && preferences.priceRangeMax) {
    const price = offer.discountedPrice || offer.originalPrice;
    if (price >= preferences.priceRangeMin && price <= preferences.priceRangeMax) {
      reasons.push('Within your preferred price range');
    }
  }

  // Check if it's a flash deal
  if (offer.isFlashDeal) {
    reasons.push('Limited time flash deal');
  }

  return reasons.length > 0 ? reasons[0] : null;
}

export default router;