import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { RazorpayService } from '@/lib/razorpay'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const paymentData = verifyPaymentSchema.parse(body)

    // Verify payment signature
    const isValidSignature = RazorpayService.verifyPaymentSignature(paymentData)

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Find payment record
    const payment = await db.payment.findUnique({
      where: {
        razorpayOrderId: paymentData.razorpay_order_id,
      },
      include: {
        order: true,
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      )
    }

    // Update payment status
    await db.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        razorpayPaymentId: paymentData.razorpay_payment_id,
        status: 'COMPLETED',
        gatewayResponse: paymentData,
      },
    })

    // Update order status
    await db.order.update({
      where: {
        id: payment.orderId,
      },
      data: {
        status: 'CONFIRMED',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      orderId: payment.orderId,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
