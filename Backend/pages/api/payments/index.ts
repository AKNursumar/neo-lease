import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import { 
  successResponse, 
  errorResponse, 
  withMethods, 
  withErrorHandling, 
  validateQuery,
  createPagination,
  getPaginationOffset
} from '@/utils/api-helpers';
import { paginationSchema } from '@/utils/validation';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const paymentsQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  provider: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  order_type: z.enum(['booking', 'rental']).optional(),
});

// GET /api/payments - List payments with filtering
async function getPayments(req: AuthenticatedRequest, res: NextApiResponse) {
  const queryValidation = validateQuery(paymentsQuerySchema)(req);

  if (!queryValidation.success) {
    return errorResponse(res, 'Invalid query parameters', 400, 'VALIDATION_ERROR', queryValidation.errors);
  }

  const { 
    page = 1, 
    limit = 20, 
    status, 
    provider, 
    start_date, 
    end_date, 
    order_type 
  } = queryValidation.data;
  
  const offset = getPaginationOffset(page, limit);

  try {
    let query = supabase
      .from('payments')
      .select(`
        *,
        user:users(id, full_name, email, phone)
      `, { count: 'exact' });

    // Apply user-based filtering
    if (req.user.role === 'user') {
      query = query.eq('user_id', req.user.id);
    } else if (req.user.role === 'owner') {
      // Owners can see payments for their bookings/rentals
      // For now, owners can only see their own payments
      // TODO: Implement proper filtering for facility-related payments
      query = query.eq('user_id', req.user.id);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (provider) {
      query = query.eq('provider', provider);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    if (order_type) {
      query = query.contains('metadata', { order_type });
    }

    const { data: payments, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching payments:', error);
      return errorResponse(res, 'Failed to fetch payments');
    }

    // Get payment statistics for the user/admin
    const statsQuery = supabase
      .from('payments')
      .select('status, amount')
      .eq(req.user.role === 'user' ? 'user_id' : 'id', req.user.role === 'user' ? req.user.id : req.query.user_id || '');

    const { data: paymentStats } = await statsQuery;

    const stats = paymentStats?.reduce((acc, payment) => {
      acc.total_amount += payment.amount;
      acc.status_counts[payment.status] = (acc.status_counts[payment.status] || 0) + 1;
      return acc;
    }, {
      total_amount: 0,
      status_counts: {} as Record<string, number>
    });

    const pagination = createPagination(page, limit, count || 0);
    
    return successResponse(res, {
      payments: payments || [],
      stats,
    }, 'Payments retrieved successfully', 200, pagination);

  } catch (error) {
    console.error('Error in getPayments:', error);
    return errorResponse(res, 'Failed to retrieve payments');
  }
}

// POST /api/payments - Create refund
async function createRefund(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { payment_id, amount, reason } = req.body;

    if (!payment_id) {
      return errorResponse(res, 'Payment ID is required', 400);
    }

    // Get the original payment
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      return errorResponse(res, 'Payment not found', 404);
    }

    // Check if user has permission to refund
    if (req.user.role === 'user' && payment.user_id !== req.user.id) {
      return errorResponse(res, 'Access denied', 403);
    }

    if (payment.status !== 'completed') {
      return errorResponse(res, 'Only completed payments can be refunded', 400);
    }

    // Check if already refunded
    const { data: existingRefund } = await supabase
      .from('payments')
      .select('id')
      .eq('metadata->original_payment_id', payment_id)
      .eq('status', 'refunded')
      .single();

    if (existingRefund) {
      return errorResponse(res, 'Payment already refunded', 400);
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      return errorResponse(res, 'Refund amount cannot exceed original payment amount', 400);
    }

    // Create refund record
    const { data: refund, error: refundError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: payment.user_id,
        amount: -refundAmount, // Negative amount for refunds
        currency: payment.currency,
        provider: payment.provider,
        status: 'refunded',
        provider_order_id: payment.provider_order_id,
        provider_payment_id: payment.provider_payment_id,
        metadata: {
          ...payment.metadata,
          original_payment_id: payment_id,
          refund_reason: reason || 'User requested refund',
          refund_type: refundAmount === payment.amount ? 'full' : 'partial',
        },
      })
      .select()
      .single();

    if (refundError) {
      console.error('Error creating refund:', refundError);
      return errorResponse(res, 'Failed to process refund');
    }

    // Update related booking/rental status
    const metadata = payment.metadata as any;
    
    if (metadata?.booking_id) {
      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', metadata.booking_id);
    }

    if (metadata?.rental_order_id) {
      await supabaseAdmin
        .from('rental_orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', metadata.rental_order_id);

      // Restore product quantities
      const { data: rentalItems } = await supabase
        .from('rental_items')
        .select('product_id, quantity')
        .eq('rental_order_id', metadata.rental_order_id);

      if (rentalItems) {
        for (const item of rentalItems) {
          const { data: product } = await supabase
            .from('products')
            .select('available_quantity')
            .eq('id', item.product_id)
            .single();

          if (product) {
            await supabaseAdmin
              .from('products')
              .update({
                available_quantity: product.available_quantity + item.quantity
              })
              .eq('id', item.product_id);
          }
        }
      }
    }

    // Create notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: payment.user_id,
        title: 'Refund Processed',
        message: `Your refund of ₹${refundAmount} has been processed successfully.`,
        type: 'refund',
        metadata: {
          refund_id: refund.id,
          original_payment_id: payment_id,
          amount: refundAmount,
        },
      });

    return successResponse(res, refund, 'Refund processed successfully', 201);

  } catch (error) {
    console.error('Error in createRefund:', error);
    return errorResponse(res, 'Failed to process refund');
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return requireAuth(getPayments)(req as AuthenticatedRequest, res);
  }

  if (req.method === 'POST') {
    return requireAuth(createRefund)(req as AuthenticatedRequest, res);
  }

  return errorResponse(res, 'Method not allowed', 405);
}

export default withMethods(['GET', 'POST'])(
  withErrorHandling(handler)
);
