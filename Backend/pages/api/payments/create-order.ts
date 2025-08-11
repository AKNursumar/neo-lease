import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import { 
  successResponse, 
  errorResponse, 
  withMethods, 
  withErrorHandling, 
  validateBody
} from '@/utils/api-helpers';
import { createPaymentSchema } from '@/utils/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { createRazorpayOrder, generateReceiptId, rupeesToPaise } from '@/lib/razorpay';
import { nanoid } from 'nanoid';
import { z } from 'zod';

interface CreateOrderRequest {
  amount: number;
  currency?: string;
  booking_id?: string;
  rental_order_id?: string;
  notes?: Record<string, any>;
}

async function createOrderHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const bodyValidation = validateBody(createPaymentSchema.extend({
    booking_id: z.string().uuid().optional(),
    rental_order_id: z.string().uuid().optional(),
    notes: z.record(z.any()).optional(),
  }))(req);

  if (!bodyValidation.success) {
    return errorResponse(res, 'Invalid payment data', 422, 'VALIDATION_ERROR', bodyValidation.errors);
  }

  const { amount, currency = 'INR', booking_id, rental_order_id, notes = {} } = bodyValidation.data;

  try {
    // Validate that either booking_id or rental_order_id is provided
    if (!booking_id && !rental_order_id) {
      return errorResponse(res, 'Either booking_id or rental_order_id is required', 400);
    }

    // Verify booking or rental order exists and belongs to user
    let orderType: string = '';
    let orderDetails: any;

    if (booking_id) {
      const { data: booking, error } = await supabaseAdmin
        .from('bookings')
        .select('*, court:courts(*, facility:facilities(*))')
        .eq('id', booking_id)
        .eq('user_id', req.user.id)
        .single();

      if (error || !booking) {
        return errorResponse(res, 'Booking not found', 404);
      }

      if (booking.status !== 'draft') {
        return errorResponse(res, 'Booking is not in draft state', 400);
      }

      orderType = 'booking';
      orderDetails = booking;
    }

    if (rental_order_id) {
      const { data: rentalOrder, error } = await supabaseAdmin
        .from('rental_orders')
        .select('*, rental_items:rental_items(*, product:products(*, facility:facilities(*)))')
        .eq('id', rental_order_id)
        .eq('user_id', req.user.id)
        .single();

      if (error || !rentalOrder) {
        return errorResponse(res, 'Rental order not found', 404);
      }

      if (rentalOrder.status !== 'draft') {
        return errorResponse(res, 'Rental order is not in draft state', 400);
      }

      orderType = 'rental';
      orderDetails = rentalOrder;
    }

    // Create payment record in database
    const paymentId = nanoid();
    const receiptId = generateReceiptId(orderType);

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        id: paymentId,
        user_id: req.user.id,
        amount,
        currency,
        provider: 'razorpay',
        status: 'pending',
        metadata: {
          booking_id,
          rental_order_id,
          order_type: orderType,
          notes,
        },
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error('Error creating payment record:', paymentError);
      return errorResponse(res, 'Failed to create payment record');
    }

    // Create Razorpay order
    const amountInPaise = rupeesToPaise(amount);
    const razorpayResult = await createRazorpayOrder({
      amount: amountInPaise,
      currency,
      receipt: receiptId,
      notes: {
        payment_id: paymentId,
        user_id: req.user.id,
        order_type: orderType,
        ...notes,
      },
    });

    if (!razorpayResult.success || !razorpayResult.order) {
      // Cleanup payment record if Razorpay order creation fails
      await supabaseAdmin
        .from('payments')
        .delete()
        .eq('id', paymentId);

      console.error('Error creating Razorpay order:', razorpayResult.error);
      return errorResponse(res, 'Failed to create payment order');
    }

    // Update payment record with Razorpay order ID
    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        provider_order_id: razorpayResult.order.id,
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Error updating payment record:', updateError);
    }

    // Return order details for frontend
    const orderData = {
      payment_id: paymentId,
      razorpay_order_id: razorpayResult.order.id,
      amount: razorpayResult.order.amount,
      currency: razorpayResult.order.currency,
      order_type: orderType,
      order_details: orderType === 'booking' ? {
        booking_id,
        court_name: orderDetails.court.name,
        facility_name: orderDetails.court.facility.name,
        start_datetime: orderDetails.start_datetime,
        end_datetime: orderDetails.end_datetime,
      } : {
        rental_order_id,
        start_date: orderDetails.start_date,
        end_date: orderDetails.end_date,
        items_count: orderDetails.rental_items.length,
      },
    };

    return successResponse(res, orderData, 'Payment order created successfully', 201);

  } catch (error) {
    console.error('Error in create-order:', error);
    return errorResponse(res, 'Failed to create payment order');
  }
}

export default withMethods(['POST'])(
  withErrorHandling(
    requireAuth(createOrderHandler)
  )
);
