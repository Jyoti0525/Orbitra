import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import AsteroidDetail from './pages/AsteroidDetail';
import Explore from './pages/Explore';
import Watchlist from './pages/Watchlist';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Loading from './components/Common/Loading';
import ChatPanel from './components/Chat/ChatPanel';

function AppRoutes() {
  const location = useLocation();
  const isAsteroidPage = location.pathname.startsWith('/asteroid/');

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/asteroid/:neoId" element={<AsteroidDetail />} />

        {/* Protected routes with layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/watchlist" element={
            <ProtectedRoute>
              <Watchlist />
            </ProtectedRoute>
          } />

          <Route path="/alerts" element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Global Chat Panel — hidden on asteroid detail (has its own inline chat) */}
      {!isAsteroidPage && <ChatPanel />}
    </>
  );
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
