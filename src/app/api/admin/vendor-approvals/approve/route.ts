import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Fetch the registration request
    const registrationRequest = await db.vendorRegistrationRequest.findUnique({
      where: { id: requestId },
    });

    if (!registrationRequest) {
      return NextResponse.json({ error: 'Registration request not found' }, { status: 404 });
    }

    if (registrationRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Registration request has already been processed' },
        { status: 400 }
      );
    }

    // Create user account
    const user = await db.user.create({
      data: {
        name: registrationRequest.fullName,
        email: registrationRequest.email,
        phone: registrationRequest.phone,
        password: registrationRequest.password, // Already hashed
        role: 'VENDOR',
        emailVerified: new Date(), // Auto-verify on approval
      },
    });

    // Create vendor profile with location
    // Combine address lines into single address field
    const fullAddress = [
      registrationRequest.addressLine1,
      registrationRequest.addressLine2,
    ]
      .filter(Boolean)
      .join(', ');

    const vendorProfile = await db.vendorProfile.create({
      data: {
        userId: user.id,
        storeName: registrationRequest.companyName,
        storeSlug: registrationRequest.companyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        description: registrationRequest.tagline || null,
        logoUrl: registrationRequest.logo || null,
        bannerUrl: registrationRequest.banner || null,
        isVerified: registrationRequest.gstVerified || false,
        businessLicense: registrationRequest.gstNumber || null,
        address: fullAddress,
        city: registrationRequest.city,
        state: registrationRequest.state,
        zipCode: registrationRequest.pinCode,
        latitude: registrationRequest.latitude,
        longitude: registrationRequest.longitude,
        deliveryRadius: registrationRequest.deliveryRadius,
      },
    });

    // Create 20-day premium trial subscription
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 20);

    await db.vendorSubscription.create({
      data: {
        vendorId: user.id, // subscriptions link to user.id, not vendorProfile.id
        planType: 'premium',
        billingCycle: 'monthly',
        status: 'trial',
        startDate: new Date(),
        endDate: trialEndDate,
        isTrial: true,
        trialEndsAt: trialEndDate,
        autoRenew: false,
        // Premium plan limits
        maxProducts: 1000,
        maxOrders: 10000,
        storageLimit: 10000, // 10GB in MB
        analyticsAccess: true,
        prioritySupport: true,
        // Billing info
        amount: 299, // Premium monthly price
        currency: 'INR',
      },
    });

    // Update registration request status
    await db.vendorRegistrationRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: session.user.id,
      },
    });

    // Send approval email to vendor
    try {
      await sendEmail({
        to: registrationRequest.email,
        subject: '🎉 Your GrabtoGo Vendor Account Has Been Approved!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your Account is Approved</p>
            </div>

            <div style="padding: 30px;">
              <h2 style="color: #333; margin-bottom: 20px;">Welcome to GrabtoGo, ${registrationRequest.fullName}!</h2>
              <p style="color: #666; line-height: 1.6;">We're excited to inform you that your vendor registration has been approved! Your account is now active and ready to use.</p>

              <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                <h3 style="color: #2e7d32; margin-top: 0;">🎁 Your Premium Trial is Active!</h3>
                <p style="color: #2e7d32; margin: 10px 0;"><strong>Duration:</strong> 20 Days FREE Premium Access</p>
                <p style="color: #2e7d32; margin: 10px 0;"><strong>Trial Ends:</strong> ${trialEndDate.toLocaleDateString()}</p>
                <ul style="color: #2e7d32; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
                  <li>Unlimited products and orders</li>
                  <li>Advanced analytics dashboard</li>
                  <li>Priority customer support</li>
                  <li>Enhanced store customization</li>
                  <li>Featured listing opportunities</li>
                </ul>
              </div>

              <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="color: #333; margin-top: 0;">Login Details</h3>
                <p style="color: #666; margin: 10px 0;"><strong>Email:</strong> ${registrationRequest.email}</p>
                <p style="color: #666; margin: 10px 0;"><strong>Password:</strong> (The password you set during registration)</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login"
                   style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Login to Your Dashboard
                </a>
              </div>

              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #856404; margin-top: 0;">Next Steps</h3>
                <ol style="color: #856404; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Login to your vendor dashboard</li>
                  <li>Complete your store profile</li>
                  <li>Add your products and services</li>
                  <li>Start receiving orders from customers</li>
                </ol>
              </div>

              <p style="color: #666; line-height: 1.6;">If you have any questions or need assistance, please don't hesitate to contact us at <a href="mailto:info@grabtogo.in" style="color: #667eea;">info@grabtogo.in</a></p>

              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #999; font-size: 14px;">Happy Selling!</p>
                <p style="color: #333; font-weight: bold;">The GrabtoGo Team</p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor approved successfully',
      userId: user.id,
      vendorId: vendorProfile.id,
    });
  } catch (error) {
    console.error('Error approving vendor:', error);
    return NextResponse.json({ error: 'Failed to approve vendor' }, { status: 500 });
  }
}
