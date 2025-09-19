import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '@clerk/backend'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ClerkRequest extends Request {
  userId?: string
  clerkUser?: any
  user?: any
}

export const clerkAuth = async (req: ClerkRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    // Verify Clerk token
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!
    })

    if (!payload.sub) {
      return res.status(401).json({ success: false, message: 'Invalid token' })
    }

    // Get or create user in our database
    let user = await prisma.user.findFirst({
      where: { clerkId: payload.sub },
      include: {
        customer: true,
        vendor: true
      }
    })

    // If user doesn't exist, try to find by email and link Clerk ID
    if (!user && payload.email) {
      user = await prisma.user.findFirst({
        where: { email: payload.email },
        include: {
          customer: true,
          vendor: true
        }
      })

      // Link existing user to Clerk
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { clerkId: payload.sub },
          include: {
            customer: true,
            vendor: true
          }
        })
      }
    }

    // Create new user if doesn't exist
    if (!user && payload.email) {
      // Get role from Clerk metadata
      const metadata = payload as any;
      const role = metadata.metadata?.role || metadata.publicMetadata?.role || metadata.unsafeMetadata?.role || 'CUSTOMER'

      user = await prisma.user.create({
        data: {
          clerkId: payload.sub,
          email: metadata.email || '',
          role: role as any,
          isVerified: metadata.emailVerified || false
        },
        include: {
          customer: true,
          vendor: true
        }
      })

      // Create corresponding customer or vendor record
      if (role === 'CUSTOMER' && user) {
        await prisma.customer.create({
          data: {
            userId: user.id,
            firstName: metadata.firstName || '',
            lastName: metadata.lastName || ''
          }
        })
      } else if (role === 'VENDOR' && user) {
        await prisma.vendor.create({
          data: {
            userId: user.id,
            companyName: metadata.firstName && metadata.lastName
              ? `${metadata.firstName} ${metadata.lastName}`
              : 'New Vendor',
            address: ''
          }
        })
      }

      // Refresh user with relations
      if (user) {
        user = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            customer: true,
            vendor: true
          }
        })
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    // Attach user data to request
    req.userId = user.id
    req.clerkUser = payload
    req.user = user

    next()
  } catch (error) {
    console.error('Clerk auth error:', error)
    return res.status(401).json({ success: false, message: 'Authentication failed' })
  }
}

export const requireRole = (allowedRoles: string[]) => {
  return (req: ClerkRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' })
    }

    next()
  }
}

export const requireCustomer = requireRole(['CUSTOMER'])
export const requireVendor = requireRole(['VENDOR'])
export const requireAdmin = requireRole(['ADMIN'])

// Optional auth - doesn't fail if no token
export const optionalClerkAuth = async (req: ClerkRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return next()
    }

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!
    })

    if (payload.sub) {
      const user = await prisma.user.findFirst({
        where: { clerkId: payload.sub },
        include: {
          customer: true,
          vendor: true
        }
      })

      if (user) {
        req.userId = user.id
        req.clerkUser = payload
        req.user = user
      }
    }
  } catch (error) {
    console.warn('Optional Clerk auth warning:', error)
  }

  next()
}