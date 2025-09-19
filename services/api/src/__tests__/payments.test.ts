import request from 'supertest'
import { createApp } from '../app'
import { mockPrismaClient } from './setup'

describe('Payment Integration Tests', () => {
  let app: any

  beforeEach(() => {
    app = createApp()
  })

  describe('POST /api/payments/create-order', () => {
    it('should create a Razorpay order successfully', async () => {
      const orderData = {
        amount: 10000, // 100 INR in paise
        items: [
          {
            productId: 'product123',
            quantity: 2,
            price: 5000
          }
        ]
      }

      const mockOrder = {
        id: 'order123',
        vendorId: 'vendor123',
        customerId: 'customer123',
        totalAmount: 10000,
        status: 'PENDING',
        items: orderData.items
      }

      mockPrismaClient.order.create.mockResolvedValue(mockOrder)
      mockPrismaClient.payment.create.mockResolvedValue({
        id: 'payment123',
        orderId: 'order123',
        razorpayOrderId: 'order_test123',
        amount: 10000,
        status: 'CREATED'
      })

      const response = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', 'Bearer valid-token')
        .send(orderData)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        order: expect.objectContaining({
          id: expect.any(String),
          amount: 10000
        }),
        razorpayOrder: expect.objectContaining({
          id: 'order_test123',
          amount: 10000,
          currency: 'INR'
        })
      })
    })

    it('should validate order amount', async () => {
      const invalidOrderData = {
        amount: -100,
        items: []
      }

      const response = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidOrderData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toContain('Amount must be positive')
    })

    it('should require authentication', async () => {
      const orderData = {
        amount: 10000,
        items: []
      }

      const response = await request(app)
        .post('/api/payments/create-order')
        .send(orderData)
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/payments/verify', () => {
    it('should verify payment successfully', async () => {
      const paymentData = {
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'valid_signature'
      }

      const mockPayment = {
        id: 'payment123',
        orderId: 'order123',
        razorpayOrderId: 'order_test123',
        amount: 10000,
        status: 'CREATED'
      }

      mockPrismaClient.payment.findUnique.mockResolvedValue(mockPayment)
      mockPrismaClient.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'COMPLETED',
        razorpayPaymentId: 'pay_test123'
      })
      mockPrismaClient.order.update.mockResolvedValue({
        id: 'order123',
        status: 'PAID'
      })

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', 'Bearer valid-token')
        .send(paymentData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        payment: expect.objectContaining({
          status: 'COMPLETED'
        })
      })

      expect(mockPrismaClient.payment.update).toHaveBeenCalledWith({
        where: { razorpayOrderId: paymentData.razorpay_order_id },
        data: {
          status: 'COMPLETED',
          razorpayPaymentId: paymentData.razorpay_payment_id,
          razorpaySignature: paymentData.razorpay_signature
        }
      })
    })

    it('should handle invalid signature', async () => {
      const paymentData = {
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'invalid_signature'
      }

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', 'Bearer valid-token')
        .send(paymentData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid payment signature')
    })
  })

  describe('POST /api/payments/refund', () => {
    it('should process refund successfully', async () => {
      const refundData = {
        paymentId: 'payment123',
        amount: 5000, // Partial refund
        reason: 'Product defective'
      }

      const mockPayment = {
        id: 'payment123',
        razorpayPaymentId: 'pay_test123',
        amount: 10000,
        status: 'COMPLETED'
      }

      mockPrismaClient.payment.findUnique.mockResolvedValue(mockPayment)

      // Mock Razorpay refund
      const mockRazorpay = require('razorpay')
      const razorpayInstance = new mockRazorpay()
      razorpayInstance.payments.refund = jest.fn().mockResolvedValue({
        id: 'rfnd_test123',
        payment_id: 'pay_test123',
        amount: 5000,
        status: 'processed'
      })

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', 'Bearer admin-token')
        .send(refundData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        refund: expect.objectContaining({
          id: 'rfnd_test123',
          amount: 5000
        })
      })
    })

    it('should require admin role for refunds', async () => {
      const refundData = {
        paymentId: 'payment123',
        amount: 5000
      }

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', 'Bearer customer-token')
        .send(refundData)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Admin access required')
    })
  })

  describe('Subscription Payment Flow', () => {
    it('should handle subscription payment creation', async () => {
      const subscriptionData = {
        plan: 'PREMIUM',
        vendorId: 'vendor123'
      }

      const mockSubscription = {
        id: 'sub123',
        vendorId: 'vendor123',
        plan: 'PREMIUM',
        amount: 99900, // 999 INR
        status: 'ACTIVE'
      }

      mockPrismaClient.subscription.create.mockResolvedValue(mockSubscription)

      const response = await request(app)
        .post('/api/payments/subscription')
        .set('Authorization', 'Bearer vendor-token')
        .send(subscriptionData)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        subscription: expect.objectContaining({
          plan: 'PREMIUM',
          status: 'ACTIVE'
        })
      })
    })

    it('should validate subscription plan', async () => {
      const invalidPlan = {
        plan: 'INVALID_PLAN',
        vendorId: 'vendor123'
      }

      const response = await request(app)
        .post('/api/payments/subscription')
        .set('Authorization', 'Bearer vendor-token')
        .send(invalidPlan)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })
})