import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { clerkAuth, requireVendor, optionalClerkAuth } from '../middleware/clerk';
import { requireBasicVendorAccess } from '../middleware/vendorAuth';
import { body, query, validationResult } from 'express-validator';
import { ApiResponse } from '../types/api';
import { Story, StoryType, CreateStoryRequest, HomeStoryFeed, StoryView } from '../types/story';
import UploadService from '../services/upload';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for story uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB for videos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/avi'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MOV, AVI) are allowed.'));
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

// POST / - Create new story
const createStoryValidation = [
  body('type')
    .isIn(Object.values(StoryType))
    .withMessage('Invalid story type. Must be IMAGE or VIDEO'),
  body('caption')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Caption must not exceed 200 characters'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Duration must be between 1 and 30 seconds'),
  handleValidationErrors
];

router.post('/',
  clerkAuth,
  requireBasicVendorAccess,
  upload.single('media') as any,
  createStoryValidation,
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

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Media file is required',
          error: 'Please upload an image or video file'
        });
        return;
      }

      const createData: CreateStoryRequest = req.body;
      const file = req.file;

      // Determine story type based on file type
      const isVideo = file.mimetype.startsWith('video/');
      const storyType = isVideo ? StoryType.VIDEO : StoryType.IMAGE;

      // Default duration: 5 seconds for images, 10 seconds for videos (can be overridden)
      const defaultDuration = isVideo ? 10 : 5;
      const duration = createData.duration || defaultDuration;

      // Upload media file
      let uploadResult;
      try {
        if (isVideo) {
          // For videos, use single file upload
          uploadResult = await UploadService.uploadSingleFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            'stories/videos'
          );
        } else {
          // For images, use variants
          uploadResult = await UploadService.uploadImageWithVariants(
            file.buffer,
            file.originalname,
            file.mimetype,
            'story'
          );
        }
      } catch (uploadError) {
        console.error('Story media upload error:', uploadError);
        res.status(500).json({
          success: false,
          message: 'Failed to upload media file',
          error: 'Media upload failed'
        });
        return;
      }

      // Create story with 24-hour expiry
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const story = await prisma.story.create({
        data: {
          vendorId: req.user.vendor.id,
          type: storyType,
          mediaUrl: uploadResult.originalUrl,
          thumbnailUrl: uploadResult.thumbnailUrl,
          caption: createData.caption,
          duration,
          expiresAt
        },
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              address: true,
              categories: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Story created successfully',
        data: { story }
      });

    } catch (error) {
      console.error('Create story error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create story',
        error: 'Internal server error'
      });
    }
  }
);

// GET / - Get vendor's own stories
router.get('/',
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

      const stories = await prisma.story.findMany({
        where: {
          vendorId: req.user.vendor.id,
          isActive: true,
          expiresAt: { gte: new Date() }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              address: true,
              categories: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Stories retrieved successfully',
        data: {
          stories,
          total: stories.length,
          active: stories.filter(s => new Date() < new Date(s.expiresAt)).length
        }
      });

    } catch (error) {
      console.error('Get vendor stories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve stories',
        error: 'Internal server error'
      });
    }
  }
);

// GET /home - Get stories for home page (location-based)
const homeStoriesValidation = [
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
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
];

router.get('/home',
  clerkAuth,
  homeStoriesValidation,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radius = parseFloat(req.query.radius as string) || 10; // default 10km
      const limit = parseInt(req.query.limit as string) || 20;

      let whereClause: any = {
        isActive: true,
        expiresAt: { gte: new Date() },
        vendor: {
          isActive: true,
          isApproved: true,
          subscriptionStatus: { in: ['TRIAL', 'ACTIVE'] }
        }
      };

      // Add location filter if provided
      if (latitude && longitude) {
        // Get bounding box for efficient query
        const latRadian = latitude * (Math.PI / 180);
        const degLatKm = 110.54; // km per degree of latitude
        const degLonKm = 110.54 * Math.cos(latRadian); // km per degree of longitude

        const deltaLat = radius / degLatKm;
        const deltaLon = radius / degLonKm;

        const bbox = {
          minLat: latitude - deltaLat,
          maxLat: latitude + deltaLat,
          minLon: longitude - deltaLon,
          maxLon: longitude + deltaLon
        };

        whereClause.vendor.latitude = {
          gte: bbox.minLat,
          lte: bbox.maxLat
        };
        whereClause.vendor.longitude = {
          gte: bbox.minLon,
          lte: bbox.maxLon
        };
      }

      const stories = await prisma.story.findMany({
        where: whereClause,
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: limit * 2, // Get more to filter by distance
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              address: true,
              categories: true,
              latitude: true,
              longitude: true
            }
          }
        }
      });

      // Filter by exact distance if location provided
      let filteredStories = stories;
      if (latitude && longitude) {
        filteredStories = stories.filter(story => {
          if (!story.vendor.latitude || !story.vendor.longitude) return false;

          // Calculate distance using Haversine formula
          const R = 6371; // Earth's radius in kilometers
          const dLat = (story.vendor.latitude - latitude) * (Math.PI / 180);
          const dLon = (story.vendor.longitude - longitude) * (Math.PI / 180);

          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(latitude * (Math.PI / 180)) * Math.cos(story.vendor.latitude * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return distance <= radius;
        }).slice(0, limit);
      } else {
        filteredStories = stories.slice(0, limit);
      }

      // Group stories by vendor for better UX
      const vendorStories: Record<string, Story[]> = {};
      filteredStories.forEach(story => {
        const vendorId = story.vendorId;
        if (!vendorStories[vendorId]) {
          vendorStories[vendorId] = [];
        }
        vendorStories[vendorId].push(story as any);
      });

      // Flatten back to array but keep vendor grouping info
      const groupedStories = Object.values(vendorStories).map(stories => ({
        vendor: stories[0].vendor,
        stories: stories.map(s => ({ ...s, vendor: undefined })) // Remove vendor from individual stories
      }));

      const response: HomeStoryFeed = {
        stories: filteredStories as any,
        hasMore: stories.length > limit,
        lastViewedStoryId: undefined
      };

      res.json({
        success: true,
        message: 'Home stories retrieved successfully',
        data: {
          ...response,
          vendorGroups: groupedStories,
          searchRadius: radius,
          searchLocation: latitude && longitude ? { latitude, longitude } : null
        }
      });

    } catch (error) {
      console.error('Get home stories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve home stories',
        error: 'Internal server error'
      });
    }
  }
);

// POST /:id/view - Mark story as viewed
router.post('/:id/view',
  clerkAuth,
  async (req: express.Request, res: express.Response<ApiResponse>) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'Please log in to view stories'
        });
        return;
      }

      const storyId = req.params.id;

      // Check if story exists and is active
      const story = await prisma.story.findFirst({
        where: {
          id: storyId,
          isActive: true,
          expiresAt: { gte: new Date() }
        }
      });

      if (!story) {
        res.status(404).json({
          success: false,
          message: 'Story not found',
          error: 'Story not found or has expired'
        });
        return;
      }

      // Check if user already viewed this story
      const existingView = await prisma.storyView.findFirst({
        where: {
          storyId,
          userId: req.user.id
        }
      });

      if (!existingView) {
        // Create new view record
        await prisma.storyView.create({
          data: {
            storyId,
            userId: req.user.id
          }
        });

        // Increment view count
        await prisma.story.update({
          where: { id: storyId },
          data: { viewCount: { increment: 1 } }
        });
      }

      res.json({
        success: true,
        message: 'Story view recorded successfully',
        data: {
          storyId,
          viewedAt: new Date().toISOString(),
          alreadyViewed: !!existingView
        }
      });

    } catch (error) {
      console.error('Record story view error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record story view',
        error: 'Internal server error'
      });
    }
  }
);

// DELETE /:id - Delete story
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

      const storyId = req.params.id;

      // Check if story belongs to vendor
      const existingStory = await prisma.story.findFirst({
        where: {
          id: storyId,
          vendorId: req.user.vendor.id
        }
      });

      if (!existingStory) {
        res.status(404).json({
          success: false,
          message: 'Story not found',
          error: 'Story not found or does not belong to your vendor account'
        });
        return;
      }

      // Soft delete by setting isActive to false
      await prisma.story.update({
        where: { id: storyId },
        data: { isActive: false }
      });

      // Try to delete media files (optional, don't fail if it doesn't work)
      try {
        await UploadService.deleteFile(existingStory.mediaUrl);
        if (existingStory.thumbnailUrl) {
          await UploadService.deleteFile(existingStory.thumbnailUrl);
        }
      } catch (deleteError) {
        console.warn('Failed to delete story media files:', deleteError);
      }

      res.json({
        success: true,
        message: 'Story deleted successfully',
        data: {
          storyId,
          note: 'Story has been deactivated and will not appear in feeds'
        }
      });

    } catch (error) {
      console.error('Delete story error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete story',
        error: 'Internal server error'
      });
    }
  }
);

// GET /analytics - Get story analytics for vendor
router.get('/analytics',
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

      const stories = await prisma.story.findMany({
        where: {
          vendorId: req.user.vendor.id
        },
        include: {
          views: {
            select: {
              id: true,
              viewedAt: true,
              user: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const totalStories = stories.length;
      const activeStories = stories.filter(s => s.isActive && new Date() < new Date(s.expiresAt)).length;
      const expiredStories = stories.filter(s => new Date() >= new Date(s.expiresAt)).length;
      const totalViews = stories.reduce((sum, story) => sum + story.viewCount, 0);
      const uniqueViewers = new Set(stories.flatMap(s => s.views.map(v => v.user.id))).size;

      // Calculate engagement metrics
      const averageViewsPerStory = totalStories > 0 ? totalViews / totalStories : 0;

      // Most viewed stories
      const topStories = stories
        .filter(s => s.viewCount > 0)
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 5)
        .map(s => ({
          id: s.id,
          caption: s.caption,
          type: s.type,
          viewCount: s.viewCount,
          createdAt: s.createdAt
        }));

      res.json({
        success: true,
        message: 'Story analytics retrieved successfully',
        data: {
          overview: {
            totalStories,
            activeStories,
            expiredStories,
            totalViews,
            uniqueViewers,
            averageViewsPerStory: Math.round(averageViewsPerStory * 100) / 100
          },
          topStories,
          recentActivity: stories.slice(0, 10).map(s => ({
            id: s.id,
            caption: s.caption,
            type: s.type,
            viewCount: s.viewCount,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
            isActive: s.isActive && new Date() < new Date(s.expiresAt)
          }))
        }
      });

    } catch (error) {
      console.error('Get story analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve story analytics',
        error: 'Internal server error'
      });
    }
  }
);

export default router;