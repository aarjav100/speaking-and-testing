import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { memoryStore, UserProfile } from '../database/memoryStore';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

      const userId = crypto.randomUUID();
      const newUser: UserProfile = {
        id: userId,
        name,
        email,
        password,
    created_at: new Date().toISOString(),
    };

  memoryStore.users.set(userId, newUser);
  memoryStore.users.set(email, newUser);

  res.status(201).json({
    success: true,
    data: {
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      token: newUser.id,
    },
  });
} catch (err: any) {
  res.status(500).json({ error: err.message || 'Registration failed' });
}
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

      let user = memoryStore.users.get(email);
      if (!user) {
        // Auto-create local user if doesn't exist
        user = {
          id: crypto.randomUUID(),
          name: email.split('@')[0],
          email,
          created_at: new Date().toISOString(),
        };
        memoryStore.users.set(user.id, user);
        memoryStore.users.set(email, user);
      }

      res.json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, name: user.name },
          token: user.id,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

// GET /api/auth/me
authRouter.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : 'demo-user-1';

      let user = memoryStore.users.get(token);
      if (!user) {
        user = memoryStore.users.get('demo-user-1')!;
      }

      res.json({
        success: true,
        data: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get user' });
    }
  });
