import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    // Validate required fields
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.companyName
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if email already exists in registration requests
    const existingRequest = await db.vendorRegistrationRequest.findFirst({
      where: { email: formData.email },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A registration request with this email already exists' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: formData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(formData.password, 12);

    // Create vendor registration request
    const registrationRequest = await db.vendorRegistrationRequest.create({
      data: {
        // Personal Information
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: hashedPassword,

        // Business Details
        companyName: formData.companyName,
        businessType: formData.businessType || null,
        yearsInBusiness: formData.yearsInBusiness || null,
        numberOfEmployees: formData.numberOfEmployees || null,
        businessCategory: formData.businessCategory || null,

        // Address & Location
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2 || null,
        city: formData.city,
        state: formData.state || 'Kerala',
        pinCode: formData.pinCode,
        landmark: formData.landmark || null,
        latitude: formData.coordinates?.lat || null,
        longitude: formData.coordinates?.lng || null,
        deliveryRadius: formData.deliveryRadius || 5,

        // Agent Reference
        agentCode: formData.agentCode || null,
        agentName: formData.agentName || null,
        agentPhone: formData.agentPhone || null,
        agentVisitDate: formData.agentVisitDate || null,
        referenceNotes: formData.referenceNotes || null,

        // GST & Documents
        gstNumber: formData.gstNumber || null,
        gstVerified: formData.gstVerified || false,
        gstDetails: formData.gstDetails || null,
        gstCertificate: formData.gstCertificate || null,

        // Branding
        logo: formData.logo || null,
        banner: formData.banner || null,
        tagline: formData.tagline || null,

        // Package Selection - Force premium for trial
        selectedPackage: 'premium',
        billingCycle: formData.billingCycle || 'monthly',
        addOns: formData.addOns || null,

        // Terms
        termsAccepted: formData.termsAccepted || false,
        privacyAccepted: formData.privacyAccepted || false,
      },
    });

    // Send confirmation email to vendor
    try {
      await sendEmail({
        to: formData.email,
        subject: 'GrabtoGo Vendor Application Submitted',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">GrabtoGo</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Vendor Application Submitted</p>
            </div>

            <div style="padding: 30px;">
              <h2 style="color: #333; margin-bottom: 20px;">Thank You, ${formData.fullName}!</h2>
              <p style="color: #666; line-height: 1.6;">Your vendor registration application has been successfully submitted and is now pending admin review.</p>

              <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="color: #333; margin-top: 0;">Application Details:</h3>
                <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>Business Name:</strong> ${formData.companyName}</li>
                  <li><strong>Email:</strong> ${formData.email}</li>
                  <li><strong>Phone:</strong> ${formData.phone}</li>
                  <li><strong>Location:</strong> ${formData.city}, ${formData.state}</li>
                  <li><strong>Package:</strong> Premium (20-day FREE trial)</li>
                </ul>
              </div>

              <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                <h3 style="color: #2e7d32; margin-top: 0;">🎉 Premium Trial Benefits Awaiting You:</h3>
                <ul style="color: #2e7d32; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Unlimited products and orders</li>
                  <li>Advanced analytics dashboard</li>
                  <li>Priority customer support</li>
                  <li>Enhanced store customization</li>
                  <li>Featured listing opportunities</li>
                </ul>
              </div>

              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #856404; margin-top: 0;">What Happens Next?</h3>
                <ol style="color: #856404; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Our admin team will review your application within 24-48 hours</li>
                  <li>You'll receive an email notification about the approval status</li>
                  <li>Once approved, your 20-day premium trial will begin automatically</li>
                  <li>No payment required during the trial period</li>
                </ol>
              </div>

              <p style="color: #666; line-height: 1.6;">If you have any questions, please don't hesitate to contact us at <a href="mailto:info@grabtogo.in" style="color: #667eea;">info@grabtogo.in</a></p>

              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #999; font-size: 14px;">Thank you for choosing GrabtoGo!</p>
                <p style="color: #333; font-weight: bold;">The GrabtoGo Team</p>
              </div>
            </div>
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
          <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-bottom: 3px solid #dc2626;">
              <h1 style="color: #dc2626; margin: 0;">🚨 New Vendor Registration</h1>
              <p style="margin: 5px 0 0 0; color: #666;">Admin approval required</p>
            </div>

            <div style="padding: 20px;">
              <p style="font-size: 16px; color: #333;">A new vendor has submitted their registration application:</p>

              <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Vendor Details</h2>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  <div>
                    <h3 style="color: #4a5568; margin-bottom: 10px;">Personal Information</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                      <li style="margin: 8px 0;"><strong>Name:</strong> ${formData.fullName}</li>
                      <li style="margin: 8px 0;"><strong>Email:</strong> ${formData.email}</li>
                      <li style="margin: 8px 0;"><strong>Phone:</strong> ${formData.phone}</li>
                    </ul>
                  </div>

                  <div>
                    <h3 style="color: #4a5568; margin-bottom: 10px;">Business Information</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                      <li style="margin: 8px 0;"><strong>Company:</strong> ${formData.companyName}</li>
                      <li style="margin: 8px 0;"><strong>Type:</strong> ${formData.businessType || 'Not specified'}</li>
                      <li style="margin: 8px 0;"><strong>Category:</strong> ${formData.businessCategory || 'Not specified'}</li>
                    </ul>
                  </div>
                </div>

                <div style="margin-top: 20px;">
                  <h3 style="color: #4a5568; margin-bottom: 10px;">Location & Contact</h3>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin: 8px 0;"><strong>Address:</strong> ${formData.addressLine1}${formData.addressLine2 ? ', ' + formData.addressLine2 : ''}</li>
                    <li style="margin: 8px 0;"><strong>City:</strong> ${formData.city}, ${formData.state} - ${formData.pinCode}</li>
                    <li style="margin: 8px 0;"><strong>Delivery Radius:</strong> ${formData.deliveryRadius || 5} km</li>
                    ${formData.gstNumber ? `<li style="margin: 8px 0;"><strong>GST Number:</strong> ${formData.gstNumber}</li>` : ''}
                  </ul>
                </div>

                ${
                  formData.agentCode
                    ? `
                <div style="margin-top: 20px;">
                  <h3 style="color: #4a5568; margin-bottom: 10px;">Agent Reference</h3>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin: 8px 0;"><strong>Agent Code:</strong> ${formData.agentCode}</li>
                    <li style="margin: 8px 0;"><strong>Agent Name:</strong> ${formData.agentName || 'Not provided'}</li>
                    <li style="margin: 8px 0;"><strong>Agent Phone:</strong> ${formData.agentPhone || 'Not provided'}</li>
                  </ul>
                </div>
                `
                    : ''
                }
              </div>

              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;"><strong>Package Selected:</strong> Premium (20-day FREE trial will start upon approval)</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/vendor-approvals"
                   style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Review Application in Admin Dashboard
                </a>
              </div>

              <p style="color: #666; font-size: 14px; text-align: center;">
                Application ID: ${registrationRequest.id}<br>
                Submitted: ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor registration submitted successfully',
      requestId: registrationRequest.id,
    });
  } catch (error) {
    console.error('Error submitting vendor registration:', error);
    return NextResponse.json({ error: 'Failed to submit registration' }, { status: 500 });
  }
}
