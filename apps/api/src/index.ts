import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeDatabases } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import problemRoutes from './routes/problem.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import comparisonRoutes from './routes/comparison.routes.js';
import { createSuccessResponse, createErrorResponse } from '@aica/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '64kb' })); // Max payload limit to prevent buffer overflow attacks

// Healthcheck Route
app.get('/health', (_, res) => {
  res.status(200).json(
    createSuccessResponse({
      status: 'HEALTHY',
      service: 'aica-api-gateway',
      version: '2.0.0',
      uptime: process.uptime()
    })
  );
});

// Mount Domain API Routes (v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/problems', problemRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/leaderboards', leaderboardRoutes);
app.use('/api/v1/comparisons', comparisonRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json(createErrorResponse('NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
});

// Centralized Error Handling Middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[GlobalErrorHandler]', err.stack || err.message);
  res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred'));
});

// Start Server
async function startServer() {
  await initializeDatabases();
  app.listen(PORT, () => {
    console.log(`[AICA API Gateway] Server listening on http://localhost:${PORT}`);
  });
}

startServer();
