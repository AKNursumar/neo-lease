import { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient, supabaseAdmin } from '@/lib/supabase';
import { User } from '@/types/supabase';

// Extend NextApiRequest to include user
export interface AuthenticatedRequest extends NextApiRequest {
  user: User;
  accessToken: string;
}

// Authentication result type
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  accessToken?: string;
}

// Extract JWT token from Authorization header or cookies
function extractToken(req: NextApiRequest): string | null {
  // Try Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookies
  const cookieToken = req.cookies.access_token;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

// Authenticate user using Supabase JWT
export async function authenticateUser(req: NextApiRequest): Promise<AuthResult> {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return { success: false, error: 'No access token provided' };
    }

    // Verify JWT with Supabase
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      return { success: false, error: 'Invalid or expired token' };
    }

    // Get user profile from custom users table
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !userProfile) {
      return { success: false, error: 'User profile not found' };
    }

    return {
      success: true,
      user: userProfile,
      accessToken: token,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

// Middleware to require authentication
export function requireAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authResult = await authenticateUser(req);

    if (!authResult.success || !authResult.user) {
      return res.status(401).json({
        error: authResult.error || 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    // Add user and token to request object
    (req as AuthenticatedRequest).user = authResult.user;
    (req as AuthenticatedRequest).accessToken = authResult.accessToken!;

    return handler(req as AuthenticatedRequest, res);
  };
}

// Middleware to require specific role
export function requireRole(roles: string[] | string) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return function(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void) {
    return requireAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
          required_roles: allowedRoles,
        });
      }

      return handler(req, res);
    });
  };
}

// Middleware to require admin role
export const requireAdmin = requireRole('admin');

// Middleware to require owner or admin role
export const requireOwnerOrAdmin = requireRole(['owner', 'admin']);

// Optional authentication (doesn't fail if no token)
export function optionalAuth(handler: (req: NextApiRequest & { user?: User; accessToken?: string }, res: NextApiResponse) => Promise<void> | void) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authResult = await authenticateUser(req);

    if (authResult.success && authResult.user) {
      (req as any).user = authResult.user;
      (req as any).accessToken = authResult.accessToken;
    }

    return handler(req, res);
  };
}

// Check if user owns a resource
export async function checkResourceOwnership(
  userId: string,
  resourceType: 'facility' | 'court' | 'product' | 'booking' | 'rental_order',
  resourceId: string
): Promise<boolean> {
  try {
    let query;
    
    switch (resourceType) {
      case 'facility':
        query = supabaseAdmin
          .from('facilities')
          .select('owner_id')
          .eq('id', resourceId)
          .single();
        break;
      
      case 'court':
        query = supabaseAdmin
          .from('courts')
          .select('facility:facilities(owner_id)')
          .eq('id', resourceId)
          .single();
        break;
      
      case 'product':
        query = supabaseAdmin
          .from('products')
          .select('facility:facilities(owner_id)')
          .eq('id', resourceId)
          .single();
        break;
      
      case 'booking':
        query = supabaseAdmin
          .from('bookings')
          .select('user_id')
          .eq('id', resourceId)
          .single();
        break;
      
      case 'rental_order':
        query = supabaseAdmin
          .from('rental_orders')
          .select('user_id')
          .eq('id', resourceId)
          .single();
        break;
      
      default:
        return false;
    }

    const { data, error } = await query;

    if (error || !data) {
      return false;
    }

    if (resourceType === 'booking' || resourceType === 'rental_order') {
      return 'user_id' in data && data.user_id === userId;
    } else if (resourceType === 'facility') {
      return 'owner_id' in data && data.owner_id === userId;
    } else {
      return 'facility' in data && data.facility && (data.facility as any).owner_id === userId;
    }
  } catch (error) {
    console.error('Error checking resource ownership:', error);
    return false;
  }
}

// Middleware to require resource ownership or admin role
export function requireOwnership(
  resourceType: 'facility' | 'court' | 'product' | 'booking' | 'rental_order',
  resourceIdParam: string = 'id'
) {
  return function(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void) {
    return requireAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      // Admin can access anything
      if (req.user.role === 'admin') {
        return handler(req, res);
      }

      const resourceId = req.query[resourceIdParam] as string;
      
      if (!resourceId) {
        return res.status(400).json({
          error: 'Resource ID not provided',
          code: 'MISSING_RESOURCE_ID',
        });
      }

      const isOwner = await checkResourceOwnership(req.user.id, resourceType, resourceId);
      
      if (!isOwner) {
        return res.status(403).json({
          error: 'Access denied. You do not own this resource.',
          code: 'NOT_OWNER',
        });
      }

      return handler(req, res);
    });
  };
}

export default requireAuth;