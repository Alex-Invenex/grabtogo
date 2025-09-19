import express from 'express';
import { PrismaClient } from '@prisma/client';
import { optionalClerkAuth } from '../middleware/clerk';
import { query, validationResult } from 'express-validator';
import { ApiResponse } from '../types/api';
import LocationService from '../services/locationService';
import PersonalizationService from '../services/personalization';
import NotificationService from '../services/notifications';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize services
const notificationService = new NotificationService();
const personalizationService = new PersonalizationService(notificationService);

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

// GET /offers - Search offers with advanced filtering
const searchOffersValidation = [
  query('q')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('minDiscount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Minimum discount must be between 0 and 100'),
  query('maxDiscount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Maximum discount must be between 0 and 100'),
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
  query('sortBy')
    .optional()
    .isIn(['distance', 'discount', 'rating', 'price', 'newest'])
    .withMessage('Invalid sort option'),
  query('isFlashDeal')
    .optional()
    .isBoolean()
    .withMessage('isFlashDeal must be a boolean'),
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

router.get('/offers',
  optionalClerkAuth,
  searchOffersValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      const {
        q: searchQuery,
        category,
        minPrice,
        maxPrice,
        minDiscount,
        maxDiscount,
        latitude,
        longitude,
        radius,
        sortBy = 'distance',
        isFlashDeal,
        page = 1,
        limit = 20
      } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Build search filter
      const searchFilter: any = {
        category,
        minDiscount: minDiscount ? parseFloat(minDiscount as string) : undefined,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount as string) : undefined,
        isFlashDeal: isFlashDeal === 'true' ? true : isFlashDeal === 'false' ? false : undefined,
        search: searchQuery as string,
        latitude: latitude ? parseFloat(latitude as string) : undefined,
        longitude: longitude ? parseFloat(longitude as string) : undefined,
        radius: radius ? parseFloat(radius as string) : 10
      };

      // Use LocationService for comprehensive search
      const searchResults = await LocationService.searchOffers(searchFilter);

      // Apply price filtering
      let filteredOffers = searchResults.offers;
      if (minPrice || maxPrice) {
        filteredOffers = filteredOffers.filter(offer => {
          const price = offer.discountedPrice || offer.originalPrice;
          const minPriceCheck = minPrice ? price >= parseFloat(minPrice as string) : true;
          const maxPriceCheck = maxPrice ? price <= parseFloat(maxPrice as string) : true;
          return minPriceCheck && maxPriceCheck;
        });
      }

      // Apply sorting
      filteredOffers = sortOffers(filteredOffers, sortBy as string);

      // Apply pagination
      const paginatedOffers = filteredOffers.slice(offset, offset + parseInt(limit as string));

      // Track search activity if user is logged in
      if (req.user?.customer && searchQuery) {
        await personalizationService.trackEngagement(req.user.customer.id, {
          action: 'search',
          metadata: {
            searchTerm: searchQuery,
            category,
            resultsCount: filteredOffers.length,
            location: latitude && longitude ? { latitude, longitude } : null
          }
        });
      }

      // Generate search suggestions
      const suggestions = await generateSearchSuggestions(searchQuery as string);

      res.json({
        success: true,
        message: 'Search results retrieved successfully',
        data: {
          offers: paginatedOffers,
          totalCount: filteredOffers.length,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(filteredOffers.length / parseInt(limit as string)),
          searchQuery,
          filters: {
            category,
            priceRange: { min: minPrice, max: maxPrice },
            discountRange: { min: minDiscount, max: maxDiscount },
            location: latitude && longitude ? { latitude, longitude, radius } : null,
            isFlashDeal
          },
          suggestions,
          sortBy
        }
      });

    } catch (error) {
      console.error('Search offers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search offers',
        error: 'Internal server error'
      });
    }
  }
);

// GET /vendors - Search vendors
const searchVendorsValidation = [
  query('q')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  query('minRating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),
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
  query('sortBy')
    .optional()
    .isIn(['distance', 'rating', 'alphabetical'])
    .withMessage('Invalid sort option'),
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

router.get('/vendors',
  optionalClerkAuth,
  searchVendorsValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      const {
        q: searchQuery,
        category,
        minRating,
        latitude,
        longitude,
        radius = 10,
        sortBy = 'distance',
        page = 1,
        limit = 20
      } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Build where clause
      const whereClause: any = {
        isActive: true,
        isApproved: true,
        subscriptionStatus: { in: ['TRIAL', 'ACTIVE'] }
      };

      // Text search
      if (searchQuery) {
        whereClause.OR = [
          { companyName: { contains: searchQuery as string, mode: 'insensitive' } },
          { address: { contains: searchQuery as string, mode: 'insensitive' } }
        ];
      }

      // Category filter
      if (category) {
        whereClause.categories = { has: category };
      }

      // Rating filter
      if (minRating) {
        whereClause.averageRating = { gte: parseFloat(minRating as string) };
      }

      // Location filter
      if (latitude && longitude) {
        const lat = parseFloat(latitude as string);
        const lon = parseFloat(longitude as string);
        const radiusKm = parseFloat(radius as string);

        // Calculate bounding box
        const latRadian = lat * (Math.PI / 180);
        const degLatKm = 110.54;
        const degLonKm = 110.54 * Math.cos(latRadian);

        const deltaLat = radiusKm / degLatKm;
        const deltaLon = radiusKm / degLonKm;

        whereClause.latitude = {
          gte: lat - deltaLat,
          lte: lat + deltaLat
        };
        whereClause.longitude = {
          gte: lon - deltaLon,
          lte: lon + deltaLon
        };
      }

      const [vendors, totalCount] = await Promise.all([
        prisma.vendor.findMany({
          where: whereClause,
          include: {
            offers: {
              where: {
                isActive: true,
                status: 'ACTIVE',
                validFrom: { lte: new Date() },
                validUntil: { gte: new Date() }
              },
              take: 3,
              orderBy: { discountPercentage: 'desc' },
              select: {
                id: true,
                title: true,
                discountPercentage: true,
                isFlashDeal: true
              }
            },
            _count: {
              select: {
                offers: {
                  where: {
                    isActive: true,
                    status: 'ACTIVE',
                    validFrom: { lte: new Date() },
                    validUntil: { gte: new Date() }
                  }
                }
              }
            }
          },
          skip: offset,
          take: parseInt(limit as string)
        }),
        prisma.vendor.count({ where: whereClause })
      ]);

      // Calculate distances and sort
      let vendorsWithDistance = vendors;
      if (latitude && longitude) {
        const lat = parseFloat(latitude as string);
        const lon = parseFloat(longitude as string);
        const radiusKm = parseFloat(radius as string);

        vendorsWithDistance = vendors
          .map(vendor => {
            if (!vendor.latitude || !vendor.longitude) return null;

            const distance = LocationService.calculateDistance(
              lat,
              lon,
              vendor.latitude,
              vendor.longitude
            );

            if (distance <= radiusKm) {
              return { ...vendor, distance };
            }
            return null;
          })
          .filter(vendor => vendor !== null) as any[];
      }

      // Apply sorting
      vendorsWithDistance = sortVendors(vendorsWithDistance, sortBy as string);

      // Track search activity
      if (req.user?.customer && searchQuery) {
        await personalizationService.trackEngagement(req.user.customer.id, {
          action: 'search',
          metadata: {
            searchType: 'vendors',
            searchTerm: searchQuery,
            category,
            resultsCount: vendorsWithDistance.length,
            location: latitude && longitude ? { latitude, longitude } : null
          }
        });
      }

      res.json({
        success: true,
        message: 'Vendor search results retrieved successfully',
        data: {
          vendors: vendorsWithDistance,
          totalCount,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(totalCount / parseInt(limit as string)),
          searchQuery,
          filters: {
            category,
            minRating,
            location: latitude && longitude ? { latitude, longitude, radius } : null
          },
          sortBy
        }
      });

    } catch (error) {
      console.error('Search vendors error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search vendors',
        error: 'Internal server error'
      });
    }
  }
);

// GET /suggestions - Get search suggestions and autocomplete
const suggestionsValidation = [
  query('q')
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .withMessage('Query must be between 1 and 50 characters'),
  query('type')
    .optional()
    .isIn(['offers', 'vendors', 'products', 'categories'])
    .withMessage('Invalid suggestion type'),
  handleValidationErrors
];

router.get('/suggestions',
  optionalClerkAuth,
  suggestionsValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      const { q: query, type = 'all' } = req.query;
      const searchTerm = (query as string).toLowerCase();

      const suggestions: any = {
        offers: [],
        vendors: [],
        products: [],
        categories: []
      };

      // Get offer suggestions
      if (type === 'all' || type === 'offers') {
        const offers = await prisma.offer.findMany({
          where: {
            isActive: true,
            status: 'ACTIVE',
            title: { contains: searchTerm, mode: 'insensitive' }
          },
          select: {
            id: true,
            title: true,
            discountPercentage: true
          },
          take: 5
        });
        suggestions.offers = offers;
      }

      // Get vendor suggestions
      if (type === 'all' || type === 'vendors') {
        const vendors = await prisma.vendor.findMany({
          where: {
            isActive: true,
            isApproved: true,
            companyName: { contains: searchTerm, mode: 'insensitive' }
          },
          select: {
            id: true,
            companyName: true,
            averageRating: true,
            categories: true
          },
          take: 5
        });
        suggestions.vendors = vendors;
      }

      // Get product suggestions
      if (type === 'all' || type === 'products') {
        const products = await prisma.product.findMany({
          where: {
            isActive: true,
            name: { contains: searchTerm, mode: 'insensitive' }
          },
          select: {
            id: true,
            name: true,
            category: true,
            vendor: {
              select: {
                id: true,
                companyName: true
              }
            }
          },
          take: 5
        });
        suggestions.products = products;
      }

      // Get category suggestions
      if (type === 'all' || type === 'categories') {
        const categories = [
          'Food & Beverages',
          'Electronics',
          'Fashion',
          'Health & Beauty',
          'Home & Garden',
          'Sports & Fitness',
          'Books & Education',
          'Automotive',
          'Travel & Tourism',
          'Services'
        ].filter(cat => cat.toLowerCase().includes(searchTerm));

        suggestions.categories = categories.slice(0, 5);
      }

      res.json({
        success: true,
        message: 'Search suggestions retrieved successfully',
        data: {
          query: searchTerm,
          suggestions
        }
      });

    } catch (error) {
      console.error('Get search suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get search suggestions',
        error: 'Internal server error'
      });
    }
  }
);

// GET /trending - Get trending searches and popular items
router.get('/trending',
  optionalClerkAuth,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      // Get trending search terms from customer activities
      const trendingSearches = await prisma.customerActivity.findMany({
        where: {
          activityType: 'SEARCH',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        select: {
          metadata: true
        }
      });

      // Count search terms
      const searchTermCounts: Record<string, number> = {};
      trendingSearches.forEach(activity => {
        const searchTerm = (activity.metadata as any)?.searchTerm;
        if (searchTerm) {
          searchTermCounts[searchTerm] = (searchTermCounts[searchTerm] || 0) + 1;
        }
      });

      const topSearchTerms = Object.entries(searchTermCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([term, count]) => ({ term, count }));

      // Get popular offers (most viewed/claimed)
      const popularOffers = await prisma.offer.findMany({
        where: {
          isActive: true,
          status: 'ACTIVE',
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() }
        },
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              averageRating: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        },
        orderBy: [
          { currentCustomerCount: 'desc' },
          { discountPercentage: 'desc' }
        ],
        take: 10
      });

      // Get trending categories
      const categoryActivity = await prisma.customerActivity.findMany({
        where: {
          activityType: 'CATEGORY_BROWSE',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          metadata: true
        }
      });

      const categoryCounts: Record<string, number> = {};
      categoryActivity.forEach(activity => {
        const category = (activity.metadata as any)?.category;
        if (category) {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
      });

      const trendingCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([category, count]) => ({ category, count }));

      res.json({
        success: true,
        message: 'Trending data retrieved successfully',
        data: {
          trendingSearches: topSearchTerms,
          popularOffers,
          trendingCategories,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      console.error('Get trending data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get trending data',
        error: 'Internal server error'
      });
    }
  }
);

// Helper function to sort offers
function sortOffers(offers: any[], sortBy: string): any[] {
  switch (sortBy) {
    case 'distance':
      return offers.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    case 'discount':
      return offers.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    case 'rating':
      return offers.sort((a, b) => (b.vendor?.averageRating || 0) - (a.vendor?.averageRating || 0));
    case 'price':
      return offers.sort((a, b) => {
        const priceA = a.discountedPrice || a.originalPrice;
        const priceB = b.discountedPrice || b.originalPrice;
        return priceA - priceB;
      });
    case 'newest':
      return offers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    default:
      return offers;
  }
}

// Helper function to sort vendors
function sortVendors(vendors: any[], sortBy: string): any[] {
  switch (sortBy) {
    case 'distance':
      return vendors.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    case 'rating':
      return vendors.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    case 'alphabetical':
      return vendors.sort((a, b) => a.companyName.localeCompare(b.companyName));
    default:
      return vendors;
  }
}

// Helper function to generate search suggestions
async function generateSearchSuggestions(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];

  try {
    // Get similar search terms from recent activities
    const recentSearches = await prisma.customerActivity.findMany({
      where: {
        activityType: 'SEARCH',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: {
        metadata: true
      },
      take: 100
    });

    const searchTerms = recentSearches
      .map(activity => (activity.metadata as any)?.searchTerm)
      .filter(term => term && term.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);

    return [...new Set(searchTerms)]; // Remove duplicates
  } catch (error) {
    console.error('Generate suggestions error:', error);
    return [];
  }
}

export default router;