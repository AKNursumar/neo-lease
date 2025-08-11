import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandling, successResponse } from '@/utils/api-helpers';
import { withMethodsAndCORS } from '@/middleware/cors';
import { supabase } from '@/lib/supabase';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get token from header or cookie
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                 req.cookies.access_token;

    if (token) {
      // Sign out from Supabase (this invalidates the token)
      await supabase.auth.signOut();
    }

    // Clear cookies
    res.setHeader('Set-Cookie', [
      `access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
      `refresh_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    ]);

    return successResponse(res, null, 'Logged out successfully');

  } catch (error) {
    console.error('Logout handler error:', error);
    // Still return success even if there's an error - user wanted to log out
    res.setHeader('Set-Cookie', [
      `access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
      `refresh_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    ]);
    return successResponse(res, null, 'Logged out successfully');
  }
}

export default withMethodsAndCORS(['POST', 'OPTIONS'])(
  withErrorHandling(handler)
);
