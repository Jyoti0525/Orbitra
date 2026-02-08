// Authentication Middleware
import { auth } from '../config/firebase.js';

/**
 * Middleware to verify Firebase ID token
 * Protects routes that require authentication
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please sign in again.'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token'
    });
  }
};

/**
 * Middleware to verify session cookie
 * Alternative to ID token verification
 */
export const verifySession = async (req, res, next) => {
  const sessionCookie = req.cookies?.session;

  if (!sessionCookie) {
    return res.status(401).json({
      success: false,
      error: 'No session found'
    });
  }

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    req.user = decodedClaims;
    next();
  } catch (error) {
    console.error('Session verification error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session'
    });
  }
};

/**
 * Alias for backward compatibility
 * Some route files may still use 'authenticateToken'
 */
export const authenticateToken = requireAuth;
