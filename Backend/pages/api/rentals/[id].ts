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

const updateRentalSchema = z.object({
  status: z.enum(['draft', 'confirmed', 'active', 'returned', 'cancelled', 'overdue']).optional(),
  notes: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return errorResponse(res, 'Invalid rental ID', 400);
  }

  if (req.method === 'GET') {
    return requireAuth((req: AuthenticatedRequest, res: NextApiResponse) => getRental(req, res, id as string))(req as AuthenticatedRequest, res);
  }

  if (req.method === 'PUT') {
    return requireAuth((req: AuthenticatedRequest, res: NextApiResponse) => updateRental(req, res, id as string))(req as AuthenticatedRequest, res);
  }

  if (req.method === 'DELETE') {
    return requireAuth((req: AuthenticatedRequest, res: NextApiResponse) => deleteRental(req, res, id as string))(req as AuthenticatedRequest, res);
  }

  return errorResponse(res, 'Method not allowed', 405);
}

// GET /api/rentals/[id] - Get single rental order
async function getRental(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    let query = supabase
      .from('rental_orders')
      .select(`
        *,
        user:users(id, full_name, phone, email),
        rental_items:rental_items(
          *,
          product:products(
            *,
            facility:facilities(id, name, address, owner_id)
          )
        ),
        payment:payments(id, amount, currency, status, razorpay_order_id, razorpay_payment_id)
      `)
      .eq('id', id);

    // Apply access control
    if (req.user.role === 'user') {
      query = query.eq('user_id', req.user.id);
    } else if (req.user.role === 'owner') {
      // Owners can only see rentals for their products
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
          const { data: rentalItems } = await supabase
            .from('rental_items')
            .select('rental_order_id')
            .eq('rental_order_id', id)
            .in('product_id', productIds);

          if (!rentalItems || rentalItems.length === 0) {
            return errorResponse(res, 'Rental not found', 404);
          }
        } else {
          return errorResponse(res, 'Rental not found', 404);
        }
      } else {
        return errorResponse(res, 'Rental not found', 404);
      }
    }

    const { data: rental, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse(res, 'Rental not found', 404);
      }
      console.error('Error fetching rental:', error);
      return errorResponse(res, 'Failed to fetch rental');
    }

    return successResponse(res, rental, 'Rental retrieved successfully');

  } catch (error) {
    console.error('Error in getRental:', error);
    return errorResponse(res, 'Failed to fetch rental');
  }
}

// PUT /api/rentals/[id] - Update rental order
async function updateRental(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  const bodyValidation = validateBody(updateRentalSchema)(req);

  if (!bodyValidation.success) {
    return errorResponse(res, 'Invalid rental data', 422, 'VALIDATION_ERROR', bodyValidation.errors);
  }

  const updateData = bodyValidation.data;

  try {
    // First, check if rental exists and user has permission
    let checkQuery = supabase
      .from('rental_orders')
      .select('*')
      .eq('id', id);

    if (req.user.role === 'user') {
      checkQuery = checkQuery.eq('user_id', req.user.id);
    } else if (req.user.role === 'owner') {
      // For owners, we need to check if they own any products in this rental
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
          const { data: rentalItems } = await supabase
            .from('rental_items')
            .select('rental_order_id')
            .eq('rental_order_id', id)
            .in('product_id', productIds);

          if (!rentalItems || rentalItems.length === 0) {
            return errorResponse(res, 'Rental not found or access denied', 404);
          }
        } else {
          return errorResponse(res, 'Rental not found or access denied', 404);
        }
      } else {
        return errorResponse(res, 'Rental not found or access denied', 404);
      }
    }

    const { data: existingRental, error: checkError } = await checkQuery.single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return errorResponse(res, 'Rental not found or access denied', 404);
      }
      console.error('Error checking rental:', checkError);
      return errorResponse(res, 'Failed to verify rental access');
    }

    // Validate status transitions
    if (updateData.status) {
      const currentStatus = existingRental.status;
      const newStatus = updateData.status;

      const validTransitions: Record<string, string[]> = {
        'draft': ['confirmed', 'cancelled'],
        'confirmed': ['active', 'cancelled'],
        'active': ['returned', 'overdue'],
        'returned': [], // Final state
        'cancelled': [], // Final state
        'overdue': ['returned', 'cancelled']
      };

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return errorResponse(
          res, 
          `Cannot transition from ${currentStatus} to ${newStatus}`, 
          400, 
          'INVALID_STATUS_TRANSITION'
        );
      }

      // Handle special status changes
      if (newStatus === 'active') {
        // When moving to active, update product quantities
        const { data: rentalItems } = await supabase
          .from('rental_items')
          .select('product_id, quantity')
          .eq('rental_order_id', id);

        if (rentalItems) {
          for (const item of rentalItems) {
            // Get current quantity first
            const { data: currentProduct } = await supabase
              .from('products')
              .select('available_quantity')
              .eq('id', item.product_id)
              .single();

            if (currentProduct) {
              const { error: updateError } = await supabaseAdmin
                .from('products')
                .update({
                  available_quantity: currentProduct.available_quantity - item.quantity
                })
                .eq('id', item.product_id);

              if (updateError) {
                console.error('Error updating product quantity:', updateError);
                return errorResponse(res, 'Failed to update product availability');
              }
            }
          }
        }
      } else if (newStatus === 'returned' || newStatus === 'cancelled') {
        // When returning or cancelling, restore product quantities
        const { data: rentalItems } = await supabase
          .from('rental_items')
          .select('product_id, quantity')
          .eq('rental_order_id', id);

        if (rentalItems) {
          for (const item of rentalItems) {
            // Get current quantity first
            const { data: currentProduct } = await supabase
              .from('products')
              .select('available_quantity')
              .eq('id', item.product_id)
              .single();

            if (currentProduct) {
              const { error: updateError } = await supabaseAdmin
                .from('products')
                .update({
                  available_quantity: currentProduct.available_quantity + item.quantity
                })
                .eq('id', item.product_id);

              if (updateError) {
                console.error('Error restoring product quantity:', updateError);
                return errorResponse(res, 'Failed to restore product availability');
              }
            }
          }
        }
      }
    }

    // Validate date changes
    if (updateData.start_date || updateData.end_date) {
      const startDate = new Date(updateData.start_date || existingRental.start_date);
      const endDate = new Date(updateData.end_date || existingRental.end_date);

      if (endDate <= startDate) {
        return errorResponse(res, 'End date must be after start date', 400);
      }

      if (existingRental.status === 'active' && updateData.start_date) {
        const now = new Date();
        if (startDate > now) {
          return errorResponse(res, 'Cannot change start date for active rental', 400);
        }
      }
    }

    // Update the rental
    const { data: updatedRental, error: updateError } = await supabaseAdmin
      .from('rental_orders')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        user:users(id, full_name, phone, email),
        rental_items:rental_items(
          *,
          product:products(
            *,
            facility:facilities(id, name, address)
          )
        ),
        payment:payments(id, amount, currency, status)
      `)
      .single();

    if (updateError) {
      console.error('Error updating rental:', updateError);
      return errorResponse(res, 'Failed to update rental');
    }

    return successResponse(res, updatedRental, 'Rental updated successfully');

  } catch (error) {
    console.error('Error in updateRental:', error);
    return errorResponse(res, 'Failed to update rental');
  }
}

// DELETE /api/rentals/[id] - Delete/Cancel rental order
async function deleteRental(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    // Check if rental exists and user has permission
    let checkQuery = supabase
      .from('rental_orders')
      .select('*, rental_items(*)')
      .eq('id', id);

    if (req.user.role === 'user') {
      checkQuery = checkQuery.eq('user_id', req.user.id);
    } else if (req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }

    const { data: rental, error: checkError } = await checkQuery.single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return errorResponse(res, 'Rental not found or access denied', 404);
      }
      console.error('Error checking rental:', checkError);
      return errorResponse(res, 'Failed to verify rental access');
    }

    // Only allow deletion of draft or cancelled rentals
    if (!['draft', 'cancelled'].includes(rental.status)) {
      return errorResponse(
        res, 
        'Only draft or cancelled rentals can be deleted', 
        400, 
        'INVALID_RENTAL_STATE'
      );
    }

    // Delete rental items first (due to foreign key constraints)
    const { error: itemsDeleteError } = await supabaseAdmin
      .from('rental_items')
      .delete()
      .eq('rental_order_id', id);

    if (itemsDeleteError) {
      console.error('Error deleting rental items:', itemsDeleteError);
      return errorResponse(res, 'Failed to delete rental items');
    }

    // Delete the rental order
    const { error: deleteError } = await supabaseAdmin
      .from('rental_orders')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting rental:', deleteError);
      return errorResponse(res, 'Failed to delete rental');
    }

    return successResponse(res, null, 'Rental deleted successfully');

  } catch (error) {
    console.error('Error in deleteRental:', error);
    return errorResponse(res, 'Failed to delete rental');
  }
}

export default withMethods(['GET', 'PUT', 'DELETE'])(
  withErrorHandling(handler)
);
