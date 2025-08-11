import { NextApiRequest, NextApiResponse } from 'next';
import { withMethods, withErrorHandling, successResponse, errorResponse } from '@/utils/api-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyWebhookSignature } from '@/lib/razorpay';
import crypto from 'crypto';

// Handle Razorpay webhook events
async function handleRazorpayWebhook(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get raw body for signature verification
    const signature = req.headers['x-razorpay-signature'] as string;
    
    if (!signature) {
      return errorResponse(res, 'Missing webhook signature', 400);
    }

    // Get raw body (Next.js parses it by default, so we need to get it as string)
    const rawBody = JSON.stringify(req.body);
    
    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(rawBody, signature);
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return errorResponse(res, 'Invalid webhook signature', 401);
    }

    const { event, payload } = req.body;
    
    console.log(`Received Razorpay webhook: ${event}`, payload);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;
        
      case 'order.paid':
        await handleOrderPaid(payload.order.entity);
        break;
        
      case 'refund.created':
        await handleRefundCreated(payload.refund.entity);
        break;
        
      case 'refund.processed':
        await handleRefundProcessed(payload.refund.entity);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Log webhook event for audit trail
    const { error: logError } = await supabaseAdmin
      .from('webhook_logs')
      .insert({
        provider: 'razorpay',
        event,
        payload: req.body,
        processed_at: new Date().toISOString(),
      });
    
    if (logError) {
      console.error('Error logging webhook event:', logError);
    }

    return successResponse(res, { received: true }, 'Webhook processed successfully');

  } catch (error) {
    console.error('Error processing Razorpay webhook:', error);
    return errorResponse(res, 'Webhook processing failed', 500);
  }
}

// Handle payment captured event
async function handlePaymentCaptured(payment: any) {
  try {
    const { id: payment_id, order_id, amount, status, method } = payment;

    // Find payment record
    const { data: paymentRecord, error: findError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('provider_order_id', order_id)
      .single();

    if (findError || !paymentRecord) {
      console.error('Payment record not found for order:', order_id);
      return;
    }

    // Update payment status
    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        provider_payment_id: payment_id,
        metadata: {
          ...paymentRecord.metadata,
          webhook_data: { payment, processed_at: new Date().toISOString() },
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.id);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return;
    }

    // Update related booking or rental order
    const metadata = paymentRecord.metadata as any;
    
    if (metadata?.booking_id) {
      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_id: paymentRecord.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', metadata.booking_id);

      // Send booking confirmation notification
      await sendNotification(paymentRecord.user_id, {
        title: 'Booking Confirmed!',
        message: 'Your booking payment has been processed successfully.',
        type: 'booking_confirmed',
        metadata: { booking_id: metadata.booking_id, payment_id: paymentRecord.id },
      });
    }

    if (metadata?.rental_order_id) {
      await supabaseAdmin
        .from('rental_orders')
        .update({
          status: 'confirmed',
          payment_id: paymentRecord.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', metadata.rental_order_id);

      // Send rental confirmation notification
      await sendNotification(paymentRecord.user_id, {
        title: 'Rental Order Confirmed!',
        message: 'Your rental order payment has been processed successfully.',
        type: 'rental_confirmed',
        metadata: { rental_order_id: metadata.rental_order_id, payment_id: paymentRecord.id },
      });
    }

    console.log(`Payment captured successfully: ${payment_id}`);

  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

// Handle payment failed event
async function handlePaymentFailed(payment: any) {
  try {
    const { id: payment_id, order_id, error_code, error_description } = payment;

    // Find payment record
    const { data: paymentRecord, error: findError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('provider_order_id', order_id)
      .single();

    if (findError || !paymentRecord) {
      console.error('Payment record not found for order:', order_id);
      return;
    }

    // Update payment status
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
        provider_payment_id: payment_id,
        metadata: {
          ...paymentRecord.metadata,
          error_code,
          error_description,
          webhook_data: { payment, processed_at: new Date().toISOString() },
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.id);

    // Send payment failure notification
    await sendNotification(paymentRecord.user_id, {
      title: 'Payment Failed',
      message: `Your payment could not be processed. ${error_description || 'Please try again.'}`,
      type: 'payment_failed',
      metadata: { payment_id: paymentRecord.id, error_code, error_description },
    });

    console.log(`Payment failed: ${payment_id}, Error: ${error_description}`);

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Handle order paid event
async function handleOrderPaid(order: any) {
  try {
    console.log('Order paid webhook received:', order.id);
    // This event is fired when an order is completely paid
    // Usually handled by payment.captured, but can be used for additional logic
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}

// Handle refund created event
async function handleRefundCreated(refund: any) {
  try {
    const { id: refund_id, payment_id, amount, status } = refund;

    // Find payment record
    const { data: paymentRecord, error: findError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('provider_payment_id', payment_id)
      .single();

    if (findError || !paymentRecord) {
      console.error('Payment record not found for refund:', payment_id);
      return;
    }

    // Update payment record with refund information
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'refunded',
        metadata: {
          ...paymentRecord.metadata,
          refund_id,
          refund_amount: amount,
          refund_status: status,
          refund_created_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.id);

    // Send refund notification
    await sendNotification(paymentRecord.user_id, {
      title: 'Refund Initiated',
      message: `A refund of ₹${amount / 100} has been initiated for your payment.`,
      type: 'refund_initiated',
      metadata: { payment_id: paymentRecord.id, refund_id, refund_amount: amount },
    });

    console.log(`Refund created: ${refund_id} for payment: ${payment_id}`);

  } catch (error) {
    console.error('Error handling refund created:', error);
  }
}

// Handle refund processed event
async function handleRefundProcessed(refund: any) {
  try {
    const { id: refund_id, payment_id, amount } = refund;

    // Find payment record
    const { data: paymentRecord, error: findError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('provider_payment_id', payment_id)
      .single();

    if (findError || !paymentRecord) {
      console.error('Payment record not found for processed refund:', payment_id);
      return;
    }

    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({
        metadata: {
          ...paymentRecord.metadata,
          refund_processed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.id);

    // Send refund completion notification
    await sendNotification(paymentRecord.user_id, {
      title: 'Refund Completed',
      message: `Your refund of ₹${amount / 100} has been processed and will be credited to your account.`,
      type: 'refund_completed',
      metadata: { payment_id: paymentRecord.id, refund_id, refund_amount: amount },
    });

    console.log(`Refund processed: ${refund_id} for payment: ${payment_id}`);

  } catch (error) {
    console.error('Error handling refund processed:', error);
  }
}

// Helper function to send notifications
async function sendNotification(user_id: string, notification: {
  title: string;
  message: string;
  type: string;
  metadata?: any;
}) {
  try {
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        metadata: notification.metadata,
      });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Disable Next.js body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default withMethods(['POST'])(
  withErrorHandling(handleRazorpayWebhook)
);
