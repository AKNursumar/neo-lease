import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, requireOwnerOrAdmin, optionalAuth, AuthenticatedRequest } from '@/middleware/auth';
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
  createFacilitySchema, 
  paginationSchema,
  formatValidationErrors 
} from '@/utils/validation';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import { z } from 'zod';

// GET /api/facilities - List facilities with optional filters
async function getFacilities(req: NextApiRequest & { user?: any }, res: NextApiResponse) {
  const queryValidation = validateQuery(paginationSchema.extend({
    owner_id: z.string().uuid().optional(),
    search: z.string().optional(),
    city: z.string().optional(),
    sport_type: z.string().optional(),
    is_active: z.coerce.boolean().optional(),
  }))(req);

  if (!queryValidation.success) {
    return errorResponse(res, 'Invalid query parameters', 400, 'VALIDATION_ERROR', queryValidation.errors);
  }

  const { page = 1, limit = 10, owner_id, search, city, sport_type, is_active } = queryValidation.data;
  const offset = getPaginationOffset(page, limit);

  try {
    let query = supabase
      .from('facilities')
      .select(`
        *,
        owner:users(id, full_name, phone),
        courts:courts(count),
        products:products(count)
      `, { count: 'exact' });

    // Apply filters
    if (owner_id) {
      query = query.eq('owner_id', owner_id);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%, address.ilike.%${search}%`);
    }

    if (city) {
      query = query.ilike('address', `%${city}%`);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active);
    }

    // If not authenticated or not admin, only show active facilities
    if (!req.user || req.user.role !== 'admin') {
      query = query.eq('is_active', true);
    }

    // Add sport type filter by joining with courts
    if (sport_type) {
      const { data: courtFacilities } = await supabase
        .from('courts')
        .select('facility_id')
        .eq('sport_type', sport_type)
        .eq('is_active', true);

      if (courtFacilities && courtFacilities.length > 0) {
        const facilityIds = courtFacilities.map(c => c.facility_id);
        query = query.in('id', facilityIds);
      } else {
        // No facilities match the sport type filter
        return successResponse(res, [], 'No facilities found', 200, createPagination(page, limit, 0));
      }
    }

    const { data: facilities, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching facilities:', error);
      return errorResponse(res, 'Failed to fetch facilities');
    }

    const pagination = createPagination(page, limit, count || 0);
    return successResponse(res, facilities, 'Facilities retrieved successfully', 200, pagination);

  } catch (error) {
    console.error('Error in GET /api/facilities:', error);
    return errorResponse(res, 'Failed to retrieve facilities');
  }
}

// POST /api/facilities - Create new facility (owner/admin only)
async function createFacility(req: AuthenticatedRequest, res: NextApiResponse) {
  const bodyValidation = validateBody(createFacilitySchema)(req);

  if (!bodyValidation.success) {
    return errorResponse(res, 'Invalid facility data', 422, 'VALIDATION_ERROR', bodyValidation.errors);
  }

  const facilityData = bodyValidation.data;

  try {
    // Create facility record
    const facilityId = nanoid();
    const { data: facility, error } = await supabaseAdmin
      .from('facilities')
      .insert({
        id: facilityId,
        owner_id: req.user.id,
        ...facilityData,
      })
      .select(`
        *,
        owner:users(id, full_name, phone)
      `)
      .single();

    if (error) {
      console.error('Error creating facility:', error);
      return errorResponse(res, 'Failed to create facility');
    }

    return successResponse(res, facility, 'Facility created successfully', 201);

  } catch (error) {
    console.error('Error in POST /api/facilities:', error);
    return errorResponse(res, 'Failed to create facility');
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return optionalAuth(getFacilities)(req, res);
  }

  if (req.method === 'POST') {
    return requireOwnerOrAdmin(createFacility)(req as AuthenticatedRequest, res);
  }

  return errorResponse(res, 'Method not allowed', 405);
}

export default withMethods(['GET', 'POST'])(
  withErrorHandling(handler)
);