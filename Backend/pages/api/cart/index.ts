import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import { 
  successResponse, 
  errorResponse, 
  withMethods, 
  withErrorHandling, 
  validateBody
} from '@/utils/api-helpers';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const addToCartSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

// GET /api/cart - Get user's cart items
async function getCart(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(
          *,
          facility:facilities(id, name, address, owner_id)
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cart:', error);
      return errorResponse(res, 'Failed to fetch cart');
    }

    // Calculate totals
    let totalAmount = 0;
    let totalDepositAmount = 0;
    let totalItems = 0;

    const processedItems = cartItems?.map(item => {
      const startDate = new Date(item.start_date);
      const endDate = new Date(item.end_date);
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const unitPrice = item.product.price_per_day * durationDays;
      const itemTotal = unitPrice * item.quantity;
      const itemDeposit = item.product.deposit_amount * item.quantity;

      totalAmount += itemTotal;
      totalDepositAmount += itemDeposit;
      totalItems += item.quantity;

      return {
        ...item,
        duration_days: durationDays,
        unit_price: unitPrice,
        item_total: itemTotal,
        item_deposit: itemDeposit,
      };
    }) || [];

    return successResponse(res, {
      items: processedItems,
      summary: {
        total_items: totalItems,
        subtotal: totalAmount,
        deposit: totalDepositAmount,
        total: totalAmount + totalDepositAmount,
        unique_products: cartItems?.length || 0,
      }
    }, 'Cart retrieved successfully');

  } catch (error) {
    console.error('Error in getCart:', error);
    return errorResponse(res, 'Failed to retrieve cart');
  }
}

// POST /api/cart - Add item to cart
async function addToCart(req: AuthenticatedRequest, res: NextApiResponse) {
  const bodyValidation = validateBody(addToCartSchema)(req);

  if (!bodyValidation.success) {
    return errorResponse(res, 'Invalid cart item data', 422, 'VALIDATION_ERROR', bodyValidation.errors);
  }

  const { product_id, quantity, start_date, end_date } = bodyValidation.data;

  try {
    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return errorResponse(res, 'Start date cannot be in the past', 400);
    }

    if (endDate <= startDate) {
      return errorResponse(res, 'End date must be after start date', 400);
    }

    // Check if product exists and is available
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('is_available', true)
      .single();

    if (productError || !product) {
      return errorResponse(res, 'Product not found or not available', 404);
    }

    // Calculate rental duration
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Check minimum and maximum rental days
    if (durationDays < product.minimum_rental_days) {
      return errorResponse(res, `Minimum rental period is ${product.minimum_rental_days} days`, 400);
    }

    if (durationDays > product.maximum_rental_days) {
      return errorResponse(res, `Maximum rental period is ${product.maximum_rental_days} days`, 400);
    }

    // Check stock availability
    if (quantity > product.stock_quantity) {
      return errorResponse(res, `Only ${product.stock_quantity} units available`, 400);
    }

    // Check for existing cart item with same product and dates
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('product_id', product_id)
      .eq('start_date', start_date)
      .eq('end_date', end_date)
      .single();

    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > product.stock_quantity) {
        return errorResponse(res, `Cannot add more items. Total would exceed available stock (${product.stock_quantity})`, 400);
      }

      const { data: updatedItem, error: updateError } = await supabaseAdmin
        .from('cart_items')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select(`
          *,
          product:products(*)
        `)
        .single();

      if (updateError) {
        console.error('Error updating cart item:', updateError);
        return errorResponse(res, 'Failed to update cart item');
      }

      return successResponse(res, updatedItem, 'Cart item updated successfully');
    }

    // Create new cart item
    const { data: cartItem, error } = await supabaseAdmin
      .from('cart_items')
      .insert({
        user_id: req.user.id,
        product_id,
        quantity,
        start_date,
        end_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        product:products(*)
      `)
      .single();

    if (error) {
      console.error('Error adding to cart:', error);
      return errorResponse(res, 'Failed to add item to cart');
    }

    return successResponse(res, cartItem, 'Item added to cart successfully', 201);

  } catch (error) {
    console.error('Error in addToCart:', error);
    return errorResponse(res, 'Failed to add item to cart');
  }
}

// DELETE /api/cart - Clear entire cart
async function clearCart(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Error clearing cart:', error);
      return errorResponse(res, 'Failed to clear cart');
    }

    return successResponse(res, null, 'Cart cleared successfully');

  } catch (error) {
    console.error('Error in clearCart:', error);
    return errorResponse(res, 'Failed to clear cart');
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return requireAuth(getCart)(req as AuthenticatedRequest, res);
  }

  if (req.method === 'POST') {
    return requireAuth(addToCart)(req as AuthenticatedRequest, res);
  }

  if (req.method === 'DELETE') {
    return requireAuth(clearCart)(req as AuthenticatedRequest, res);
  }

  return errorResponse(res, 'Method not allowed', 405);
}

export default withMethods(['GET', 'POST', 'DELETE'])(
  withErrorHandling(handler)
);
