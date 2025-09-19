import request from 'supertest'
import { createApp } from '../../app'
import { mockPrismaClient } from '../setup'

describe('End-to-End User Journeys', () => {
  let app: any

  beforeEach(() => {
    app = createApp()
  })

  describe('Customer Journey: Browse → Order → Pay', () => {
    it('should complete full customer journey', async () => {
      // Step 1: Customer registers
      const customerData = {
        email: 'customer@test.com',
        clerkId: 'clerk_customer_123',
        role: 'CUSTOMER'
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(null)
      mockPrismaClient.user.create.mockResolvedValue({
        id: 'customer123',
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(customerData)
        .expect(201)

      expect(registerResponse.body.success).toBe(true)

      // Step 2: Browse vendors
      const mockVendors = [
        {
          id: 'vendor1',
          businessName: 'Test Restaurant',
          businessType: 'Restaurant',
          isVerified: true,
          subscriptionPlan: 'BASIC'
        },
        {
          id: 'vendor2',
          businessName: 'Tech Store',
          businessType: 'Electronics',
          isVerified: true,
          subscriptionPlan: 'PREMIUM'
        }
      ]

      mockPrismaClient.vendor.findMany.mockResolvedValue(mockVendors)

      const vendorsResponse = await request(app)
        .get('/api/vendors')
        .set('Authorization', 'Bearer customer-token')
        .expect(200)

      expect(vendorsResponse.body.vendors).toHaveLength(2)

      // Step 3: Browse products
      const mockProducts = [
        {
          id: 'product1',
          vendorId: 'vendor1',
          name: 'Burger Combo',
          price: 299,
          category: 'Food',
          isActive: true
        },
        {
          id: 'product2',
          vendorId: 'vendor1',
          name: 'Pizza Special',
          price: 499,
          category: 'Food',
          isActive: true
        }
      ]

      mockPrismaClient.product.findMany.mockResolvedValue(mockProducts)

      const productsResponse = await request(app)
        .get('/api/products?vendorId=vendor1')
        .set('Authorization', 'Bearer customer-token')
        .expect(200)

      expect(productsResponse.body.products).toHaveLength(2)

      // Step 4: Add to cart and create order
      const orderData = {
        vendorId: 'vendor1',
        items: [
          {
            productId: 'product1',
            quantity: 1,
            price: 299
          },
          {
            productId: 'product2',
            quantity: 1,
            price: 499
          }
        ],
        totalAmount: 798
      }

      const mockOrder = {
        id: 'order123',
        customerId: 'customer123',
        vendorId: 'vendor1',
        totalAmount: 798,
        status: 'PENDING',
        items: orderData.items
      }

      mockPrismaClient.order.create.mockResolvedValue(mockOrder)
      mockPrismaClient.payment.create.mockResolvedValue({
        id: 'payment123',
        orderId: 'order123',
        razorpayOrderId: 'order_test123',
        amount: 798,
        status: 'CREATED'
      })

      const orderResponse = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', 'Bearer customer-token')
        .send(orderData)
        .expect(201)

      expect(orderResponse.body.success).toBe(true)
      expect(orderResponse.body.order.totalAmount).toBe(798)

      // Step 5: Complete payment
      const paymentData = {
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'valid_signature'
      }

      mockPrismaClient.payment.findUnique.mockResolvedValue({
        id: 'payment123',
        orderId: 'order123',
        razorpayOrderId: 'order_test123',
        amount: 798,
        status: 'CREATED'
      })

      mockPrismaClient.payment.update.mockResolvedValue({
        id: 'payment123',
        status: 'COMPLETED',
        razorpayPaymentId: 'pay_test123'
      })

      mockPrismaClient.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'PAID'
      })

      const paymentResponse = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', 'Bearer customer-token')
        .send(paymentData)
        .expect(200)

      expect(paymentResponse.body.success).toBe(true)
      expect(paymentResponse.body.payment.status).toBe('COMPLETED')

      // Step 6: Check order status
      mockPrismaClient.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: 'PAID'
      })

      const orderStatusResponse = await request(app)
        .get('/api/orders/order123')
        .set('Authorization', 'Bearer customer-token')
        .expect(200)

      expect(orderStatusResponse.body.order.status).toBe('PAID')
    })
  })

  describe('Vendor Journey: Register → Setup → Manage', () => {
    it('should complete vendor onboarding and management', async () => {
      // Step 1: Vendor registers
      const vendorUserData = {
        email: 'vendor@test.com',
        clerkId: 'clerk_vendor_123',
        role: 'VENDOR'
      }

      mockPrismaClient.user.findUnique.mockResolvedValue(null)
      mockPrismaClient.user.create.mockResolvedValue({
        id: 'vendor_user123',
        ...vendorUserData,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(vendorUserData)
        .expect(201)

      expect(registerResponse.body.success).toBe(true)

      // Step 2: Setup vendor profile
      const vendorProfileData = {
        businessName: 'Amazing Restaurant',
        businessType: 'Restaurant',
        address: '123 Food Street, City',
        phone: '+1234567890',
        description: 'Best food in town'
      }

      const mockVendorProfile = {
        id: 'vendor123',
        userId: 'vendor_user123',
        ...vendorProfileData,
        isVerified: false,
        subscriptionPlan: 'BASIC'
      }

      mockPrismaClient.vendor.create.mockResolvedValue(mockVendorProfile)

      const profileResponse = await request(app)
        .post('/api/vendors/profile')
        .set('Authorization', 'Bearer vendor-token')
        .send(vendorProfileData)
        .expect(201)

      expect(profileResponse.body.success).toBe(true)
      expect(profileResponse.body.vendor.businessName).toBe('Amazing Restaurant')

      // Step 3: Add products
      const productData = {
        name: 'Special Burger',
        description: 'Our signature burger',
        price: 299,
        category: 'Food',
        images: ['burger1.jpg', 'burger2.jpg']
      }

      const mockProduct = {
        id: 'product123',
        vendorId: 'vendor123',
        ...productData,
        isActive: true
      }

      mockPrismaClient.product.create.mockResolvedValue(mockProduct)

      const productResponse = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer vendor-token')
        .send(productData)
        .expect(201)

      expect(productResponse.body.success).toBe(true)
      expect(productResponse.body.product.name).toBe('Special Burger')

      // Step 4: Create offers
      const offerData = {
        title: '20% Off Today!',
        description: 'Get 20% off on all items',
        discountPercentage: 20,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isActive: true
      }

      const mockOffer = {
        id: 'offer123',
        vendorId: 'vendor123',
        ...offerData
      }

      mockPrismaClient.offer.create.mockResolvedValue(mockOffer)

      const offerResponse = await request(app)
        .post('/api/offers')
        .set('Authorization', 'Bearer vendor-token')
        .send(offerData)
        .expect(201)

      expect(offerResponse.body.success).toBe(true)
      expect(offerResponse.body.offer.discountPercentage).toBe(20)

      // Step 5: View analytics
      const mockAnalytics = {
        totalOrders: 45,
        totalRevenue: 12500,
        averageOrderValue: 278,
        topProducts: [mockProduct]
      }

      mockPrismaClient.order.findMany.mockResolvedValue([])
      mockPrismaClient.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 12500 },
        _count: { id: 45 }
      })

      const analyticsResponse = await request(app)
        .get('/api/vendors/analytics')
        .set('Authorization', 'Bearer vendor-token')
        .expect(200)

      expect(analyticsResponse.body.success).toBe(true)
    })
  })

  describe('Admin Journey: Monitor → Manage → Report', () => {
    it('should complete admin management workflow', async () => {
      // Step 1: View dashboard metrics
      mockPrismaClient.user.count.mockResolvedValue(1500)
      mockPrismaClient.vendor.count.mockResolvedValue(150)
      mockPrismaClient.order.count.mockResolvedValue(5000)

      const dashboardResponse = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer admin-token')
        .expect(200)

      expect(dashboardResponse.body.success).toBe(true)

      // Step 2: Review vendor approvals
      const pendingVendors = [
        {
          id: 'vendor_pending1',
          businessName: 'New Restaurant',
          isVerified: false,
          documents: ['license.pdf', 'tax.pdf']
        }
      ]

      mockPrismaClient.vendor.findMany.mockResolvedValue(pendingVendors)

      const pendingResponse = await request(app)
        .get('/api/admin/vendors/pending')
        .set('Authorization', 'Bearer admin-token')
        .expect(200)

      expect(pendingResponse.body.vendors).toHaveLength(1)

      // Step 3: Approve vendor
      mockPrismaClient.vendor.update.mockResolvedValue({
        ...pendingVendors[0],
        isVerified: true
      })

      const approvalResponse = await request(app)
        .post('/api/admin/vendors/vendor_pending1/approve')
        .set('Authorization', 'Bearer admin-token')
        .expect(200)

      expect(approvalResponse.body.success).toBe(true)

      // Step 4: View financial reports
      const mockFinancials = {
        totalRevenue: 250000,
        platformFees: 25000,
        vendorPayouts: 225000,
        transactionCount: 2000
      }

      const financialResponse = await request(app)
        .get('/api/admin/financials')
        .set('Authorization', 'Bearer admin-token')
        .expect(200)

      expect(financialResponse.body.success).toBe(true)
    })
  })
})