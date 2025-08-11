import { NextApiRequest, NextApiResponse } from 'next';
import { withCORS } from '@/middleware/cors';
import { supabase, supabaseAdmin } from '@/lib/supabase';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getProduct(req, res, id);
      case 'PUT':
        return await updateProduct(req, res, id);
      case 'DELETE':
        return await deleteProduct(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Product API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/products/[id] - Get single product with reviews
async function getProduct(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        reviews:reviews(
          id,
          rating,
          comment,
          created_at,
          user_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      console.error('Error fetching product:', error);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }

    // Check availability status
    const { data: activeRentals } = await supabase
      .from('rentals')
      .select('id, start_date, end_date, status')
      .eq('product_id', id)
      .in('status', ['pending', 'confirmed', 'active']);

    const availabilityInfo = {
      is_currently_available: product.is_available && (activeRentals?.length || 0) < product.stock_quantity,
      active_rentals: activeRentals?.length || 0,
      next_available_date: null as string | null
    };

    // Calculate next available date if fully booked
    if (!availabilityInfo.is_currently_available && activeRentals && activeRentals.length > 0) {
      const sortedRentals = activeRentals.sort((a, b) => 
        new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
      );
      availabilityInfo.next_available_date = sortedRentals[0]?.end_date;
    }

    return res.status(200).json({
      success: true,
      data: {
        ...product,
        availability: availabilityInfo
      }
    });

  } catch (error) {
    console.error('Error in getProduct:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
}

// PUT /api/products/[id] - Update product
async function updateProduct(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const updateData = req.body;

    // Remove read-only fields
    const { 
      id: productId, 
      created_at, 
      rating, 
      total_reviews,
      ...sanitizedData 
    } = updateData;

    // Add updated timestamp
    const productUpdate = {
      ...sanitizedData,
      updated_at: new Date().toISOString()
    };

    // Validation
    if (productUpdate.price_per_day !== undefined && productUpdate.price_per_day <= 0) {
      return res.status(400).json({ 
        error: 'Price per day must be greater than 0' 
      });
    }

    if (productUpdate.stock_quantity !== undefined && productUpdate.stock_quantity < 0) {
      return res.status(400).json({ 
        error: 'Stock quantity cannot be negative' 
      });
    }

    if (productUpdate.minimum_rental_days !== undefined && productUpdate.minimum_rental_days < 1) {
      return res.status(400).json({ 
        error: 'Minimum rental days must be at least 1' 
      });
    }

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(productUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      console.error('Error updating product:', error);
      return res.status(500).json({ error: 'Failed to update product' });
    }

    return res.status(200).json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error in updateProduct:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
}

// DELETE /api/products/[id] - Delete product (soft delete)
async function deleteProduct(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if product has active rentals
    const { data: activeRentals, error: rentalsError } = await supabase
      .from('rentals')
      .select('id')
      .eq('product_id', id)
      .in('status', ['pending', 'confirmed', 'active']);

    if (rentalsError) {
      console.error('Error checking active rentals:', rentalsError);
      return res.status(500).json({ error: 'Failed to check product rentals' });
    }

    if (activeRentals && activeRentals.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete product with active rentals',
        active_rentals: activeRentals.length
      });
    }

    // Soft delete by setting is_available to false
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update({ 
        is_available: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteProduct:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
}

export default withCORS(handler);
