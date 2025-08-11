import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import { successResponse, errorResponse, withMethods, withErrorHandling } from '@/utils/api-helpers';
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

    // Combine profile and auth data
    const userData = {
      ...userProfile,
      email: authUser.email,
      email_verified: authUser.email_confirmed_at ? true : false,
      phone_verified: authUser.phone_confirmed_at ? true : false,
      last_sign_in: authUser.last_sign_in_at,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at,
    };

    return successResponse(res, userData, 'User profile retrieved successfully');
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return errorResponse(res, 'Failed to retrieve user profile');
  }
}

export default withMethods(['GET'])(
  withErrorHandling(
    requireAuth(handler)
  )
);