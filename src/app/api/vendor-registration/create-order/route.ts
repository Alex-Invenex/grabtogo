import { NextRequest, NextResponse } from 'next/server';
import { RazorpayService } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'INR', vendorData } = await request.json();

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!vendorData) {
      return NextResponse.json({ error: 'Vendor data is required' }, { status: 400 });
    }

    // Create Razorpay order using centralized service
    const razorpayAmount = RazorpayService.convertToRazorpayAmount(amount);
    const razorpayOrder = await RazorpayService.createOrder({
      amount: razorpayAmount,
      currency,
      receipt: RazorpayService.generateReceiptId('vendor_reg'),
      notes: {
        type: 'vendor_registration',
        vendor_email: vendorData.email,
        vendor_name: vendorData.fullName,
        company_name: vendorData.companyName,
        selected_package: vendorData.selectedPackage,
        billing_cycle: vendorData.billingCycle,
      },
    });

    if (!razorpayOrder.success) {
      return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
    }

    return NextResponse.json({
      id: razorpayOrder.order!.id,
      amount: razorpayOrder.order!.amount,
      currency: razorpayOrder.order!.currency,
      receipt: razorpayOrder.order!.receipt,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
