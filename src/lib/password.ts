import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Enhanced password schema with stronger requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(32, 'Password must be less than 32 characters')
  .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/^(?=.*\d)/, 'Password must contain at least one number')
  .regex(/^(?=.*[@$!%*?&])/, 'Password must contain at least one special character (@$!%*?&)');

// Sign in schema with enhanced validation
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .transform((email) => email.trim()),
  password: z.string().min(1, 'Password is required'),
});

// Sign up schema with enhanced validation
export const signUpSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address')
      .toLowerCase()
      .transform((email) => email.trim()),
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: z
      .string()
      .optional()
      .refine((phone) => !phone || /^\+?[\d\s-()]+$/.test(phone), 'Invalid phone number format'),
    role: z.enum(['CUSTOMER', 'VENDOR']).default('CUSTOMER'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Password reset schema
export const passwordResetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Email validation schema
export const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .transform((email) => email.trim()),
});

/**
 * Hash password with salt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Calculate password strength score (0-100)
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  // Length scoring
  if (password.length >= 8) score += 20;
  else feedback.push('Use at least 8 characters');

  if (password.length >= 12) score += 10;
  else if (password.length >= 8) feedback.push('Consider using 12+ characters for better security');

  // Complexity scoring
  if (/[a-z]/.test(password)) score += 15;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 15;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) score += 15;
  else feedback.push('Add numbers');

  if (/[@$!%*?&]/.test(password)) score += 15;
  else feedback.push('Add special characters (@$!%*?&)');

  // Variety bonus
  const characterTypes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[@$!%*?&]/.test(password),
  ].filter(Boolean).length;

  if (characterTypes >= 4) score += 10;

  // Common patterns penalty
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeating characters');
  }

  if (/123|abc|qwe|password/i.test(password)) {
    score -= 20;
    feedback.push('Avoid common patterns');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    feedback: feedback.slice(0, 3), // Limit feedback to 3 items
  };
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto');
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

/**
 * Normalize email address for consistent storage
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
