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
import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js';
import activityRoutes from './routes/activity.routes.js';

// Import cron jobs
import { initAlertChecker } from './jobs/alertChecker.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure allowed origins (env + sensible localhost defaults)
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : [];
const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultOrigins]));

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`Blocked CORS request from: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
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
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/activity', activityRoutes);

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

  // Initialize cron jobs
  initAlertChecker();
  console.log(`⏰ Cron jobs: Alert checker initialized (runs hourly)`);
});

export default app;
