import { PrismaClient } from '@prisma/client'

// Mock Prisma Client for testing
export const mockPrismaClient = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  vendor: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  product: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  offer: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  subscription: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
}

// Mock external services
jest.mock('@clerk/backend', () => ({
  createClerkClient: jest.fn(() => ({
    users: {
      getUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    }
  }))
}))

jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_test123',
        amount: 10000,
        currency: 'INR',
        status: 'created'
      }),
      fetch: jest.fn().mockResolvedValue({
        id: 'order_test123',
        status: 'paid'
      })
    },
    payments: {
      fetch: jest.fn().mockResolvedValue({
        id: 'pay_test123',
        order_id: 'order_test123',
        status: 'captured'
      })
    }
  }))
})

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    disconnect: jest.fn(),
  }))
})

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ MessageId: 'test-message-id' })
  })),
  SendEmailCommand: jest.fn().mockImplementation((params) => params)
}))

// Global test utilities
global.mockUser = {
  id: 'test-user-id',
  clerkId: 'clerk_test_123',
  email: 'test@example.com',
  role: 'CUSTOMER',
  createdAt: new Date(),
  updatedAt: new Date(),
}

global.mockVendor = {
  id: 'test-vendor-id',
  userId: 'test-user-id',
  businessName: 'Test Business',
  businessType: 'Restaurant',
  address: 'Test Address',
  phone: '+1234567890',
  isVerified: true,
  subscriptionPlan: 'BASIC',
  createdAt: new Date(),
  updatedAt: new Date(),
}

global.mockProduct = {
  id: 'test-product-id',
  vendorId: 'test-vendor-id',
  name: 'Test Product',
  description: 'Test Description',
  price: 99.99,
  category: 'Electronics',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => {
  jest.clearAllMocks()
})