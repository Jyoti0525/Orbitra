/**
 * Authentication Routes
 */
import express from 'express';
import { auth } from '../config/firebase.js';

const router = express.Router();

/**
 * POST /api/auth/sessionLogin
 * Create session cookie from Firebase ID token
 */
router.post('/sessionLogin', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'ID token is required'
      });
    }

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);

    // Create session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Set HTTP-only cookie
    res.cookie('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({
      success: true,
      message: 'Session created successfully',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
      },
    });
  } catch (error) {
    console.error('Session login error:', error);
    res.status(401).json({
      success: false,
      error: 'Failed to create session'
    });
  }
});

/**
 * POST /api/auth/logout
 * Clear session cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/me
 * Get current user info from session
 */
router.get('/me', async (req, res) => {
  const sessionCookie = req.cookies?.session;

  if (!sessionCookie) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);

    res.json({
      success: true,
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        name: decodedClaims.name,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid session'
    });
  }
});

export default router;
