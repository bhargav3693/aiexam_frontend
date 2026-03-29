import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/* ────────────────────────────────────────────────── */
/*  Tiny helper: format date                          */
/* ────────────────────────────────────────────────── */
const fmt = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' });
};

/* ────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers]         = useState([]);
  const [activity, setActivity]   = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  // Modals
  const [editingUser, setEditingUser]   = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [formData, setFormData] = useState({
    email: '', full_name: '', password: '', is_staff: false, is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  /* ── fetch everything on mount ── */
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, actRes, uaRes] = await Promise.allSettled([
        api.get('/auth/admin/users/'),
        api.get('/auth/admin/system-activity/'),
        api.get('/auth/admin/user-activity/'),
      ]);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data);
      if (actRes.status === 'fulfilled')   setActivity(actRes.value.data);
      if (uaRes.status === 'fulfilled')    setUserActivity(uaRes.value.data);
    } catch (err) {
      setError('Failed to load data. Ensure you have Admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  /* ── CRUD ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`/auth/admin/users/${id}/`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert('Error deleting user: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const { data } = await api.patch(`/auth/admin/users/${editingUser.id}/`, editingUser);
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...data } : u));
      setEditingUser(null);
    } catch (err) {
      setSaveError(err.response?.data ? JSON.stringify(err.response.data) : err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const { data } = await api.post('/auth/register/', {
        ...formData, confirm_password: formData.password,
      });
      if (formData.is_staff) {
        const adminData = await api.patch(
          `/auth/admin/users/${data.user ? data.user.id : data.id}/`, { is_staff: true }
        );
        setUsers([adminData.data, ...users]);
      } else {
        setUsers([data.user || data, ...users]);
      }
      setCreatingUser(false);
      setFormData({ email: '', full_name: '', password: '', is_staff: false, is_active: true });
    } catch (err) {
      setSaveError(err.response?.data ? JSON.stringify(err.response.data) : err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  /* ── Derived stats ── */
  const totalUsers    = users.length;
  const adminCount    = users.filter(u => u.is_staff).length;
  const activeCount   = users.filter(u => u.is_active).length;
  const examCount     = activity.filter(a => a.type === 'exam_started').length;
  const completedExams = activity.filter(a => a.type === 'exam_completed').length;

  /* ── Sidebar tabs ── */
  const tabs = [
    { id: 'overview', label: 'Overview',      icon: '📊' },
    { id: 'users',    label: 'Manage Users',   icon: '👥' },
    { id: 'activity', label: 'Activity Feed',  icon: '🔔' },
    { id: 'settings', label: 'Settings',       icon: '⚙️' },
  ];

  /* ── Activity icon map ── */
  const actIcon = { user_joined: '👤', exam_started: '📝', exam_completed: '✅' };
  const actColor = { user_joined: '#6366f1', exam_started: '#f59e0b', exam_completed: '#10b981' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060a1a', color: '#e2e8f0', fontFamily: "'Inter',sans-serif", position: 'relative' }}>

      {/* ─── OVERLAY for mobile ─── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 199 }}
        />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside style={{
        width: 260,
        background: 'rgba(5,8,22,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: sidebarOpen ? 0 : '-260px',
        height: '100vh',
        zIndex: 200,
        transition: 'left 0.3s ease',
      }}
      className="admin-sidebar"
      >
        {/* Logo */}
        <div>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 24px rgba(99,102,241,0.35)' }}>🎓</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>ExamAI</div>
              <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin Portal</div>
            </div>
          </div>

          <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tabs.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 16px', borderRadius: 12, border: 'none',
                    background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: active ? '#a5b4fc' : '#94a3b8',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    borderLeft: `3px solid ${active ? '#6366f1' : 'transparent'}`,
                    transition: 'all 0.2s',
                    textAlign: 'left', width: '100%',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info + Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 14, flexShrink: 0 }}>
              {((user?.full_name || user?.email || '?')[0]).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || 'System Admin'}</div>
              <div style={{ fontSize: 11, color: '#818cf8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, border: 'none', background: 'transparent', color: '#f87171', fontWeight: 600, fontSize: 14, cursor: 'pointer', width: '100%', transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            🚪 Log Out
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ flex: 1, marginLeft: 260, display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="admin-main">

        {/* Top Header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', height: 64,
          background: 'rgba(6,10,26,0.85)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none', background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer', padding: 4 }}
            >☰</button>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 20, background: 'linear-gradient(to right, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
                {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
              </h2>
            </div>
          </div>
          <button
            onClick={fetchAll}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            🔄 Refresh
          </button>
        </header>

        {/* Page Body */}
        <main style={{ flex: 1, padding: '32px', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
          {error && (
            <div style={{ padding: '14px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, color: '#fca5a5', marginBottom: 24, fontWeight: 500 }}>
              ⚠️ {error}
            </div>
          )}

          {/* ══ OVERVIEW TAB ══ */}
          {activeTab === 'overview' && (
            <div style={{ animation: 'fadeUp 0.3s ease' }}>
              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                {[
                  { label: 'Total Users', value: loading ? '…' : totalUsers, icon: '👥', color: '#6366f1' },
                  { label: 'Active Users', value: loading ? '…' : activeCount, icon: '✅', color: '#10b981' },
                  { label: 'Admin Accounts', value: loading ? '…' : adminCount, icon: '🛡️', color: '#8b5cf6' },
                  { label: 'Exams Started', value: loading ? '…' : examCount, icon: '📝', color: '#f59e0b' },
                  { label: 'Exams Completed', value: loading ? '…' : completedExams, icon: '🏆', color: '#06b6d4' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>{stat.value}</div>
                    <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginTop: 4 }}>{stat.label}</div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: stat.color, opacity: 0.6 }} />
                  </div>
                ))}
              </div>

              {/* Recent users table */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Recent Users</div>
                  <button onClick={() => setActiveTab('users')} style={{ fontSize: 13, color: '#818cf8', background: 'none', border: 'none', cursor:'pointer', fontWeight: 600 }}>View all →</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['User', 'Role', 'Status', 'Joined'].map(h => (
                        <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Loading…</td></tr>
                      : users.slice(0, 5).map(u => (
                        <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 30, height: 30, borderRadius: '50%', background: u.is_staff ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff' }}>
                                {(u.full_name || u.email || '?')[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{u.full_name || 'No Name'}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.is_staff ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)', color: u.is_staff ? '#818cf8' : '#94a3b8', border: `1px solid ${u.is_staff ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                              {u.is_staff ? '🛡️ Admin' : '👤 Student'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: u.is_active ? '#34d399' : '#f87171', border: `1px solid ${u.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                              {u.is_active ? '● Active' : '● Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 20px', fontSize: 13, color: '#64748b' }}>{fmtDate(u.date_joined)}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ USERS TAB ══ */}
          {activeTab === 'users' && (
            <div style={{ animation: 'fadeUp 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>User Database</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{users.length} registered {users.length === 1 ? 'user' : 'users'}</div>
                </div>
                <button
                  onClick={() => setCreatingUser(true)}
                  style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
                >
                  ➕ Add User
                </button>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading users…</div>
                ) : users.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>No users found.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                          {['#', 'User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '12px 18px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '14px 18px', fontSize: 12, color: '#475569', fontWeight: 600 }}>#{u.id}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.is_staff ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0 }}>
                                  {(u.full_name || u.email || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.full_name || 'No Name'}</div>
                                  <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.is_staff ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)', color: u.is_staff ? '#818cf8' : '#94a3b8', border: `1px solid ${u.is_staff ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                                {u.is_staff ? '🛡️ Admin' : '👤 Student'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: u.is_active ? '#34d399' : '#f87171', border: `1px solid ${u.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                                {u.is_active ? '● Active' : '● Inactive'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', fontSize: 13, color: '#64748b' }}>{fmtDate(u.date_joined)}</td>
                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button onClick={() => { setEditingUser({...u}); setSaveError(''); }}
                                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                  ✏️ Edit
                                </button>
                                <button onClick={() => handleDelete(u.id)}
                                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ACTIVITY TAB ══ */}
          {activeTab === 'activity' && (
            <div style={{ animation: 'fadeUp 0.3s ease' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 700, fontSize: 16 }}>
                  📟 System Activity Feed
                </div>
                {loading ? (
                  <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading activity…</div>
                ) : activity.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>No activity recorded yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {activity.map((ev, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 24px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${actColor[ev.type]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, border: `1px solid ${actColor[ev.type]}33` }}>
                          {actIcon[ev.type] || '📌'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>{ev.message}</div>
                          <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{fmt(ev.timestamp)}</div>
                        </div>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: `${actColor[ev.type]}15`, color: actColor[ev.type], fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                          {ev.type.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ SETTINGS TAB ══ */}
          {activeTab === 'settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, animation: 'fadeUp 0.3s ease' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Platform Preferences</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Application Name</label>
                    <input type="text" defaultValue="ExamAI Platform" style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Support Email</label>
                    <input type="email" defaultValue={user?.email || 'support@examai.com'} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <button style={{ padding: '11px 20px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#e2e8f0', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                    Save Changes
                  </button>
                </div>
              </div>

              <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 20, padding: 24 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, color: '#f87171', marginBottom: 8 }}>⚠️ Danger Zone</h3>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>These actions are destructive and cannot be undone once executed.</p>
                <button onClick={() => alert('Factory reset is disabled for safety.')}
                  style={{ width: '100%', padding: '11px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, color: '#f87171', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                  Factory Reset Databases
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── MODALS ─── */}

      {/* Edit User Modal */}
      {editingUser && (
        <Modal title="✏️ Edit User" onClose={() => setEditingUser(null)}>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ModalField label="Full Name">
              <input required type="text" value={editingUser.full_name || ''} onChange={e => setEditingUser({...editingUser, full_name: e.target.value})} style={inputStyle} />
            </ModalField>
            <ModalField label="Email Address">
              <input required type="email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} style={inputStyle} />
            </ModalField>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <ToggleRow label="Admin Privileges" checked={editingUser.is_staff} onChange={v => setEditingUser({...editingUser, is_staff: v})} />
              <ToggleRow label="Account Active"    checked={editingUser.is_active} onChange={v => setEditingUser({...editingUser, is_active: v})} />
            </div>
            {saveError && <div style={{ color: '#fca5a5', fontSize: 13, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>{saveError}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setEditingUser(null)} style={btnSecStyle}>Cancel</button>
              <button type="submit" disabled={saving} style={btnPrimStyle}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create User Modal */}
      {creatingUser && (
        <Modal title="➕ Add New User" onClose={() => setCreatingUser(false)}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ModalField label="Full Name">
              <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} style={inputStyle} placeholder="John Doe" />
            </ModalField>
            <ModalField label="Email Address">
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} placeholder="john@example.com" />
            </ModalField>
            <ModalField label="Password (min 6 chars)">
              <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} minLength={6} style={inputStyle} placeholder="••••••••" />
            </ModalField>
            <ToggleRow label="Grant Admin Privileges" checked={formData.is_staff} onChange={v => setFormData({...formData, is_staff: v})} />
            {saveError && <div style={{ color: '#fca5a5', fontSize: 13, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>{saveError}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setCreatingUser(false)} style={btnSecStyle}>Cancel</button>
              <button type="submit" disabled={saving} style={btnPrimStyle}>{saving ? 'Creating…' : 'Create User'}</button>
            </div>
          </form>
        </Modal>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .admin-main { margin-left: 0 !important; }
          .admin-sidebar { left: -260px; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

/* ───────────────────────── Sub-components ───────────────────────── */

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#0d1127', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'fadeUp 0.25s ease' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 17 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function ModalField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, cursor: 'pointer' }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1' }}>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, transition: 'background 0.2s',
          background: checked ? '#6366f1' : '#1e293b',
          position: 'relative', cursor: 'pointer', flexShrink: 0,
          border: `1px solid ${checked ? '#818cf8' : 'rgba(255,255,255,0.1)'}`,
        }}>
        <div style={{
          position: 'absolute', top: 2, left: checked ? 22 : 2,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
    </label>
  );
}

const inputStyle = {
  width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, padding: '11px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
};

const btnPrimStyle = {
  flex: 1, padding: '12px 20px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
};

const btnSecStyle = {
  flex: 1, padding: '12px 20px', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#94a3b8',
  fontWeight: 700, fontSize: 14, cursor: 'pointer',
};
