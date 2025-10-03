import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/prisma';
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

    const { requestId, reason } = await request.json();

    if (!requestId || !reason) {
      return NextResponse.json({ error: 'Request ID and reason are required' }, { status: 400 });
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

    // Update registration request status
    await db.vendorRegistrationRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: session.user.id,
        rejectionReason: reason,
      },
    });

    // Send rejection email to vendor
    try {
      await sendEmail({
        to: registrationRequest.email,
        subject: 'Update on Your GrabtoGo Vendor Application',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">GrabtoGo</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Vendor Application Update</p>
            </div>

            <div style="padding: 30px;">
              <h2 style="color: #333; margin-bottom: 20px;">Dear ${registrationRequest.fullName},</h2>
              <p style="color: #666; line-height: 1.6;">Thank you for your interest in becoming a vendor on GrabtoGo.</p>

              <p style="color: #666; line-height: 1.6;">After careful review of your application, we regret to inform you that we are unable to approve your vendor account at this time.</p>

              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #856404; margin-top: 0;">Reason for Rejection</h3>
                <p style="color: #856404; line-height: 1.6; margin: 0;">${reason}</p>
              </div>

              <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="color: #333; margin-top: 0;">What You Can Do</h3>
                <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Review and address the reason mentioned above</li>
                  <li>Prepare the necessary documentation</li>
                  <li>Submit a new application when ready</li>
                </ul>
              </div>

              <p style="color: #666; line-height: 1.6;">We appreciate your understanding and encourage you to reapply once you've addressed the issues mentioned above.</p>

              <p style="color: #666; line-height: 1.6;">If you have any questions or need clarification, please don't hesitate to contact us at <a href="mailto:info@grabtogo.in" style="color: #667eea;">info@grabtogo.in</a></p>

              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #999; font-size: 14px;">Thank you for your interest in GrabtoGo</p>
                <p style="color: #333; font-weight: bold;">The GrabtoGo Team</p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting vendor:', error);
    return NextResponse.json({ error: 'Failed to reject vendor' }, { status: 500 });
  }
}
