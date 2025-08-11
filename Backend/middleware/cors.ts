import { NextApiRequest, NextApiResponse } from 'next';

// CORS middleware for handling preflight requests
export function withCORS(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin && process.env.NODE_ENV === 'development') {
      // Allow requests without origin in development (like Postman)
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-client-info, apikey'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Continue to the actual handler
    return handler(req, res);
  };
}

// Enhanced API helper that includes CORS
export function withMethodsAndCORS(allowedMethods: string[]) {
  return (handler: any) => {
    return withCORS(async (req: NextApiRequest, res: NextApiResponse) => {
      if (!allowedMethods.includes(req.method!)) {
        res.setHeader('Allow', allowedMethods.join(', '));
        return res.status(405).json({ 
          success: false, 
          error: `Method ${req.method} not allowed` 
        });
      }
      
      return handler(req, res);
    });
  };
}
