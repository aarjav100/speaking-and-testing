import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // Token can be a user id or generic demo token
      req.userId = token.startsWith('demo-') || token.length > 5 ? token : 'demo-user-1';
      req.userEmail = req.headers['x-user-email'] as string || 'candidate@example.com';
    } else {
      req.userId = 'demo-user-1';
      req.userEmail = 'candidate@example.com';
    }

  next();
}
