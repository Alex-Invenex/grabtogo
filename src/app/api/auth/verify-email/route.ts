import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyEmailToken } from '@/lib/security';
import { sendWelcomeEmail } from '@/lib/email';
import { logSecurityEvent } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = verifyEmailSchema.parse(body);

    // Verify the token and get the email
    const email = await verifyEmailToken(token);

    if (!email) {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    // Find and update the user
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, role: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    // Mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        isActive: true,
      },
    });

    // Log security event
    await logSecurityEvent({
      userId: user.id,
      event: 'email_verified',
      details: JSON.stringify({ email }),
      ipAddress:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(email, user.name || 'User', user.role);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail the verification if welcome email fails
    }

    return NextResponse.json(
      {
        message: 'Email verified successfully',
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          emailVerified: true,
        },
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

    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET route for handling verification links clicked in email
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=InvalidToken', request.url));
  }

  try {
    // Verify the token and get the email
    const email = await verifyEmailToken(token);

    if (!email) {
      return NextResponse.redirect(new URL('/auth/login?error=ExpiredToken', request.url));
    }

    // Find and update the user
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, role: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login?error=UserNotFound', request.url));
    }

    if (user.emailVerified) {
      return NextResponse.redirect(new URL('/auth/login?message=AlreadyVerified', request.url));
    }

    // Mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        isActive: true,
      },
    });

    // Log security event
    await logSecurityEvent({
      userId: user.id,
      event: 'email_verified',
      details: JSON.stringify({ email, method: 'link_click' }),
      ipAddress:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(email, user.name || 'User', user.role);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return NextResponse.redirect(new URL('/auth/login?message=EmailVerified', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=VerificationFailed', request.url));
  }
}
