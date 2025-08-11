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

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return errorResponse(res, 'Invalid cart item ID', 400);
  }

  if (req.method === 'GET') {
    return requireAuth((req: AuthenticatedRequest, res: NextApiResponse) => getCartItem(req, res, id as string))(req as AuthenticatedRequest, res);
  }

  if (req.method === 'PUT') {
    return requireAuth((req: AuthenticatedRequest, res: NextApiResponse) => updateCartItem(req, res, id as string))(req as AuthenticatedRequest, res);
  }

  if (req.method === 'DELETE') {
    return requireAuth((req: AuthenticatedRequest, res: NextApiResponse) => removeCartItem(req, res, id as string))(req as AuthenticatedRequest, res);
  }

  return errorResponse(res, 'Method not allowed', 405);
}

// GET /api/cart/[id] - Get single cart item
async function getCartItem(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const { data: cartItem, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(
          *,
          facility:facilities(id, name, address, owner_id)
        )
      `)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse(res, 'Cart item not found', 404);
      }
      console.error('Error fetching cart item:', error);
      return errorResponse(res, 'Failed to fetch cart item');
    }

    // Calculate pricing details
    const startDate = new Date(cartItem.start_date);
    const endDate = new Date(cartItem.end_date);
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const unitPrice = cartItem.product.price_per_day * durationDays;
    const itemTotal = unitPrice * cartItem.quantity;
    const itemDeposit = cartItem.product.deposit_amount * cartItem.quantity;

    const enrichedItem = {
      ...cartItem,
      duration_days: durationDays,
      unit_price: unitPrice,
      item_total: itemTotal,
      item_deposit: itemDeposit,
    };

    return successResponse(res, enrichedItem, 'Cart item retrieved successfully');

  } catch (error) {
    console.error('Error in getCartItem:', error);
    return errorResponse(res, 'Failed to fetch cart item');
  }
}

// PUT /api/cart/[id] - Update cart item
async function updateCartItem(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  const bodyValidation = validateBody(updateCartItemSchema)(req);

  if (!bodyValidation.success) {
    return errorResponse(res, 'Invalid cart item data', 422, 'VALIDATION_ERROR', bodyValidation.errors);
  }

  const updateData = bodyValidation.data;

  try {
    // Check if cart item exists and belongs to user
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return errorResponse(res, 'Cart item not found', 404);
      }
      console.error('Error checking cart item:', checkError);
      return errorResponse(res, 'Failed to verify cart item');
    }

    // Validate date changes
    if (updateData.start_date || updateData.end_date) {
      const startDate = new Date(updateData.start_date || existingItem.start_date);
      const endDate = new Date(updateData.end_date || existingItem.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        return errorResponse(res, 'Start date cannot be in the past', 400);
      }

      if (endDate <= startDate) {
        return errorResponse(res, 'End date must be after start date', 400);
      }

      // Calculate rental duration for validation
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

      // Check minimum and maximum rental days
      if (durationDays < existingItem.product.minimum_rental_days) {
        return errorResponse(res, `Minimum rental period is ${existingItem.product.minimum_rental_days} days`, 400);
      }

      if (durationDays > existingItem.product.maximum_rental_days) {
        return errorResponse(res, `Maximum rental period is ${existingItem.product.maximum_rental_days} days`, 400);
      }
    }

    // Validate quantity changes
    if (updateData.quantity !== undefined) {
      if (updateData.quantity > existingItem.product.stock_quantity) {
        return errorResponse(res, `Only ${existingItem.product.stock_quantity} units available`, 400);
      }
    }

    // Update the cart item
    const { data: updatedItem, error: updateError } = await supabaseAdmin
      .from('cart_items')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select(`
        *,
        product:products(
          *,
          facility:facilities(id, name, address)
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating cart item:', updateError);
      return errorResponse(res, 'Failed to update cart item');
    }

    // Calculate updated pricing
    const startDate = new Date(updatedItem.start_date);
    const endDate = new Date(updatedItem.end_date);
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const unitPrice = updatedItem.product.price_per_day * durationDays;
    const itemTotal = unitPrice * updatedItem.quantity;
    const itemDeposit = updatedItem.product.deposit_amount * updatedItem.quantity;

    const enrichedItem = {
      ...updatedItem,
      duration_days: durationDays,
      unit_price: unitPrice,
      item_total: itemTotal,
      item_deposit: itemDeposit,
    };

    return successResponse(res, enrichedItem, 'Cart item updated successfully');

  } catch (error) {
    console.error('Error in updateCartItem:', error);
    return errorResponse(res, 'Failed to update cart item');
  }
}

// DELETE /api/cart/[id] - Remove cart item
async function removeCartItem(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    // Check if cart item exists and belongs to user
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return errorResponse(res, 'Cart item not found', 404);
      }
      console.error('Error checking cart item:', checkError);
      return errorResponse(res, 'Failed to verify cart item');
    }

    // Delete the cart item
    const { error: deleteError } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (deleteError) {
      console.error('Error removing cart item:', deleteError);
      return errorResponse(res, 'Failed to remove cart item');
    }

    return successResponse(res, null, 'Cart item removed successfully');

  } catch (error) {
    console.error('Error in removeCartItem:', error);
    return errorResponse(res, 'Failed to remove cart item');
  }
}

export default withMethods(['GET', 'PUT', 'DELETE'])(
  withErrorHandling(handler)
);
