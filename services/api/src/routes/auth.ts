import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { clerkAuth } from '../middleware/clerk';
import { ApiResponse } from '../types/api';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types/auth';
import { generateToken } from '../utils/jwt';
import { Webhook } from 'svix';

const router = express.Router();
const prisma = new PrismaClient();

// Custom Authentication Endpoints

// Register new user
router.post('/register', async (req: express.Request<{}, AuthResponse, RegisterRequest>, res: express.Response<AuthResponse>) => {
  try {
    const { email, password, phone, role, firstName, lastName, companyName, gstNumber, address, latitude, longitude, categories } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      res.status(400).json({
        success: false,
        message: 'Email, password, and role are required',
        error: 'Missing required fields'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User already exists with this email',
        error: 'Duplicate email address'
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        phone,
        role,
        isVerified: false,
        isActive: true
      }
    });

    // Create role-specific profile
    if (role === 'CUSTOMER') {
      await prisma.customer.create({
        data: {
          userId: user.id,
          firstName: firstName || '',
          lastName: lastName || '',
          isActive: true
        }
      });
    } else if (role === 'VENDOR') {
      // Calculate trial end date (30 days)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + (parseInt(process.env.TRIAL_PERIOD_DAYS || '30')));

      await prisma.vendor.create({
        data: {
          userId: user.id,
          companyName: companyName || `${firstName} ${lastName}` || 'New Vendor',
          gstNumber,
          address: address || '',
          latitude,
          longitude,
          trialEndsAt,
          categories: categories || [],
          subscriptionStatus: 'TRIAL',
          isApproved: false,
          registrationFeePaid: false,
          isActive: true,
          totalRatings: 0
        }
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Fetch complete user data
    const completeUser = await prisma.user.findUnique({
      where: { id: user.id },
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

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: completeUser!
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: 'Internal server error'
    });
  }
});

// Login user
router.post('/login', async (req: express.Request<{}, AuthResponse, LoginRequest>, res: express.Response<AuthResponse>) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
        error: 'Missing credentials'
      });
      return;
    }

    // Find user with complete data
    const user = await prisma.user.findUnique({
      where: { email },
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
        message: 'Invalid email or password',
        error: 'User not found'
      });
      return;
    }

    if (!user.password) {
      res.status(401).json({
        success: false,
        message: 'Please use social login or reset your password',
        error: 'No password set for this account'
      });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'Incorrect password'
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        error: 'Please contact support to reactivate your account'
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userWithoutPassword
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: 'Internal server error'
    });
  }
});

// Webhook endpoint for Clerk user creation and updates
router.post('/webhooks/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Missing CLERK_WEBHOOK_SECRET');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    const wh = new Webhook(webhookSecret);
    let evt;

    try {
      evt = wh.verify(req.body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }

    const { type, data } = evt as any;

    switch (type) {
      case 'user.created':
      case 'user.updated':
        await handleUserSync(data);
        break;
      case 'user.deleted':
        await handleUserDeletion(data.id);
        break;
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to sync user data from Clerk webhook
async function handleUserSync(clerkUser: any) {
  try {
    const role = clerkUser.unsafe_metadata?.role || clerkUser.public_metadata?.role || 'CUSTOMER';
    const email = clerkUser.email_addresses?.[0]?.email_address;

    if (!email) {
      console.error('No email found for Clerk user:', clerkUser.id);
      return;
    }

    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: { clerkId: clerkUser.id }
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email,
          isVerified: clerkUser.email_addresses?.[0]?.verification?.status === 'verified',
          role: role as any
        }
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email,
          role: role as any,
          isVerified: clerkUser.email_addresses?.[0]?.verification?.status === 'verified'
        }
      });

      // Create corresponding profile based on role
      if (role === 'CUSTOMER') {
        await prisma.customer.create({
          data: {
            userId: user.id,
            firstName: clerkUser.first_name || '',
            lastName: clerkUser.last_name || ''
          }
        });
      } else if (role === 'VENDOR') {
        // Calculate trial end date (30 days)
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + (parseInt(process.env.TRIAL_PERIOD_DAYS || '30')));

        await prisma.vendor.create({
          data: {
            userId: user.id,
            companyName: clerkUser.first_name && clerkUser.last_name
              ? `${clerkUser.first_name} ${clerkUser.last_name}`
              : 'New Vendor',
            address: '',
            trialEndsAt,
            categories: []
          }
        });
      }
    }

    console.log('User synced successfully:', user.id);
  } catch (error) {
    console.error('User sync error:', error);
    throw error;
  }
}

// Helper function to handle user deletion
async function handleUserDeletion(clerkId: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { clerkId }
    });

    if (user) {
      await prisma.user.delete({
        where: { id: user.id }
      });
      console.log('User deleted successfully:', user.id);
    }
  } catch (error) {
    console.error('User deletion error:', error);
    throw error;
  }
}

// Get current user profile (using Clerk auth)
router.get('/me', clerkAuth, async (req: express.Request, res: express.Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'No user found in request'
      });
      return;
    }

    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: req.user,
        clerkUser: req.clerkUser
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
      error: 'Internal server error'
    });
  }
});

// Health check for auth service
router.get('/health', (req, res: express.Response<ApiResponse>) => {
  res.json({
    success: true,
    message: 'Auth service is healthy',
    data: {
      service: 'auth',
      provider: 'clerk',
      timestamp: new Date().toISOString()
    }
  });
});

export default router;