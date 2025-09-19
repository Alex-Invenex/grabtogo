import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../utils/jwt';
import { ApiResponse, CustomError } from '../types/api';
import '../types/express';

const prisma = new PrismaClient();

export const authenticateToken = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'No token provided'
      });
      return;
    }

    // Verify the token
    const decoded = verifyToken(token);

    // Fetch user with related data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true,
            gstNumber: true,
            address: true,
            latitude: true,
            longitude: true,
            subscriptionStatus: true,
            trialEndsAt: true,
            isApproved: true,
            registrationFeePaid: true,
            averageRating: true,
            totalRatings: true,
            isActive: true,
            businessHours: true,
            categories: true
          }
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            latitude: true,
            longitude: true,
            address: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'Invalid token - user does not exist'
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        error: 'User account is not active'
      });
      return;
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        res.status(401).json({
          success: false,
          message: 'Token has expired',
          error: 'Please login again'
        });
        return;
      }

      if (error.message.includes('invalid') || error.message.includes('Invalid')) {
        res.status(401).json({
          success: false,
          message: 'Invalid token',
          error: 'Please login again'
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: 'Internal server error'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'No user found in request'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: `Required role: ${roles.join(' or ')}`
      });
      return;
    }

    next();
  };
};

export const requireVendor = requireRole(['VENDOR']);
export const requireCustomer = requireRole(['CUSTOMER']);
export const requireAdmin = requireRole(['ADMIN']);