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
import { paginationSchema } from '@/utils/validation';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const createReviewSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000).optional(),
  rental_order_id: z.string().uuid().optional(),
});

const reviewsQuerySchema = paginationSchema.extend({
  product_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  has_comment: z.boolean().optional(),
});

// GET /api/reviews - List reviews with filtering
async function getReviews(req: NextApiRequest, res: NextApiResponse) {
  const queryValidation = validateQuery(reviewsQuerySchema)(req);

  if (!queryValidation.success) {
    return errorResponse(res, 'Invalid query parameters', 400, 'VALIDATION_ERROR', queryValidation.errors);
  }

  const { 
    page = 1, 
    limit = 20, 
    product_id, 
    user_id, 
    rating,
    has_comment 
  } = queryValidation.data;
  
  const offset = getPaginationOffset(page, limit);

  try {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        product:products(id, name, image_url, category),
        user:users(id, full_name)
      `, { count: 'exact' });

    // Apply filters
    if (product_id) {
      query = query.eq('product_id', product_id);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (rating) {
      query = query.eq('rating', rating);
    }

    if (has_comment !== undefined) {
      if (has_comment) {
        query = query.not('comment', 'is', null);
      } else {
        query = query.is('comment', null);
      }
    }

    const { data: reviews, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching reviews:', error);
      return errorResponse(res, 'Failed to fetch reviews');
    }

    // Get review statistics if filtering by product
    let reviewStats = null;
    if (product_id) {
      const { data: stats } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', product_id);

      if (stats && stats.length > 0) {
        const totalReviews = stats.length;
        const averageRating = stats.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
        const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
          rating,
          count: stats.filter(s => s.rating === rating).length
        }));

        reviewStats = {
          total_reviews: totalReviews,
          average_rating: Math.round(averageRating * 10) / 10,
          rating_distribution: ratingDistribution
        };
      }
    }

    const pagination = createPagination(page, limit, count || 0);
    
    return successResponse(res, {
      reviews: reviews || [],
      stats: reviewStats,
    }, 'Reviews retrieved successfully', 200, pagination);

  } catch (error) {
    console.error('Error in getReviews:', error);
    return errorResponse(res, 'Failed to retrieve reviews');
  }
}

// POST /api/reviews - Create new review
async function createReview(req: AuthenticatedRequest, res: NextApiResponse) {
  const bodyValidation = validateBody(createReviewSchema)(req);

  if (!bodyValidation.success) {
    return errorResponse(res, 'Invalid review data', 422, 'VALIDATION_ERROR', bodyValidation.errors);
  }

  const { product_id, rating, comment, rental_order_id } = bodyValidation.data;

  try {
    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return errorResponse(res, 'Product not found', 404);
    }

    // If rental_order_id is provided, verify it exists and belongs to the user
    if (rental_order_id) {
      const { data: rental, error: rentalError } = await supabase
        .from('rental_orders')
        .select('id, status')
        .eq('id', rental_order_id)
        .eq('user_id', req.user.id)
        .single();

      if (rentalError || !rental) {
        return errorResponse(res, 'Rental order not found', 404);
      }

      if (rental.status !== 'returned') {
        return errorResponse(res, 'Can only review completed rentals', 400);
      }

      // Check if user has already reviewed this rental
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', product_id)
        .eq('user_id', req.user.id)
        .eq('rental_order_id', rental_order_id)
        .single();

      if (existingReview) {
        return errorResponse(res, 'You have already reviewed this rental', 400);
      }
    } else {
      // If no rental_order_id, check if user has reviewed this product recently
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', product_id)
        .eq('user_id', req.user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .single();

      if (existingReview) {
        return errorResponse(res, 'You have already reviewed this product recently', 400);
      }
    }

    // Create the review
    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        product_id,
        user_id: req.user.id,
        rating,
        comment: comment || null,
        rental_order_id: rental_order_id || null,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        product:products(id, name, image_url, category),
        user:users(id, full_name)
      `)
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return errorResponse(res, 'Failed to create review');
    }

    // Update product rating statistics (will be handled by trigger function in database)
    // But let's also do it manually as backup
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', product_id);

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
        .eq('id', product_id);
    }

    return successResponse(res, review, 'Review created successfully', 201);

  } catch (error) {
    console.error('Error in createReview:', error);
    return errorResponse(res, 'Failed to create review');
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getReviews(req, res);
  }

  if (req.method === 'POST') {
    return requireAuth(createReview)(req as AuthenticatedRequest, res);
  }

  return errorResponse(res, 'Method not allowed', 405);
}

export default withMethods(['GET', 'POST'])(
  withErrorHandling(handler)
);
