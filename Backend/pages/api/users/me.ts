import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import { successResponse, errorResponse, withErrorHandling } from '@/utils/api-helpers';
import { withMethodsAndCORS } from '@/middleware/cors';
import { supabaseAdmin } from '@/lib/supabase';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // Get fresh user data from database
    const { data: userProfile, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !userProfile) {
      return errorResponse(res, 'User profile not found', 404);
    }

    // Get auth user data from Supabase auth
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(req.accessToken);

    if (authError || !authUser) {
      return errorResponse(res, 'Authentication failed', 401);
    }

    // Prepare user data for frontend (matching AuthContext interface)
    const userData = {
      id: userProfile.id,
      email: authUser.email,
      fullName: userProfile.full_name,
      role: userProfile.role || 'user',
      phone: userProfile.phone_number,
      isVerified: authUser.email_confirmed_at ? true : false,
      last_sign_in: authUser.last_sign_in_at,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at,
    };

    return successResponse(res, { user: userData }, 'User profile retrieved successfully');
  } catch (error) {
    console.error('Error in /api/users/me:', error);
    return errorResponse(res, 'Failed to retrieve user profile');
  }
}

export default withMethodsAndCORS(['GET', 'OPTIONS'])(
  withErrorHandling(
    requireAuth(handler)
  )
);
