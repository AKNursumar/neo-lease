import { NextApiRequest, NextApiResponse } from 'next';
import { withMethodsAndCORS } from '@/middleware/cors';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString(),
    method: req.method,
    cors: 'enabled'
  });
}

export default withMethodsAndCORS(['GET', 'POST', 'OPTIONS'])(handler);
