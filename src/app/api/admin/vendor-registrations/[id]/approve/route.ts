import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const requestId = params.id;

    // Get the registration request
    const registrationRequest = await db.vendorRegistrationRequest.findUnique({
      where: { id: requestId },
    });

    if (!registrationRequest) {
      return NextResponse.json({ error: 'Registration request not found' }, { status: 404 });
    }

    if (registrationRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Registration request has already been processed' },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await db.user.findUnique({
      where: { email: registrationRequest.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // Create user and vendor profile in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: registrationRequest.fullName,
          email: registrationRequest.email,
          password: registrationRequest.password, // Already hashed
          phone: registrationRequest.phone,
          role: 'VENDOR',
          emailVerified: new Date(), // Auto-verify approved vendors
        },
      });

      // Create vendor profile
      const vendorProfile = await tx.vendorProfile.create({
        data: {
          userId: user.id,
          storeName: registrationRequest.companyName,
          storeSlug: registrationRequest.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          description: registrationRequest.tagline,
          address: `${registrationRequest.addressLine1}${registrationRequest.addressLine2 ? ', ' + registrationRequest.addressLine2 : ''}`,
          city: registrationRequest.city,
          state: registrationRequest.state,
          zipCode: registrationRequest.pinCode,
          deliveryRadius: registrationRequest.deliveryRadius,
          latitude: registrationRequest.latitude,
          longitude: registrationRequest.longitude,
          businessLicense: registrationRequest.gstNumber,
          logoUrl: registrationRequest.logo,
          bannerUrl: registrationRequest.banner,
          isVerified: true, // Auto-verify approved vendors
        },
      });

      // Create 20-day premium trial subscription
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 20);

      const subscription = await tx.vendorSubscription.create({
        data: {
          vendorId: user.id,
          planType: 'premium',
          status: 'trial',
          startDate: new Date(),
          endDate: trialEndDate,
          isTrial: true,
          trialEndsAt: trialEndDate,
          autoRenew: false, // Don't auto-renew trial

          // Premium plan limits
          maxProducts: 1000,
          maxOrders: 10000,
          storageLimit: 10000, // 10GB
          analyticsAccess: true,
          prioritySupport: true,

          // Billing info (will be set when trial converts)
          amount: 299, // Premium monthly price
          currency: 'INR',
          billingCycle: 'monthly',
        },
      });

      // Update registration request status
      await tx.vendorRegistrationRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
      });

      return { user, vendorProfile, subscription };
    });

    // Send approval email to vendor
    try {
      await sendEmail({
        to: registrationRequest.email,
        subject: '🎉 Your GrabtoGo Vendor Application Has Been Approved!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your GrabtoGo vendor application has been approved!</p>
            </div>

            <div style="padding: 30px;">
              <h2 style="color: #333; margin-bottom: 20px;">Welcome to GrabtoGo, ${registrationRequest.fullName}!</h2>
              <p style="color: #666; line-height: 1.6;">We're excited to have <strong>${registrationRequest.companyName}</strong> join our marketplace platform.</p>

              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #059669; margin-top: 0;">🚀 Your 20-Day Premium Trial Starts Now!</h3>
                <p style="color: #059669; margin-bottom: 10px;">Your account has been upgraded to <strong>Premium</strong> with full access to:</p>
                <ul style="color: #059669; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Unlimited products and orders</li>
                  <li>Advanced analytics dashboard</li>
                  <li>Priority customer support</li>
                  <li>Enhanced store customization</li>
                  <li>Featured listing opportunities</li>
                  <li>10GB storage space</li>
                </ul>
                <p style="color: #059669; margin-top: 15px; font-weight: bold;">Trial Period: ${new Date().toLocaleDateString()} - ${new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              </div>

              <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #92400e; margin-top: 0;">📋 Next Steps:</h3>
                <ol style="color: #92400e; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Log in to your vendor dashboard</li>
                  <li>Complete your store profile</li>
                  <li>Upload your first products</li>
                  <li>Set up your payment details</li>
                  <li>Start selling on GrabtoGo!</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login"
                   style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Access Your Vendor Dashboard
                </a>
              </div>

              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #475569; margin-top: 0;">🏪 Your Store Details:</h3>
                <ul style="color: #475569; line-height: 1.8; margin: 0; padding-left: 20px; list-style: none;">
                  <li><strong>Store Name:</strong> ${registrationRequest.companyName}</li>
                  <li><strong>Business Type:</strong> ${registrationRequest.businessType || 'Not specified'}</li>
                  <li><strong>Location:</strong> ${registrationRequest.city}, ${registrationRequest.state}</li>
                  <li><strong>Delivery Radius:</strong> ${registrationRequest.deliveryRadius || 5} km</li>
                  <li><strong>Account Email:</strong> ${registrationRequest.email}</li>
                </ul>
              </div>

              <p style="color: #666; line-height: 1.6;">If you have any questions or need assistance getting started, our support team is here to help at <a href="mailto:support@grabtogo.in" style="color: #10b981;">support@grabtogo.in</a></p>

              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #999; font-size: 14px;">Welcome to the GrabtoGo family!</p>
                <p style="color: #333; font-weight: bold;">The GrabtoGo Team</p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    // Send notification to admin
    try {
      await sendEmail({
        to: 'info@grabtogo.in',
        subject: 'Vendor Registration Approved - Trial Activated',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h1>✅ Vendor Registration Approved</h1>
            <p>A vendor registration has been approved and a premium trial has been activated:</p>

            <h2>Vendor Details:</h2>
            <ul>
              <li><strong>Company:</strong> ${registrationRequest.companyName}</li>
              <li><strong>Name:</strong> ${registrationRequest.fullName}</li>
              <li><strong>Email:</strong> ${registrationRequest.email}</li>
              <li><strong>Phone:</strong> ${registrationRequest.phone}</li>
              <li><strong>Location:</strong> ${registrationRequest.city}, ${registrationRequest.state}</li>
              <li><strong>Approved by:</strong> ${session.user.email}</li>
              <li><strong>Trial Period:</strong> 20 days (Premium)</li>
            </ul>

            <p><strong>User ID:</strong> ${result.user.id}</p>
            <p><strong>Vendor Profile ID:</strong> ${result.vendorProfile.id}</p>
            <p><strong>Subscription ID:</strong> ${result.subscription.id}</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor registration approved and trial activated',
      userId: result.user.id,
      vendorId: result.vendorProfile.id,
      subscriptionId: result.subscription.id,
    });
  } catch (error) {
    console.error('Error approving vendor registration:', error);
    return NextResponse.json({ error: 'Failed to approve vendor registration' }, { status: 500 });
  }
}
