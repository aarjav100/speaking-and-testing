import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { authRouter } from './routes/auth';
import { communicationRouter } from './routes/communication';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

// Server Initialization
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes - Mounted on both /api/* and root /* to guarantee matching across all Vercel/Docker proxies
app.use(['/api/auth', '/auth'], authRouter);
app.use(['/api/communication', '/communication'], communicationRouter);

// Serve static frontend in production (Docker or unified deployment)
const publicDir = path.join(__dirname, '../public');
const localPublicDir = path.join(__dirname, 'public');
const activePublic = fs.existsSync(publicDir) ? publicDir : (fs.existsSync(localPublicDir) ? localPublicDir : null);

if (activePublic) {
  app.use(express.static(activePublic));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(activePublic, 'index.html'));
    }
    next();
  });
}

// Error handler
app.use(errorHandler);

// Only start HTTP listener when not running in a serverless environment (e.g. Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
