import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole } from '@/lib/prisma';
import { hashPassword, signUpSchema, normalizeEmail } from '@/lib/password';
import { checkRateLimit, logSecurityEvent, generateEmailVerificationToken } from '@/lib/security';
import { sendVerificationEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, role } = signUpSchema.parse(body);

    // Rate limiting for signup attempts
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const rateLimit = await checkRateLimit(ipAddress, 'signup');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many signup attempts',
          message: 'Please wait before trying again',
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      );
    }

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Log potential security issue
      await logSecurityEvent({
        event: 'signup_duplicate_email',
        details: JSON.stringify({ email: normalizedEmail }),
        ipAddress,
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password with enhanced security
    const hashedPassword = await hashPassword(password);

    // Create user with enhanced security fields
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone?.trim(),
        role,
        isActive: false, // Account inactive until email verification
        passwordChangedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isActive: true,
        emailVerified: true,
      },
    });

    // Generate email verification token
    const verificationToken = await generateEmailVerificationToken(normalizedEmail);

    // Send verification email
    const emailSent = await sendVerificationEmail(
      normalizedEmail,
      verificationToken,
      user.name || undefined
    );

    // Log security event
    await logSecurityEvent({
      userId: user.id,
      event: 'account_created',
      details: JSON.stringify({
        email: normalizedEmail,
        role,
        emailSent,
      }),
      ipAddress,
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    if (!emailSent) {
      console.error('Failed to send verification email for user:', user.id);
      // Note: We don't fail signup if email fails to send
    }

    return NextResponse.json(
      {
        message: 'Account created successfully! Please check your email to verify your account.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: false,
          isActive: false,
        },
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
