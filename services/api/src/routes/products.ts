import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { clerkAuth, requireVendor } from '../middleware/clerk';
import { requireVendorRole, requireBasicVendorAccess } from '../middleware/vendorAuth';
import { body, query, validationResult } from 'express-validator';
import { ApiResponse } from '../types/api';
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilter,
  PRODUCT_CATEGORIES
} from '../types/product';
import UploadService from '../services/upload';

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

// GET / - List vendor's products with pagination
const listProductsValidation = [
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
    .isIn(PRODUCT_CATEGORIES)
    .withMessage('Invalid category'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search term must be between 2 and 100 characters'),
  handleValidationErrors
];

router.get('/',
  clerkAuth,
  requireVendorRole,
  listProductsValidation,
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

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const category = req.query.category as string;
      const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
      const search = req.query.search as string;

      const whereClause: any = {
        vendorId: req.user.vendor.id
      };

      if (category) {
        whereClause.category = category;
      }

      if (isActive !== undefined) {
        whereClause.isActive = isActive;
      }

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.product.count({ where: whereClause })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        message: 'Products retrieved successfully',
        data: {
          products,
          summary: {
            total: totalCount,
            active: products.filter(p => p.isActive).length,
            inactive: products.filter(p => !p.isActive).length,
            categories: [...new Set(products.map(p => p.category))]
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
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve products',
        error: 'Internal server error'
      });
    }
  }
);

// POST / - Create new product
const createProductValidation = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('category')
    .isIn(PRODUCT_CATEGORIES)
    .withMessage('Invalid category'),
  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  handleValidationErrors
];

router.post('/',
  clerkAuth,
  requireBasicVendorAccess,
  createProductValidation,
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

      const createData: CreateProductRequest = req.body;

      const product = await prisma.product.create({
        data: {
          vendorId: req.user.vendor.id,
          name: createData.name,
          description: createData.description,
          category: createData.category,
          basePrice: createData.basePrice,
          images: createData.images || []
        }
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product }
      });

    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: 'Internal server error'
      });
    }
  }
);

// PUT /:id - Update product details
const updateProductValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('category')
    .optional()
    .isIn(PRODUCT_CATEGORIES)
    .withMessage('Invalid category'),
  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors
];

router.put('/:id',
  clerkAuth,
  requireBasicVendorAccess,
  updateProductValidation,
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

      const productId = req.params.id;
      const updateData: UpdateProductRequest = req.body;

      // Check if product belongs to vendor
      const existingProduct = await prisma.product.findFirst({
        where: {
          id: productId,
          vendorId: req.user.vendor.id
        }
      });

      if (!existingProduct) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
          error: 'Product not found or does not belong to your vendor account'
        });
        return;
      }

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.description && { description: updateData.description }),
          ...(updateData.category && { category: updateData.category }),
          ...(updateData.basePrice !== undefined && { basePrice: updateData.basePrice }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive })
        }
      });

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: { product: updatedProduct }
      });

    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: 'Internal server error'
      });
    }
  }
);

// DELETE /:id - Soft delete product
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

      const productId = req.params.id;

      // Check if product belongs to vendor
      const existingProduct = await prisma.product.findFirst({
        where: {
          id: productId,
          vendorId: req.user.vendor.id
        }
      });

      if (!existingProduct) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
          error: 'Product not found or does not belong to your vendor account'
        });
        return;
      }

      // Soft delete by setting isActive to false
      await prisma.product.update({
        where: { id: productId },
        data: { isActive: false }
      });

      res.json({
        success: true,
        message: 'Product deleted successfully',
        data: {
          productId,
          note: 'Product has been deactivated and will not appear in listings'
        }
      });

    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: 'Internal server error'
      });
    }
  }
);

// POST /:id/images - Upload product images
router.post('/:id/images',
  clerkAuth,
  requireBasicVendorAccess,
  upload.array('images', 5) as any, // Max 5 images
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

      const productId = req.params.id;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No images provided',
          error: 'Please upload at least one image'
        });
        return;
      }

      // Check if product belongs to vendor
      const existingProduct = await prisma.product.findFirst({
        where: {
          id: productId,
          vendorId: req.user.vendor.id
        }
      });

      if (!existingProduct) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
          error: 'Product not found or does not belong to your vendor account'
        });
        return;
      }

      // Upload images
      const uploadResults = [];
      for (const file of files) {
        try {
          const result = await UploadService.uploadImageWithVariants(
            file.buffer,
            file.originalname,
            file.mimetype,
            'product'
          );
          uploadResults.push(result);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          // Continue with other images even if one fails
        }
      }

      if (uploadResults.length === 0) {
        res.status(500).json({
          success: false,
          message: 'Failed to upload any images',
          error: 'All image uploads failed'
        });
        return;
      }

      // Update product with new image URLs
      const imageUrls = uploadResults.map(result => result.originalUrl);
      const updatedImages = [...existingProduct.images, ...imageUrls];

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { images: updatedImages }
      });

      res.json({
        success: true,
        message: `Successfully uploaded ${uploadResults.length} image(s)`,
        data: {
          product: updatedProduct,
          uploadedImages: uploadResults,
          totalImages: updatedImages.length
        }
      });

    } catch (error) {
      console.error('Upload product images error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload product images',
        error: 'Internal server error'
      });
    }
  }
);

// GET /:id - Get single product details
router.get('/:id',
  clerkAuth,
  requireVendorRole,
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

      const productId = req.params.id;

      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          vendorId: req.user.vendor.id
        },
        include: {
          offers: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
          error: 'Product not found or does not belong to your vendor account'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Product retrieved successfully',
        data: { product }
      });

    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve product',
        error: 'Internal server error'
      });
    }
  }
);

// DELETE /:id/images/:imageUrl - Remove specific image
router.delete('/:id/images',
  clerkAuth,
  requireBasicVendorAccess,
  body('imageUrl').notEmpty().withMessage('Image URL is required'),
  handleValidationErrors,
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

      const productId = req.params.id;
      const { imageUrl } = req.body;

      // Check if product belongs to vendor
      const existingProduct = await prisma.product.findFirst({
        where: {
          id: productId,
          vendorId: req.user.vendor.id
        }
      });

      if (!existingProduct) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
          error: 'Product not found or does not belong to your vendor account'
        });
        return;
      }

      // Remove image URL from array
      const updatedImages = existingProduct.images.filter(img => img !== imageUrl);

      if (updatedImages.length === existingProduct.images.length) {
        res.status(404).json({
          success: false,
          message: 'Image not found',
          error: 'The specified image was not found in this product'
        });
        return;
      }

      // Update product
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { images: updatedImages }
      });

      // Try to delete from S3 (optional, don't fail if it doesn't work)
      try {
        await UploadService.deleteFile(imageUrl);
      } catch (deleteError) {
        console.warn('Failed to delete image from S3:', deleteError);
      }

      res.json({
        success: true,
        message: 'Image removed successfully',
        data: {
          product: updatedProduct,
          removedImage: imageUrl,
          remainingImages: updatedImages.length
        }
      });

    } catch (error) {
      console.error('Remove product image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove product image',
        error: 'Internal server error'
      });
    }
  }
);

export default router;