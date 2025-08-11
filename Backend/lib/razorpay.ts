import Razorpay from 'razorpay';
import crypto from 'crypto';

// Environment variables validation
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!razorpayKeyId) {
  throw new Error('Missing RAZORPAY_KEY_ID environment variable');
}

if (!razorpayKeySecret) {
  throw new Error('Missing RAZORPAY_KEY_SECRET environment variable');
}

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

// Order creation options interface
export interface CreateOrderOptions {
  amount: number; // Amount in paise (₹1 = 100 paise)
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}

// Payment verification interface
export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Create Razorpay order
export async function createRazorpayOrder(options: CreateOrderOptions) {
  try {
    const orderOptions = {
      amount: options.amount,
      currency: options.currency || 'INR',
      receipt: options.receipt,
      notes: options.notes,
    };

    const order = await razorpay.orders.create(orderOptions);
    return { success: true, order };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return { success: false, error };
  }
}

// Verify payment signature
export function verifyPaymentSignature(verification: PaymentVerification): boolean {
  if (!razorpayKeySecret) {
    console.error('Missing Razorpay key secret for verification');
    return false;
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verification;
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === razorpay_signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!razorpayWebhookSecret) {
    console.error('Missing Razorpay webhook secret');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', razorpayWebhookSecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Get payment details
export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return { success: true, payment };
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return { success: false, error };
  }
}

// Capture payment
export async function capturePayment(paymentId: string, amount: number, currency: string = 'INR') {
  try {
    const payment = await razorpay.payments.capture(paymentId, amount, currency);
    return { success: true, payment };
  } catch (error) {
    console.error('Error capturing payment:', error);
    return { success: false, error };
  }
}

// Create refund
export async function createRefund(paymentId: string, amount?: number, notes?: Record<string, any>) {
  try {
    const refundOptions: any = { payment_id: paymentId };
    if (amount) refundOptions.amount = amount;
    if (notes) refundOptions.notes = notes;

    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    return { success: true, refund };
  } catch (error) {
    console.error('Error creating refund:', error);
    return { success: false, error };
  }
}

// Helper to convert rupees to paise
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

// Helper to convert paise to rupees
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

// Generate receipt ID
export function generateReceiptId(prefix: string = 'order'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

export default razorpay;