import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cache } from '@/lib/redis'
import { razorpay } from '@/lib/razorpay'
import { z } from 'zod'

const createSubscriptionSchema = z.object({
  planType: z.enum(['basic', 'premium', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
})

const subscriptionPlans = {
  basic: {
    monthly: { amount: 9900, maxProducts: 10, maxOrders: 100, storageLimit: 1000 }, // ₹99
    yearly: { amount: 99000, maxProducts: 10, maxOrders: 100, storageLimit: 1000 }, // ₹990
  },
  premium: {
    monthly: { amount: 19900, maxProducts: 50, maxOrders: 500, storageLimit: 5000, analyticsAccess: true }, // ₹199
    yearly: { amount: 199000, maxProducts: 50, maxOrders: 500, storageLimit: 5000, analyticsAccess: true }, // ₹1990
  },
  enterprise: {
    monthly: { amount: 29900, maxProducts: -1, maxOrders: -1, storageLimit: 20000, analyticsAccess: true, prioritySupport: true }, // ₹299
    yearly: { amount: 299000, maxProducts: -1, maxOrders: -1, storageLimit: 20000, analyticsAccess: true, prioritySupport: true }, // ₹2990
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role
    if (userRole !== 'VENDOR') {
      return NextResponse.json(
        { error: 'Only vendors can create subscriptions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createSubscriptionSchema.parse(body)

    // Check if vendor already has an active subscription
    const existingSubscription = await db.vendorSubscription.findUnique({
      where: { vendorId: session.user.id! },
    })

    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      )
    }

    const plan = subscriptionPlans[validatedData.planType][validatedData.billingCycle]

    // Calculate subscription period
    const startDate = new Date()
    const endDate = new Date()
    if (validatedData.billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    // Create Razorpay order for subscription payment
    if (!razorpay) {
      return NextResponse.json(
        { error: 'Payment service not available' },
        { status: 500 }
      )
    }

    const orderResult = await razorpay.orders.create({
      amount: plan.amount,
      currency: 'INR',
      receipt: `subscription_${session.user.id}_${Date.now()}`,
      notes: {
        planType: validatedData.planType,
        billingCycle: validatedData.billingCycle,
        vendorId: session.user.id!,
      }
    })

    if (!orderResult) {
      return NextResponse.json(
        { error: 'Failed to create payment order' },
        { status: 500 }
      )
    }

    // Create subscription record
    const subscription = await db.vendorSubscription.create({
      data: {
        vendorId: session.user.id!,
        planType: validatedData.planType,
        status: 'active', // Will be activated after payment
        startDate,
        endDate,
        billingCycle: validatedData.billingCycle,
        amount: plan.amount / 100, // Convert paise to rupees
        maxProducts: plan.maxProducts,
        maxOrders: plan.maxOrders,
        storageLimit: plan.storageLimit,
        analyticsAccess: 'analyticsAccess' in plan ? plan.analyticsAccess : false,
        prioritySupport: 'prioritySupport' in plan ? plan.prioritySupport : false,
      }
    })

    // Create initial payment record
    await db.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        amount: plan.amount / 100,
        status: 'pending',
        razorpayOrderId: orderResult.id,
        billingPeriodStart: startDate,
        billingPeriodEnd: endDate,
      }
    })

    // Clear cache
    await cache.del(`subscription:vendor:${session.user.id}`)

    return NextResponse.json({
      message: 'Subscription created successfully',
      subscription,
      paymentOrder: orderResult
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role
    if (userRole !== 'VENDOR' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    let vendorId = session.user.id!

    // Admins can query specific vendor subscriptions
    if (userRole === 'ADMIN') {
      const { searchParams } = new URL(request.url)
      const queryVendorId = searchParams.get('vendorId')
      if (queryVendorId) {
        vendorId = queryVendorId
      }
    }

    // Try cache first
    const cacheKey = `subscription:vendor:${vendorId}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Get vendor's subscription
    const subscription = await db.vendorSubscription.findUnique({
      where: { vendorId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!subscription) {
      return NextResponse.json({
        message: 'No subscription found',
        subscription: null,
        availablePlans: subscriptionPlans
      })
    }

    // Calculate usage statistics
    const [productCount, orderCount] = await Promise.all([
      db.product.count({
        where: { vendorId }
      }),
      db.order.count({
        where: {
          items: {
            some: {
              product: { vendorId }
            }
          },
          createdAt: {
            gte: subscription.startDate,
            lte: subscription.endDate
          }
        }
      })
    ])

    const usage = {
      products: {
        used: productCount,
        limit: subscription.maxProducts,
        percentage: subscription.maxProducts > 0
          ? Math.round((productCount / subscription.maxProducts) * 100)
          : 0
      },
      orders: {
        used: orderCount,
        limit: subscription.maxOrders,
        percentage: subscription.maxOrders > 0
          ? Math.round((orderCount / subscription.maxOrders) * 100)
          : 0
      }
    }

    const result = {
      subscription,
      usage,
      availablePlans: subscriptionPlans
    }

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}