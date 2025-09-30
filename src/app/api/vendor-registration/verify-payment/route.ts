import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, vendorData } =
      await request.json();

    // Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(vendorData.password, 12);

    // Create user and vendor profile in database
    const user = await db.user.create({
      data: {
        name: vendorData.fullName,
        email: vendorData.email,
        password: hashedPassword,
        phone: vendorData.phone,
        role: 'VENDOR',
        emailVerified: new Date(), // Auto-verify for paid registrations
      },
    });

    // Create vendor profile
    const vendorProfile = await db.vendorProfile.create({
      data: {
        userId: user.id,
        storeName: vendorData.companyName,
        storeSlug: vendorData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: vendorData.tagline,
        address: `${vendorData.addressLine1}${vendorData.addressLine2 ? ', ' + vendorData.addressLine2 : ''}`,
        city: vendorData.city,
        state: 'Kerala', // Always set to Kerala since we only operate there
        zipCode: vendorData.pinCode,
        deliveryRadius: vendorData.deliveryRadius,
        latitude: vendorData.coordinates?.lat,
        longitude: vendorData.coordinates?.lng,
        businessLicense: vendorData.gstNumber,
      },
    });

    // For now, we'll skip creating order/payment records in the database
    // since the schema requires complex relationships. In production,
    // you would create the proper order and payment records.

    // Log the payment for reference
    console.log('Vendor registration payment completed:', {
      userId: user.id,
      vendorId: vendorProfile.id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: 299 + 299 * 0.18,
      type: 'vendor_registration',
    });

    // Create subscription if package selected
    if (vendorData.selectedPackage) {
      const packagePrices = {
        basic: { monthly: 99, yearly: 999 },
        standard: { monthly: 199, yearly: 1999 },
        premium: { monthly: 299, yearly: 2999 },
      };

      const price = packagePrices[vendorData.selectedPackage as keyof typeof packagePrices];
      const amount = vendorData.billingCycle === 'yearly' ? price.yearly : price.monthly;

      await db.vendorSubscription.create({
        data: {
          vendorId: vendorProfile.id,
          planType: vendorData.selectedPackage,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(
            Date.now() + (vendorData.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
          ),
          amount,
          billingCycle: vendorData.billingCycle,
          autoRenew: true,
        },
      });
    }

    // Send confirmation email to vendor
    try {
      await sendEmail({
        to: vendorData.email,
        subject: 'Welcome to GrabtoGo - Registration Successful!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3B82F6;">Welcome to GrabtoGo!</h1>
            <p>Dear ${vendorData.fullName},</p>
            <p>Thank you for registering as a vendor with GrabtoGo. Your payment has been successfully processed.</p>

            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2>Registration Details:</h2>
              <ul>
                <li><strong>Business Name:</strong> ${vendorData.companyName}</li>
                <li><strong>Email:</strong> ${vendorData.email}</li>
                <li><strong>Phone:</strong> ${vendorData.phone}</li>
                <li><strong>Registration Fee:</strong> ₹353 (including GST)</li>
                <li><strong>Package:</strong> ${vendorData.selectedPackage?.toUpperCase() || 'None'}</li>
              </ul>
            </div>

            <p><strong>What's Next?</strong></p>
            <ol>
              <li>Our team will review your application within 24-48 hours</li>
              <li>You will receive an email once your account is approved</li>
              <li>Once approved, you can access your vendor dashboard</li>
            </ol>

            <p>If you have any questions, please contact us at <a href="mailto:info@grabtogo.in">info@grabtogo.in</a></p>

            <p>Thank you for choosing GrabtoGo!</p>
            <p><strong>The GrabtoGo Team</strong></p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    // Send notification to admin
    try {
      await sendEmail({
        to: 'info@grabtogo.in',
        subject: 'New Vendor Registration - Pending Approval',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h1>New Vendor Registration</h1>
            <p>A new vendor has completed registration and payment:</p>

            <h2>Vendor Details:</h2>
            <ul>
              <li><strong>Name:</strong> ${vendorData.fullName}</li>
              <li><strong>Business:</strong> ${vendorData.companyName}</li>
              <li><strong>Email:</strong> ${vendorData.email}</li>
              <li><strong>Phone:</strong> ${vendorData.phone}</li>
              <li><strong>GST:</strong> ${vendorData.gstNumber}</li>
              <li><strong>Location:</strong> ${vendorData.city}, ${vendorData.state}</li>
              <li><strong>Package:</strong> ${vendorData.selectedPackage?.toUpperCase() || 'None'}</li>
              <li><strong>Agent Code:</strong> ${vendorData.agentCode}</li>
            </ul>

            <p><strong>Action Required:</strong> Please review and approve this vendor registration in the admin dashboard.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and vendor registered successfully',
      vendorId: vendorProfile.id,
      userId: user.id,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
