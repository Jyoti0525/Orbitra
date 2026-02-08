import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const { signInWithGoogle, isAuthenticated, error } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Check if there's a return URL in sessionStorage
      const returnUrl = sessionStorage.getItem('returnUrl');
      if (returnUrl) {
        sessionStorage.removeItem('returnUrl');
        navigate(returnUrl);
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, navigate]);

  // Disable starfield animations on login page
  useEffect(() => {
    document.body.classList.add('no-star-animation');
    return () => {
      document.body.classList.remove('no-star-animation');
    };
  }, []);

  // Star brighten effect with dynamic mask
  useEffect(() => {
    const starBrighten = document.getElementById('star-brighten');
    if (starBrighten) {
      const handleMouseMove = (e) => {
        const x = e.clientX + 'px';
        const y = e.clientY + 'px';
        starBrighten.style.setProperty('--mouse-x', x);
        starBrighten.style.setProperty('--mouse-y', y);
        starBrighten.style.opacity = '1';

        let style = document.getElementById('star-brighten-style');
        if (!style) {
          style = document.createElement('style');
          style.id = 'star-brighten-style';
          document.head.appendChild(style);
        }
        style.textContent = `
          #star-brighten::before {
            mask: radial-gradient(circle 250px at ${x} ${y}, black 0%, transparent 100%) !important;
            -webkit-mask: radial-gradient(circle 250px at ${x} ${y}, black 0%, transparent 100%) !important;
            opacity: 1 !important;
          }
        `;
      };

      const handleMouseLeave = () => {
        starBrighten.style.opacity = '0';
        const style = document.getElementById('star-brighten-style');
        if (style) {
          style.remove();
        }
      };

      document.body.addEventListener('mousemove', handleMouseMove);
      document.body.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        document.body.removeEventListener('mousemove', handleMouseMove);
        document.body.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      // Navigation handled by useEffect above
    } catch (err) {
      console.error('Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <main className="auth-shell">
        {/* Hero Panel (Left) */}
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Secure Access</p>
            <h1>Sign in to stay ahead of every orbit.</h1>
            <p>
              Orbitra uses encrypted authentication so your watch lists, alerts,
              and custom settings stay private. Track asteroids in real-time with
              confidence—your data is secure.
            </p>
          </div>
        </section>

        {/* Auth Card (Right) */}
        <section className="auth-card">
          <div className="logo">Orbitra</div>
          <h2>Welcome back</h2>
          <p className="muted">Use your Google account to continue.</p>

          {/* Google Sign-In Button */}
          <button
            className="google-btn"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            aria-label="Sign in with Google"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google logo"
            />
            <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>

          {/* Error Message */}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {/* Terms and Privacy */}
          <p className="tiny">
            By continuing you agree to Orbitra's{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a> and{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
