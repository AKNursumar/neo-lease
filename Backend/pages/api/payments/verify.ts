import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import { 
  successResponse, 
  errorResponse, 
  withMethods, 
  withErrorHandling, 
  validateBody
} from '@/utils/api-helpers';
import { verifyPaymentSchema } from '@/utils/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { z } from 'zod';

async function verifyPaymentHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const bodyValidation = validateBody(verifyPaymentSchema)(req);

  if (!bodyValidation.success) {
    return errorResponse(res, 'Invalid payment verification data', 422, 'VALIDATION_ERROR', bodyValidation.errors);
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = bodyValidation.data;

  try {
    // Find payment record by Razorpay order ID
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('provider_order_id', razorpay_order_id)
      .eq('user_id', req.user.id)
      .single();

    if (paymentError || !payment) {
      return errorResponse(res, 'Payment record not found', 404);
    }

    if (payment.status === 'completed') {
      return errorResponse(res, 'Payment already verified', 400);
    }

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValidSignature) {
      // Update payment status to failed
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'failed',
          provider_payment_id: razorpay_payment_id,
          provider_signature: razorpay_signature,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      return errorResponse(res, 'Invalid payment signature', 400, 'PAYMENT_VERIFICATION_FAILED');
    }

    // Update payment record
    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        provider_payment_id: razorpay_payment_id,
        provider_signature: razorpay_signature,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return errorResponse(res, 'Failed to update payment status');
    }

    // Update related booking or rental order status
    const metadata = payment.metadata as any;
    
    if (metadata?.booking_id) {
      const { error: bookingError } = await supabaseAdmin
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_id: payment.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', metadata.booking_id)
        .eq('user_id', req.user.id);

      if (bookingError) {
        console.error('Error updating booking:', bookingError);
      }
    }

    if (metadata?.rental_order_id) {
      const { error: rentalError } = await supabaseAdmin
        .from('rental_orders')
        .update({
          status: 'confirmed',
          payment_id: payment.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', metadata.rental_order_id)
        .eq('user_id', req.user.id);

      if (rentalError) {
        console.error('Error updating rental order:', rentalError);
      }

      // Update product quantities for rental items
      const { data: rentalItems } = await supabaseAdmin
        .from('rental_items')
        .select('product_id, quantity')
        .eq('rental_order_id', metadata.rental_order_id);

      if (rentalItems) {
        for (const item of rentalItems) {
          await supabaseAdmin.rpc('update_product_quantity', {
            product_id: item.product_id,
          });
        }
      }
    }

    // Create success notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: req.user.id,
        title: 'Payment Successful',
        message: metadata?.booking_id 
          ? 'Your booking has been confirmed successfully!'
          : 'Your rental order has been confirmed successfully!',
        type: 'payment_success',
        metadata: {
          payment_id: payment.id,
          booking_id: metadata?.booking_id,
          rental_order_id: metadata?.rental_order_id,
        },
      });

    // Return success response with updated payment details
    const { data: updatedPayment } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        user:users(id, full_name)
      `)
      .eq('id', payment.id)
      .single();

    return successResponse(
      res,
      {
        payment: updatedPayment,
        verified: true,
        order_type: metadata?.order_type || 'unknown',
        booking_id: metadata?.booking_id,
        rental_order_id: metadata?.rental_order_id,
      },
      'Payment verified successfully'
    );

  } catch (error) {
    console.error('Error in payment verification:', error);
    return errorResponse(res, 'Payment verification failed');
  }
}

export default withMethods(['POST'])(
  withErrorHandling(
    requireAuth(verifyPaymentHandler)
  )
);
