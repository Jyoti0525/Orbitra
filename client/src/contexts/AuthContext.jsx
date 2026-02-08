import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { api } from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get ID token
          const token = await firebaseUser.getIdToken();
          setIdToken(token);
          setUser(firebaseUser);

          // Create session cookie on backend
          await api.post('/api/auth/sessionLogin', { idToken: token });
        } catch (err) {
          console.error('Auth error:', err);
          setError(err.message);
        }
      } else {
        setUser(null);
        setIdToken(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();

      // Backend will create session cookie
      await api.post('/api/auth/sessionLogin', { idToken: token });

      return result.user;
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);

      // Sign out from Firebase FIRST (clears localStorage and triggers onAuthStateChanged)
      await firebaseSignOut(auth);

      // Clear backend session
      await api.post('/api/auth/logout').catch(err => {
        // Ignore backend errors during logout
        console.warn('Backend logout error:', err);
      });

      // Manually clear state
      setUser(null);
      setIdToken(null);
      setLoading(false);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const value = {
    user,
    idToken,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
