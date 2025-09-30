import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Lazy initialization of Razorpay client
let razorpayInstance: Razorpay | null = null;

function getRazorpayClient() {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return razorpayInstance;
}

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

    // Create Razorpay order
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Amount in paisa
      currency,
      receipt: `vendor_reg_${Date.now()}`,
      notes: {
        type: 'vendor_registration',
        vendor_email: vendorData.email,
        vendor_name: vendorData.fullName,
        company_name: vendorData.companyName,
        selected_package: vendorData.selectedPackage,
        billing_cycle: vendorData.billingCycle,
      },
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
