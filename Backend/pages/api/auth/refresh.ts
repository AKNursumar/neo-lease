import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandling, successResponse, errorResponse } from '@/utils/api-helpers';
import { withMethodsAndCORS } from '@/middleware/cors';
import { supabase } from '@/lib/supabase';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return errorResponse(res, 'No refresh token provided', 401);
    }

    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return errorResponse(res, 'Failed to refresh token', 401);
    }

    // Set new cookies
    res.setHeader('Set-Cookie', [
      `access_token=${data.session.access_token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax`,
      `refresh_token=${data.session.refresh_token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`,
    ]);

    return successResponse(res, {
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at,
    }, 'Token refreshed successfully');

  } catch (error) {
    console.error('Token refresh error:', error);
    return errorResponse(res, 'Token refresh failed', 500);
  }
}

export default withMethodsAndCORS(['POST', 'OPTIONS'])(
  withErrorHandling(handler)
);
