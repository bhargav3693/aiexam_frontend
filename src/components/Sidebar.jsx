import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: '🏠' },
  { path: '/translate', label: 'Translate PDFs', icon: '📄' },
  { path: '/profile', label: 'Profile', icon: '👤' },
  { path: '/exam/setup', label: 'Take Exam', icon: '📝' },
  { path: '/history', label: 'Exam History', icon: '⏳' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/dashboard" className="navbar-brand">
          <div className="brand-icon">🎓</div>
          <span>ExamAI</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-small">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <span className="user-name">{user?.full_name || user?.email}</span>
            <span className="user-role" style={{ color: user?.is_staff ? '#a5b4fc' : 'var(--text-muted)' }}>
              {user?.is_staff ? 'Administrator' : 'Student'}
            </span>
          </div>
        </div>
        <button className="btn btn-secondary logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
