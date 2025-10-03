import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { generatePasswordResetToken, checkRateLimit, logSecurityEvent } from '@/lib/security';
import { sendPasswordResetEmail } from '@/lib/email';
import { emailSchema } from '@/lib/password';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = emailSchema.parse(body);

    // Rate limiting for password reset requests
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const rateLimit = await checkRateLimit(ipAddress, 'password_reset');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Please wait before requesting another password reset',
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        emailVerified: true,
        isActive: true,
      },
    });

    // Always return success to prevent email enumeration
    // but only send email if user exists and is verified
    if (user && user.emailVerified && user.isActive) {
      // Generate password reset token
      const token = await generatePasswordResetToken(email);

      // Send password reset email
      const emailSent = await sendPasswordResetEmail(email, token, user.name || undefined);

      if (emailSent) {
        // Log security event
        await logSecurityEvent({
          userId: user.id,
          event: 'password_reset_requested',
          details: JSON.stringify({ email }),
          ipAddress,
          userAgent: request.headers.get('user-agent') || 'unknown',
        });
      }
    } else {
      // Log potential security incident if user doesn't exist
      await logSecurityEvent({
        event: 'password_reset_invalid_email',
        details: JSON.stringify({
          email,
          reason: !user
            ? 'user_not_found'
            : !user.emailVerified
              ? 'email_not_verified'
              : 'account_inactive',
        }),
        ipAddress,
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
    }

    // Always return success message to prevent email enumeration
    return NextResponse.json(
      {
        message:
          'If an account with that email exists and is verified, a password reset email will be sent.',
        email: email,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
