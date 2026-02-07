/**
 * Orbitra Server - Express API
 * Cosmic Watch Platform Backend
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.routes.js';
import asteroidsRoutes from './routes/asteroids.routes.js';
import watchlistRoutes from './routes/watchlist.routes.js';
import alertsRoutes from './routes/alerts.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';

// Import services
import { startCronJobs } from './services/cronJobs.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Orbitra API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/asteroids', asteroidsRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/notifications', notificationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌌 Orbitra API running on port ${PORT}`);
  console.log(`📡 NASA API key: ${process.env.NASA_API_KEY ? 'Configured' : 'Missing!'}`);
  console.log(`🔥 Firebase: ${process.env.FIREBASE_PROJECT_ID || 'Not configured'}`);

  // Start cron jobs
  startCronJobs();
});

export default app;
