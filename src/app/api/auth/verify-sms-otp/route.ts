import { NextRequest, NextResponse } from 'next/server';
import { verifyPhoneNumber, formatPhoneNumber } from '@/lib/sms';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  phoneNumber: z.string().min(10, 'Phone number is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, otp } = schema.parse(body);

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Verify OTP
    const result = await verifyPhoneNumber(formattedPhone, otp);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Get current session
    const session = await auth();

    // If user is logged in, update their phone verification status
    if (session?.user?.id) {
      await db.user.update({
        where: { id: session.user.id },
        data: {
          phone: formattedPhone,
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Verify SMS OTP error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
  }
}
