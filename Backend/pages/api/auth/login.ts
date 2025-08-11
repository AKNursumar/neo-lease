import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandling, successResponse, errorResponse } from '@/utils/api-helpers';
import { withMethodsAndCORS } from '@/middleware/cors';
import { supabase } from '@/lib/supabase';
import { loginSchema } from '@/utils/validation';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 'Invalid input', 400);
    }

    const { email, password } = validation.data;

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return errorResponse(res, error.message, 401);
    }

    if (!data.user || !data.session) {
      return errorResponse(res, 'Login failed', 401);
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return errorResponse(res, 'Failed to fetch user profile', 500);
    }

    // Prepare user data for frontend
    const userData = {
      id: data.user.id,
      email: data.user.email,
      fullName: userProfile?.full_name,
      role: userProfile?.role || 'user',
      phone: userProfile?.phone_number,
      isVerified: data.user.email_confirmed_at ? true : false,
    };

    // Set secure httpOnly cookie with the session
    res.setHeader('Set-Cookie', [
      `access_token=${data.session.access_token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax`,
      `refresh_token=${data.session.refresh_token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`,
    ]);

    return successResponse(res, {
      user: userData,
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at,
    }, 'Login successful');

  } catch (error) {
    console.error('Login handler error:', error);
    return errorResponse(res, 'Login failed', 500);
  }
}

export default withMethodsAndCORS(['POST', 'OPTIONS'])(
  withErrorHandling(handler)
);
