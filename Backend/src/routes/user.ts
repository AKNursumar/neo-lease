import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import supabaseService from '../services/supabase';

const router = Router();

// Middleware to verify JWT token
const authenticateToken = (req: any, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      error: 'Access denied',
      message: 'No token provided'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      error: 'Invalid token',
      message: 'Token is not valid'
    });
    return;
  }
};

// Get current user profile
router.get('/me', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const supabase = supabaseService.getClient();
    const userId = req.user.userId;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      res.status(404).json({
        error: 'User not found',
        message: 'Unable to fetch user profile'
      });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch user profile'
    });
  }
});

export default router;
