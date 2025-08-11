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

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return errorResponse(res, 'Invalid review ID', 400);
  }

  if (req.method === 'GET') {
    return getReview(req, res, id as string);
  }

  if (req.method === 'PUT') {
    return requireAuth((req: AuthenticatedRequest, res: NextApiResponse) => updateReview(req, res, id as string))(req as AuthenticatedRequest, res);
  }

  if (req.method === 'DELETE') {
    return requireAuth((req: AuthenticatedRequest, res: NextApiResponse) => deleteReview(req, res, id as string))(req as AuthenticatedRequest, res);
  }

  return errorResponse(res, 'Method not allowed', 405);
}

// GET /api/reviews/[id] - Get single review
async function getReview(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { data: review, error } = await supabase
      .from('reviews')
      .select(`
        *,
        product:products(id, name, image_url, category, price_per_day),
        user:users(id, full_name),
        rental_order:rental_orders(id, start_date, end_date, status)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse(res, 'Review not found', 404);
      }
      console.error('Error fetching review:', error);
      return errorResponse(res, 'Failed to fetch review');
    }

    return successResponse(res, review, 'Review retrieved successfully');

  } catch (error) {
    console.error('Error in getReview:', error);
    return errorResponse(res, 'Failed to fetch review');
  }
}

// PUT /api/reviews/[id] - Update review
async function updateReview(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  const bodyValidation = validateBody(updateReviewSchema)(req);

  if (!bodyValidation.success) {
    return errorResponse(res, 'Invalid review data', 422, 'VALIDATION_ERROR', bodyValidation.errors);
  }

  const updateData = bodyValidation.data;

  try {
    // Check if review exists and belongs to user
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return errorResponse(res, 'Review not found or access denied', 404);
      }
      console.error('Error checking review:', checkError);
      return errorResponse(res, 'Failed to verify review access');
    }

    // Check if review is recent enough to be edited (within 24 hours)
    const reviewDate = new Date(existingReview.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return errorResponse(res, 'Reviews can only be edited within 24 hours of creation', 400);
    }

    // Update the review
    const { data: updatedReview, error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select(`
        *,
        product:products(id, name, image_url, category),
        user:users(id, full_name)
      `)
      .single();

    if (updateError) {
      console.error('Error updating review:', updateError);
      return errorResponse(res, 'Failed to update review');
    }

    // Update product rating statistics
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', existingReview.product_id);

    if (allReviews && allReviews.length > 0) {
      const totalReviews = allReviews.length;
      const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

      await supabaseAdmin
        .from('products')
        .update({
          rating: Math.round(averageRating * 10) / 10,
          total_reviews: totalReviews,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.product_id);
    }

    return successResponse(res, updatedReview, 'Review updated successfully');

  } catch (error) {
    console.error('Error in updateReview:', error);
    return errorResponse(res, 'Failed to update review');
  }
}

// DELETE /api/reviews/[id] - Delete review
async function deleteReview(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    // Check if review exists and belongs to user (or user is admin)
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return errorResponse(res, 'Review not found', 404);
      }
      console.error('Error checking review:', checkError);
      return errorResponse(res, 'Failed to verify review');
    }

    // Check permissions
    if (existingReview.user_id !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }

    // Delete the review
    const { error: deleteError } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting review:', deleteError);
      return errorResponse(res, 'Failed to delete review');
    }

    // Update product rating statistics
    const { data: remainingReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', existingReview.product_id);

    if (remainingReviews && remainingReviews.length > 0) {
      const totalReviews = remainingReviews.length;
      const averageRating = remainingReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

      await supabaseAdmin
        .from('products')
        .update({
          rating: Math.round(averageRating * 10) / 10,
          total_reviews: totalReviews,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.product_id);
    } else {
      // No reviews left, reset to defaults
      await supabaseAdmin
        .from('products')
        .update({
          rating: 0,
          total_reviews: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.product_id);
    }

    return successResponse(res, null, 'Review deleted successfully');

  } catch (error) {
    console.error('Error in deleteReview:', error);
    return errorResponse(res, 'Failed to delete review');
  }
}

export default withMethods(['GET', 'PUT', 'DELETE'])(
  withErrorHandling(handler)
);
