import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-deep-space border-b border-nebula-purple/30 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-star-blue to-nebula-purple">
            🌌 Orbitra
          </h1>
          <span className="text-sm text-gray-400">Cosmic Watch</span>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <>
              <div className="flex items-center space-x-3">
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm">{user.displayName}</span>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-danger-red/20 text-danger-red rounded hover:bg-danger-red/30 transition"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
