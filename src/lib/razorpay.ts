import Razorpay from 'razorpay';
import crypto from 'crypto';

// Only initialize Razorpay if credentials are available
const hasCredentials = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

export const razorpay = hasCredentials
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  : null;

function ensureRazorpay() {
  if (!razorpay) {
    throw new Error('Razorpay credentials not found in environment variables');
  }
  return razorpay;
}

export interface CreateOrderOptions {
  amount: number; // in paise (smallest currency unit)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentOptions {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class RazorpayService {
  static async createOrder(options: CreateOrderOptions) {
    try {
      const razorpayInstance = ensureRazorpay();
      const order = await razorpayInstance.orders.create({
        amount: options.amount,
        currency: options.currency || 'INR',
        receipt: options.receipt || `receipt_${Date.now()}`,
        notes: options.notes || {},
      });

      return {
        success: true,
        order,
      };
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      return {
        success: false,
        error: 'Failed to create order',
      };
    }
  }

  static verifyPaymentSignature(options: VerifyPaymentOptions): boolean {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = options;

      const body = razorpay_order_id + '|' + razorpay_payment_id;
      ensureRazorpay(); // Ensure credentials are available
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === razorpay_signature;
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  static async capturePayment(paymentId: string, amount: number) {
    try {
      const razorpayInstance = ensureRazorpay();
      const payment = await razorpayInstance.payments.capture(paymentId, amount, 'INR');
      return {
        success: true,
        payment,
      };
    } catch (error) {
      console.error('Payment capture error:', error);
      return {
        success: false,
        error: 'Failed to capture payment',
      };
    }
  }

  static async getPayment(paymentId: string) {
    try {
      const razorpayInstance = ensureRazorpay();
      const payment = await razorpayInstance.payments.fetch(paymentId);
      return {
        success: true,
        payment,
      };
    } catch (error) {
      console.error('Get payment error:', error);
      return {
        success: false,
        error: 'Failed to fetch payment',
      };
    }
  }

  static async refundPayment(paymentId: string, amount?: number) {
    try {
      const razorpayInstance = ensureRazorpay();
      const refund = await razorpayInstance.payments.refund(paymentId, {
        amount: amount,
      });
      return {
        success: true,
        refund,
      };
    } catch (error) {
      console.error('Payment refund error:', error);
      return {
        success: false,
        error: 'Failed to process refund',
      };
    }
  }

  static generateReceiptId(prefix = 'order'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static convertToRazorpayAmount(amount: number): number {
    // Convert rupees to paise (multiply by 100)
    return Math.round(amount * 100);
  }

  static convertFromRazorpayAmount(amount: number): number {
    // Convert paise to rupees (divide by 100)
    return amount / 100;
  }
}
