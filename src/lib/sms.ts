import twilio from 'twilio';
import { redis } from './redis';

// Initialize Twilio client
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export interface SMSConfig {
  phoneNumber: string;
  message: string;
}

/**
 * Generate 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS({ phoneNumber, message }: SMSConfig): Promise<boolean> {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.error('Twilio credentials not configured');
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}

/**
 * Store OTP in Redis with expiration
 */
export async function storeOTP(
  phoneNumber: string,
  otp: string,
  expiryMinutes: number = 10
): Promise<boolean> {
  if (!redis) {
    console.error('Redis not available for OTP storage');
    return false;
  }

  try {
    const key = `otp:${phoneNumber}`;
    await redis.setex(key, expiryMinutes * 60, otp);
    return true;
  } catch (error) {
    console.error('Failed to store OTP:', error);
    return false;
  }
}

/**
 * Verify OTP from Redis
 */
export async function verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
  if (!redis) {
    console.error('Redis not available for OTP verification');
    return false;
  }

  try {
    const key = `otp:${phoneNumber}`;
    const storedOTP = await redis.get(key);

    if (!storedOTP) {
      return false; // OTP expired or doesn't exist
    }

    const isValid = storedOTP === otp;

    // Delete OTP after verification attempt (whether successful or not)
    if (isValid) {
      await redis.del(key);
    }

    return isValid;
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return false;
  }
}

/**
 * Check if OTP was recently sent (rate limiting)
 */
export async function canSendOTP(
  phoneNumber: string,
  cooldownSeconds: number = 60
): Promise<{ canSend: boolean; remainingTime: number }> {
  if (!redis) {
    return { canSend: true, remainingTime: 0 };
  }

  try {
    const key = `otp_cooldown:${phoneNumber}`;
    const ttl = await redis.ttl(key);

    if (ttl > 0) {
      return { canSend: false, remainingTime: ttl };
    }

    // Set cooldown
    await redis.setex(key, cooldownSeconds, '1');
    return { canSend: true, remainingTime: 0 };
  } catch (error) {
    console.error('Failed to check OTP cooldown:', error);
    return { canSend: true, remainingTime: 0 };
  }
}

/**
 * Send phone verification OTP
 */
export async function sendVerificationOTP(phoneNumber: string): Promise<{
  success: boolean;
  message: string;
  remainingTime?: number;
}> {
  // Check cooldown
  const { canSend, remainingTime } = await canSendOTP(phoneNumber);

  if (!canSend) {
    return {
      success: false,
      message: `Please wait ${remainingTime} seconds before requesting another OTP`,
      remainingTime,
    };
  }

  // Generate OTP
  const otp = generateOTP();

  // Store in Redis
  const stored = await storeOTP(phoneNumber, otp, 10);

  if (!stored) {
    return {
      success: false,
      message: 'Failed to generate OTP. Please try again.',
    };
  }

  // Send SMS
  const sent = await sendSMS({
    phoneNumber,
    message: `Your GrabtoGo verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`,
  });

  if (!sent) {
    return {
      success: false,
      message: 'Failed to send SMS. Please check your phone number.',
    };
  }

  return {
    success: true,
    message: 'Verification code sent successfully',
  };
}

/**
 * Verify phone number with OTP
 */
export async function verifyPhoneNumber(
  phoneNumber: string,
  otp: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const isValid = await verifyOTP(phoneNumber, otp);

  if (!isValid) {
    return {
      success: false,
      message: 'Invalid or expired verification code',
    };
  }

  return {
    success: true,
    message: 'Phone number verified successfully',
  };
}

/**
 * Format phone number to E.164 format (international)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // If starts with country code, return as is
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  // Assume Indian number if no country code
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  return `+${cleaned}`;
}
