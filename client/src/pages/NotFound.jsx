import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-space-gradient flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-400 mb-8">Page not found in this galaxy</p>
        <Link
          to="/"
          className="px-6 py-3 bg-nebula-purple rounded-lg hover:bg-nebula-purple/80 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
