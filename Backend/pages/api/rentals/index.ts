import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import { 
  successResponse, 
  errorResponse, 
  withMethods, 
  withErrorHandling, 
  validateBody,
  validateQuery,
  createPagination,
  getPaginationOffset
} from '@/utils/api-helpers';
import { 
  createRentalOrderSchema, 
  paginationSchema 
} from '@/utils/validation';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import { z } from 'zod';

// GET /api/rentals - List rental orders
async function getRentalOrders(req: NextApiRequest & { user?: any }, res: NextApiResponse) {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', 401);
  }

  const queryValidation = validateQuery(paginationSchema.extend({
    status: z.enum(['draft', 'confirmed', 'active', 'returned', 'cancelled', 'overdue']).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  }))(req);

  if (!queryValidation.success) {
    return errorResponse(res, 'Invalid query parameters', 400, 'VALIDATION_ERROR', queryValidation.errors);
  }

  const { page = 1, limit = 20, status, start_date, end_date } = queryValidation.data;
  const offset = getPaginationOffset(page, limit);

  try {
    let query = supabase
      .from('rental_orders')
      .select(`
        *,
        user:users(id, full_name, phone),
        rental_items:rental_items(
          *,
          product:products(
            *,
            facility:facilities(id, name, address, owner_id)
          )
        ),
        payment:payments(id, amount, currency, status)
      `, { count: 'exact' });

    // Apply filters based on user role
    if (req.user.role === 'user') {
      query = query.eq('user_id', req.user.id);
    } else if (req.user.role === 'owner') {
      // Owners can see rentals for their products
      const { data: ownerFacilities } = await supabase
        .from('facilities')
        .select('id')
        .eq('owner_id', req.user.id);

      if (ownerFacilities && ownerFacilities.length > 0) {
        const facilityIds = ownerFacilities.map(f => f.id);
        const { data: facilityProducts } = await supabase
          .from('products')
          .select('id')
          .in('facility_id', facilityIds);

        if (facilityProducts && facilityProducts.length > 0) {
          const productIds = facilityProducts.map(p => p.id);
          const { data: rentalItemsWithOrders } = await supabase
            .from('rental_items')
            .select('rental_order_id')
            .in('product_id', productIds);

          if (rentalItemsWithOrders && rentalItemsWithOrders.length > 0) {
            const orderIds = Array.from(new Set(rentalItemsWithOrders.map(ri => ri.rental_order_id)));
            query = query.in('id', orderIds);
          } else {
            return successResponse(res, [], 'No rental orders found', 200, createPagination(page, limit, 0));
          }
        }
      }
    }

    // Apply additional filters
    if (status) query = query.eq('status', status);
    if (start_date) query = query.gte('start_date', start_date);
    if (end_date) query = query.lte('end_date', end_date);

    const { data: rentalOrders, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching rental orders:', error);
      return errorResponse(res, 'Failed to fetch rental orders');
    }

    const pagination = createPagination(page, limit, count || 0);
    return successResponse(res, rentalOrders, 'Rental orders retrieved successfully', 200, pagination);

  } catch (error) {
    console.error('Error in GET /api/rentals:', error);
    return errorResponse(res, 'Failed to retrieve rental orders');
  }
}

// POST /api/rentals - Create new rental order
async function createRentalOrder(req: AuthenticatedRequest, res: NextApiResponse) {
  const bodyValidation = validateBody(createRentalOrderSchema)(req);

  if (!bodyValidation.success) {
    return errorResponse(res, 'Invalid rental order data', 422, 'VALIDATION_ERROR', bodyValidation.errors);
  }

  const { start_date, end_date, items, notes } = bodyValidation.data;

  try {
    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (startDate <= new Date()) {
      return errorResponse(res, 'Rental must start in the future', 400);
    }

    if (endDate <= startDate) {
      return errorResponse(res, 'End date must be after start date', 400);
    }

    // Validate products and check availability
    let totalAmount = 0;
    let totalDepositAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          facility:facilities(id, name, is_active, owner_id)
        `)
        .eq('id', item.product_id)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        return errorResponse(res, `Product ${item.product_id} not found or inactive`, 404);
      }

      if (!product.facility.is_active) {
        return errorResponse(res, `Facility for product ${product.name} is not active`, 400);
      }

      // Check if enough quantity is available
      if (product.available_quantity < item.quantity) {
        return errorResponse(
          res, 
          `Insufficient quantity for ${product.name}. Available: ${product.available_quantity}, Requested: ${item.quantity}`, 
          400, 
          'INSUFFICIENT_QUANTITY'
        );
      }

      // Calculate rental duration in days
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate price based on pricing structure
      const pricing = product.pricing as any;
      let unitPrice = 0;

      if (durationDays >= 30 && pricing.month) {
        unitPrice = pricing.month * Math.ceil(durationDays / 30);
      } else if (durationDays >= 7 && pricing.week) {
        unitPrice = pricing.week * Math.ceil(durationDays / 7);
      } else if (pricing.day) {
        unitPrice = pricing.day * durationDays;
      } else if (pricing.hour) {
        unitPrice = pricing.hour * (durationDays * 24);
      } else {
        return errorResponse(res, `No valid pricing found for ${product.name}`, 400);
      }

      const itemTotalPrice = unitPrice * item.quantity;
      const itemDepositAmount = product.deposit_amount * item.quantity;

      totalAmount += itemTotalPrice;
      totalDepositAmount += itemDepositAmount;

      validatedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: itemTotalPrice,
      });
    }

    // Create rental order
    const rentalOrderId = nanoid();
    const { data: rentalOrder, error: orderError } = await supabaseAdmin
      .from('rental_orders')
      .insert({
        id: rentalOrderId,
        user_id: req.user.id,
        start_date,
        end_date,
        total_amount: totalAmount,
        deposit_amount: totalDepositAmount,
        notes,
        status: 'draft',
      })
      .select()
      .single();

    if (orderError || !rentalOrder) {
      console.error('Error creating rental order:', orderError);
      return errorResponse(res, 'Failed to create rental order');
    }

    // Create rental items
    const rentalItemsData = validatedItems.map(item => ({
      ...item,
      rental_order_id: rentalOrderId,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('rental_items')
      .insert(rentalItemsData);

    if (itemsError) {
      // Cleanup: delete the rental order if items creation fails
      await supabaseAdmin.from('rental_orders').delete().eq('id', rentalOrderId);
      console.error('Error creating rental items:', itemsError);
      return errorResponse(res, 'Failed to create rental items');
    }

    // Fetch complete rental order with items
    const { data: completeOrder, error: fetchError } = await supabaseAdmin
      .from('rental_orders')
      .select(`
        *,
        user:users(id, full_name, phone),
        rental_items:rental_items(
          *,
          product:products(
            *,
            facility:facilities(id, name, address)
          )
        )
      `)
      .eq('id', rentalOrderId)
      .single();

    if (fetchError || !completeOrder) {
      console.error('Error fetching complete rental order:', fetchError);
      return errorResponse(res, 'Failed to fetch rental order details');
    }

    return successResponse(res, completeOrder, 'Rental order created successfully', 201);

  } catch (error) {
    console.error('Error in POST /api/rentals:', error);
    return errorResponse(res, 'Failed to create rental order');
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return requireAuth(getRentalOrders)(req as AuthenticatedRequest, res);
  }

  if (req.method === 'POST') {
    return requireAuth(createRentalOrder)(req as AuthenticatedRequest, res);
  }

  return errorResponse(res, 'Method not allowed', 405);
}

export default withMethods(['GET', 'POST'])(
  withErrorHandling(handler)
);
