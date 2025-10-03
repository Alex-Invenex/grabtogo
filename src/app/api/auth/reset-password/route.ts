import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyPasswordResetToken,
  deletePasswordResetToken,
  logSecurityEvent,
} from '@/lib/security';
import { hashPassword, passwordResetSchema } from '@/lib/password';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = passwordResetSchema.parse(body);

    // Verify the reset token
    const email = await verifyPasswordResetToken(token);

    if (!email) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        emailVerified: true,
        isActive: true,
        accountLocked: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.emailVerified || !user.isActive) {
      return NextResponse.json({ error: 'Account is not verified or active' }, { status: 400 });
    }

    if (user.accountLocked) {
      return NextResponse.json(
        { error: 'Account is locked. Please contact support.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update the password and reset security fields
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        failedAttempts: 0,
        accountLocked: false,
        accountLockedUntil: null,
        lastFailedAttempt: null,
      },
    });

    // Delete the reset token
    await deletePasswordResetToken(token);

    // Log security event
    await logSecurityEvent({
      userId: user.id,
      event: 'password_reset_completed',
      details: JSON.stringify({ email }),
      ipAddress:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json(
      {
        message: 'Password reset successfully',
        user: {
          id: user.id,
          name: user.name,
          email: email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET route to validate reset token
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 });
    }

    // Verify the reset token
    const email = await verifyPasswordResetToken(token);

    if (!email) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Check if user exists and is active
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        emailVerified: true,
        isActive: true,
        accountLocked: true,
      },
    });

    if (!user || !user.emailVerified || !user.isActive || user.accountLocked) {
      return NextResponse.json({ error: 'Invalid account state' }, { status: 400 });
    }

    return NextResponse.json(
      {
        valid: true,
        email: email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
