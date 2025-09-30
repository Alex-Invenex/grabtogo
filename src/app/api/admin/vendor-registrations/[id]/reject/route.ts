import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is admin
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const requestId = params.id
    const { reason } = await request.json()

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // Get the registration request
    const registrationRequest = await db.vendorRegistrationRequest.findUnique({
      where: { id: requestId }
    })

    if (!registrationRequest) {
      return NextResponse.json(
        { error: 'Registration request not found' },
        { status: 404 }
      )
    }

    if (registrationRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Registration request has already been processed' },
        { status: 400 }
      )
    }

    // Update registration request status
    const updatedRequest = await db.vendorRegistrationRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    })

    // Send rejection email to vendor
    try {
      await sendEmail({
        to: registrationRequest.email,
        subject: 'GrabtoGo Vendor Application Update',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">GrabtoGo</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Vendor Application Update</p>
            </div>

            <div style="padding: 30px;">
              <h2 style="color: #333; margin-bottom: 20px;">Dear ${registrationRequest.fullName},</h2>
              <p style="color: #666; line-height: 1.6;">Thank you for your interest in joining GrabtoGo as a vendor partner.</p>

              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <h3 style="color: #dc2626; margin-top: 0;">Application Status: Not Approved</h3>
                <p style="color: #dc2626; margin-bottom: 15px;">Unfortunately, we are unable to approve your vendor application at this time.</p>
                <div style="background: white; padding: 15px; border-radius: 6px;">
                  <h4 style="color: #991b1b; margin-top: 0; margin-bottom: 10px;">Reason for rejection:</h4>
                  <p style="color: #991b1b; margin: 0; font-style: italic;">"${reason}"</p>
                </div>
              </div>

              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                <h3 style="color: #0369a1; margin-top: 0;">Next Steps</h3>
                <p style="color: #0369a1; margin-bottom: 10px;">Don't lose hope! You can:</p>
                <ul style="color: #0369a1; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Address the concerns mentioned above</li>
                  <li>Submit a new application with updated information</li>
                  <li>Contact our support team for clarification</li>
                </ul>
              </div>

              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #475569; margin-top: 0;">Application Details:</h3>
                <ul style="color: #475569; line-height: 1.8; margin: 0; padding-left: 20px; list-style: none;">
                  <li><strong>Company:</strong> ${registrationRequest.companyName}</li>
                  <li><strong>Email:</strong> ${registrationRequest.email}</li>
                  <li><strong>Submitted:</strong> ${new Date(registrationRequest.createdAt).toLocaleDateString()}</li>
                  <li><strong>Reviewed:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>
              </div>

              <p style="color: #666; line-height: 1.6;">If you have any questions about this decision or would like guidance on reapplying, please don't hesitate to contact our support team at <a href="mailto:support@grabtogo.in" style="color: #0ea5e9;">support@grabtogo.in</a></p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/register/vendor"
                   style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Submit New Application
                </a>
              </div>

              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #999; font-size: 14px;">Thank you for your understanding</p>
                <p style="color: #333; font-weight: bold;">The GrabtoGo Team</p>
              </div>
            </div>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError)
    }

    // Send notification to admin
    try {
      await sendEmail({
        to: 'info@grabtogo.in',
        subject: 'Vendor Registration Rejected',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h1>❌ Vendor Registration Rejected</h1>
            <p>A vendor registration has been rejected:</p>

            <h2>Vendor Details:</h2>
            <ul>
              <li><strong>Company:</strong> ${registrationRequest.companyName}</li>
              <li><strong>Name:</strong> ${registrationRequest.fullName}</li>
              <li><strong>Email:</strong> ${registrationRequest.email}</li>
              <li><strong>Phone:</strong> ${registrationRequest.phone}</li>
              <li><strong>Location:</strong> ${registrationRequest.city}, ${registrationRequest.state}</li>
              <li><strong>Rejected by:</strong> ${session.user.email}</li>
              <li><strong>Rejection Reason:</strong> ${reason}</li>
            </ul>

            <p><strong>Request ID:</strong> ${requestId}</p>
            <p><strong>Original Submission:</strong> ${new Date(registrationRequest.createdAt).toLocaleString()}</p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor registration rejected',
      requestId: updatedRequest.id,
    })
  } catch (error) {
    console.error('Error rejecting vendor registration:', error)
    return NextResponse.json(
      { error: 'Failed to reject vendor registration' },
      { status: 500 }
    )
  }
}
