import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Signout error:', error);
      setSigningOut(false);
    }
  };

  return (
    <nav className="bg-deep-space border-b border-nebula-purple/30 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-star-blue to-nebula-purple">
              🌌 Orbitra
            </h1>

          </div>
          {user && (
            <button
              onClick={() => navigate('/explore')}
              className="px-4 py-2 bg-star-blue/20 text-star-blue border border-star-blue/30 rounded hover:bg-star-blue/30 transition text-sm font-medium"
            >
              🔭 Explore Asteroids
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <>
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full border border-nebula-purple object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex'; // Show fallback
                    }}
                  />
                ) : null}
                <div
                  className="w-8 h-8 rounded-full bg-nebula-purple/30 border border-nebula-purple flex items-center justify-center text-xs font-bold text-white"
                  style={{ display: user.photoURL ? 'none' : 'flex' }}
                >
                  {user.displayName?.charAt(0) || 'U'}
                </div>
                <span className="text-sm text-gray-200 font-medium">{user.displayName}</span>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="px-4 py-2 bg-danger-red/20 text-danger-red rounded hover:bg-danger-red/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signingOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
