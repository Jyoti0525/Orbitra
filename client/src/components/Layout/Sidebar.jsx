import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/watchlist', label: 'Watchlist', icon: '⭐' },
  { path: '/alerts', label: 'Alerts', icon: '🔔' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-deep-space border-r border-nebula-purple/30 p-4">
      <nav className="space-y-2">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-nebula-purple/30 text-star-blue'
                  : 'text-gray-300 hover:bg-deep-space hover:text-white'
              }`
            }
          >
            <span className="text-2xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
