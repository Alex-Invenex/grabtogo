import request from 'supertest'
import { createApp } from '../app'
import { mockPrismaClient } from './setup'

describe('Authentication', () => {
  let app: any

  beforeEach(() => {
    app = createApp()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new customer', async () => {
      const userData = {
        email: 'newuser@example.com',
        clerkId: 'clerk_new_user',
        role: 'CUSTOMER'
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(null)
      mockPrismaClient.user.create.mockResolvedValue({
        id: 'user123',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        user: expect.objectContaining({
          email: userData.email,
          role: userData.role
        })
      })

      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: userData
      })
    })

    it('should register a new vendor', async () => {
      const userData = {
        email: 'vendor@example.com',
        clerkId: 'clerk_vendor',
        role: 'VENDOR'
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(null)
      mockPrismaClient.user.create.mockResolvedValue({
        id: 'vendor123',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.user.role).toBe('VENDOR')
    })

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        clerkId: 'clerk_existing',
        role: 'CUSTOMER'
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(global.mockUser)

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'User already exists'
      })
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return user profile for authenticated user', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'CUSTOMER',
        clerkId: 'clerk_test'
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        user: expect.objectContaining({
          email: mockUser.email,
          role: mockUser.role
        })
      })
    })

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })
})