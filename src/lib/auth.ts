import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';
import { db } from './db';
import { UserRole } from './prisma';
import { comparePassword, signInSchema, normalizeEmail } from './password';
import {
  isAccountLocked,
  recordFailedAttempt,
  resetFailedAttempts,
  logSecurityEvent,
  checkRateLimit,
  detectSuspiciousActivity,
} from './security';

const config = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY!,
      from: process.env.EMAIL_FROM || 'noreply@grabtogo.com',
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        try {
          // Validate input with enhanced schema
          const { email, password } = signInSchema.parse(credentials);

          // Get IP address for rate limiting and logging
          const ipAddress =
            req?.headers?.get('x-forwarded-for') || req?.headers?.get('x-real-ip') || 'unknown';

          // Rate limiting check
          const rateLimit = await checkRateLimit(ipAddress, 'login');
          if (!rateLimit.allowed) {
            throw new Error('Too many login attempts. Please try again later.');
          }

          const normalizedEmail = normalizeEmail(email);

          // Find user with security fields
          const user = await db.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              password: true,
              role: true,
              emailVerified: true,
              isActive: true,
              accountLocked: true,
              accountLockedUntil: true,
              failedAttempts: true,
            },
          });

          if (!user) {
            // Log failed attempt with non-existent email
            await logSecurityEvent({
              event: 'login_failed_invalid_email',
              details: JSON.stringify({ email: normalizedEmail }),
              ipAddress,
              userAgent: req?.headers?.get('user-agent') || 'unknown',
            });
            throw new Error('Invalid credentials');
          }

          // Check if account is locked
          if (await isAccountLocked(user.id)) {
            await logSecurityEvent({
              userId: user.id,
              event: 'login_failed_account_locked',
              details: JSON.stringify({ email: normalizedEmail }),
              ipAddress,
              userAgent: req?.headers?.get('user-agent') || 'unknown',
            });
            throw new Error('Account is temporarily locked due to multiple failed login attempts.');
          }

          // Check if email is verified
          if (!user.emailVerified) {
            await logSecurityEvent({
              userId: user.id,
              event: 'login_failed_email_not_verified',
              details: JSON.stringify({ email: normalizedEmail }),
              ipAddress,
              userAgent: req?.headers?.get('user-agent') || 'unknown',
            });
            throw new Error('Please verify your email address before signing in.');
          }

          // Check if account is active
          if (!user.isActive) {
            await logSecurityEvent({
              userId: user.id,
              event: 'login_failed_account_inactive',
              details: JSON.stringify({ email: normalizedEmail }),
              ipAddress,
              userAgent: req?.headers?.get('user-agent') || 'unknown',
            });
            throw new Error('Account is inactive. Please contact support.');
          }

          // Verify password
          if (!user.password || !(await comparePassword(password, user.password))) {
            // Record failed attempt
            const shouldLock = await recordFailedAttempt(user.id);

            await logSecurityEvent({
              userId: user.id,
              event: 'login_failed_invalid_password',
              details: JSON.stringify({
                email: normalizedEmail,
                failedAttempts: user.failedAttempts + 1,
                accountLocked: shouldLock,
              }),
              ipAddress,
              userAgent: req?.headers?.get('user-agent') || 'unknown',
            });

            if (shouldLock) {
              throw new Error('Account has been locked due to multiple failed login attempts.');
            }

            throw new Error('Invalid credentials');
          }

          // Detect suspicious activity
          const suspiciousActivity = await detectSuspiciousActivity(user.id, ipAddress);

          // Reset failed attempts on successful login
          await resetFailedAttempts(user.id);

          // Log successful login
          await logSecurityEvent({
            userId: user.id,
            event: 'login_success',
            details: JSON.stringify({
              email: normalizedEmail,
              suspicious: suspiciousActivity.suspicious,
              suspiciousReasons: suspiciousActivity.reasons,
            }),
            ipAddress,
            userAgent: req?.headers?.get('user-agent') || 'unknown',
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            emailVerified: user.emailVerified,
          };
        } catch (error) {
          // Ensure proper error handling
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('Authentication failed');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account: _account }) {
      if (user) {
        token.role = (user as any).role;
        token.emailVerified = (user as any).emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        (session.user as any).role = token.role as UserRole;
        (session.user as any).emailVerified = token.emailVerified;
      }
      return session;
    },
    async signIn({ user, account, profile: _profile }) {
      // Handle OAuth providers (Google, etc.)
      if (account?.provider === 'google') {
        try {
          const normalizedEmail = normalizeEmail(user.email!);

          const existingUser = await db.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!existingUser) {
            // Create new user for OAuth
            const newUser = await db.user.create({
              data: {
                email: normalizedEmail,
                name: user.name,
                image: user.image,
                emailVerified: new Date(), // OAuth emails are pre-verified
                role: UserRole.CUSTOMER,
                isActive: true,
              },
            });

            await logSecurityEvent({
              userId: newUser.id,
              event: 'oauth_account_created',
              details: JSON.stringify({
                provider: account.provider,
                email: normalizedEmail,
              }),
            });
          } else {
            // Update existing user with OAuth info
            await db.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                emailVerified: existingUser.emailVerified || new Date(),
              },
            });

            await logSecurityEvent({
              userId: existingUser.id,
              event: 'oauth_login_success',
              details: JSON.stringify({
                provider: account.provider,
                email: normalizedEmail,
              }),
            });
          }

          return true;
        } catch (error) {
          console.error('OAuth sign in error:', error);
          return false;
        }
      }

      // Handle email provider (magic links)
      if (account?.provider === 'resend') {
        return true;
      }

      // Handle credentials provider
      if (account?.provider === 'credentials') {
        return true;
      }

      return true;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  events: {
    async signOut(message) {
      if ('token' in message && message.token?.sub) {
        await logSecurityEvent({
          userId: message.token.sub,
          event: 'logout',
          details: JSON.stringify({ sessionId: message.token.jti }),
        });
      }
    },
  },
});

export const { handlers, auth, signIn, signOut } = config;
