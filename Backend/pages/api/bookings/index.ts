import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '@/middleware/auth';
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
  createBookingSchema, 
  paginationSchema,
  formatValidationErrors 
} from '@/utils/validation';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import { z } from 'zod';

// GET /api/bookings - List bookings with filters
async function getBookings(req: NextApiRequest & { user?: any }, res: NextApiResponse) {
  const queryValidation = validateQuery(paginationSchema.extend({
    user_id: z.string().uuid().optional(),
    court_id: z.string().uuid().optional(),
    facility_id: z.string().uuid().optional(),
    status: z.enum(['draft', 'confirmed', 'cancelled', 'completed']).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  }))(req);

  if (!queryValidation.success) {
    return errorResponse(res, 'Invalid query parameters', 400, 'VALIDATION_ERROR', queryValidation.errors);
  }

  const { 
    page = 1, 
    limit = 20, 
    user_id, 
    court_id, 
    facility_id, 
    status, 
    start_date, 
    end_date 
  } = queryValidation.data;
  
  const offset = getPaginationOffset(page, limit);

  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        user:users(id, full_name, phone),
        court:courts(
          *,
          facility:facilities(id, name, address, owner_id)
        ),
        payment:payments(id, amount, currency, status)
      `, { count: 'exact' });

    // Apply filters based on user role and permissions
    if (!req.user) {
      // Anonymous users cannot view bookings
      return errorResponse(res, 'Authentication required', 401);
    }

    if (req.user.role === 'user') {
      // Regular users can only see their own bookings
      query = query.eq('user_id', req.user.id);
    } else if (req.user.role === 'owner') {
      // Owners can see bookings for their facilities
      if (!user_id && !court_id && !facility_id) {
        // Show all bookings for owner's facilities
        const { data: ownerFacilities } = await supabase
          .from('facilities')
          .select('id')
          .eq('owner_id', req.user.id);

        if (ownerFacilities && ownerFacilities.length > 0) {
          const facilityIds = ownerFacilities.map(f => f.id);
          const { data: facilityCourts } = await supabase
            .from('courts')
            .select('id')
            .in('facility_id', facilityIds);

          if (facilityCourts && facilityCourts.length > 0) {
            const courtIds = facilityCourts.map(c => c.id);
            query = query.in('court_id', courtIds);
          } else {
            return successResponse(res, [], 'No bookings found', 200, createPagination(page, limit, 0));
          }
        }
      }
    }
    // Admin users can see all bookings (no additional filtering)

    // Apply additional filters
    if (user_id) query = query.eq('user_id', user_id);
    if (court_id) query = query.eq('court_id', court_id);
    if (status) query = query.eq('status', status);
    
    if (start_date) {
      query = query.gte('start_datetime', start_date);
    }
    if (end_date) {
      query = query.lte('end_datetime', end_date);
    }

    // Handle facility_id filter by joining with courts
    if (facility_id) {
      const { data: facilityCourts } = await supabase
        .from('courts')
        .select('id')
        .eq('facility_id', facility_id);

      if (facilityCourts && facilityCourts.length > 0) {
        const courtIds = facilityCourts.map(c => c.id);
        query = query.in('court_id', courtIds);
      } else {
        return successResponse(res, [], 'No bookings found', 200, createPagination(page, limit, 0));
      }
    }

    const { data: bookings, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching bookings:', error);
      return errorResponse(res, 'Failed to fetch bookings');
    }

    const pagination = createPagination(page, limit, count || 0);
    return successResponse(res, bookings, 'Bookings retrieved successfully', 200, pagination);

  } catch (error) {
    console.error('Error in GET /api/bookings:', error);
    return errorResponse(res, 'Failed to retrieve bookings');
  }
}

// POST /api/bookings - Create new booking
async function createBooking(req: AuthenticatedRequest, res: NextApiResponse) {
  const bodyValidation = validateBody(createBookingSchema)(req);

  if (!bodyValidation.success) {
    return errorResponse(res, 'Invalid booking data', 422, 'VALIDATION_ERROR', bodyValidation.errors);
  }

  const bookingData = bodyValidation.data;

  try {
    // Verify court exists and is active
    const { data: court, error: courtError } = await supabase
      .from('courts')
      .select(`
        *,
        facility:facilities(id, name, address, is_active, owner_id)
      `)
      .eq('id', bookingData.court_id)
      .eq('is_active', true)
      .single();

    if (courtError || !court) {
      return errorResponse(res, 'Court not found or inactive', 404);
    }

    if (!court.facility.is_active) {
      return errorResponse(res, 'Facility is not active', 400);
    }

    // Check for booking conflicts
    const startTime = new Date(bookingData.start_datetime);
    const endTime = new Date(bookingData.end_datetime);

    // Validate booking time
    if (startTime <= new Date()) {
      return errorResponse(res, 'Booking must be in the future', 400);
    }

    if (endTime <= startTime) {
      return errorResponse(res, 'End time must be after start time', 400);
    }

    const { data: conflictingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('court_id', bookingData.court_id)
      .in('status', ['confirmed', 'draft'])
      .or(`and(start_datetime.lte.${bookingData.start_datetime},end_datetime.gt.${bookingData.start_datetime}),and(start_datetime.lt.${bookingData.end_datetime},end_datetime.gte.${bookingData.end_datetime}),and(start_datetime.gte.${bookingData.start_datetime},end_datetime.lte.${bookingData.end_datetime})`);

    if (conflictingBookings && conflictingBookings.length > 0) {
      return errorResponse(res, 'Court is already booked for the selected time slot', 409, 'BOOKING_CONFLICT');
    }

    // Calculate total price
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const totalPrice = court.price_per_hour * durationHours;

    // Create booking record
    const bookingId = nanoid();
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        id: bookingId,
        user_id: req.user.id,
        court_id: bookingData.court_id,
        start_datetime: bookingData.start_datetime,
        end_datetime: bookingData.end_datetime,
        total_price: totalPrice,
        notes: bookingData.notes,
        status: 'draft',
      })
      .select(`
        *,
        user:users(id, full_name, phone),
        court:courts(
          *,
          facility:facilities(id, name, address)
        )
      `)
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return errorResponse(res, 'Failed to create booking');
    }

    return successResponse(res, booking, 'Booking created successfully', 201);

  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return errorResponse(res, 'Failed to create booking');
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return optionalAuth(getBookings)(req, res);
  }

  if (req.method === 'POST') {
    return requireAuth(createBooking)(req as AuthenticatedRequest, res);
  }

  return errorResponse(res, 'Method not allowed', 405);
}

export default withMethods(['GET', 'POST'])(
  withErrorHandling(handler)
);
