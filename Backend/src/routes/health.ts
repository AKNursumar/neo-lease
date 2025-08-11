import { Router, Request, Response } from 'express';

const router = Router();

// Health check endpoint
router.get('/readiness', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'Server is ready',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness check endpoint
router.get('/liveness', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'Server is alive',
    timestamp: new Date().toISOString()
  });
});

export default router;
