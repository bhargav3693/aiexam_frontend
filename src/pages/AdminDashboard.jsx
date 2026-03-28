import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [activityLogs, setActivityLogs] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedActivityUser, setSelectedActivityUser] = useState(null);
  const [userSearchText, setUserSearchText] = useState('');
  const [specificLogs, setSpecificLogs] = useState([]);
  const [loadingSpecificLogs, setLoadingSpecificLogs] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/admin/users/');
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users. Do you have admin privileges?');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityData = async () => {
    setLogsLoading(true);
    try {
      const logsRes = await api.get('/auth/admin/system-activity/');
      setActivityLogs(logsRes.data);
      const userRes = await api.get('/auth/admin/user-activity/');
      setUserActivity(userRes.data);
    } catch (err) {
      console.error("Failed to fetch activity data", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleViewUserActivity = async (user) => {
    console.log("handleViewUserActivity triggered for user:", user);
    setActiveTab('userActivity');
    setSelectedActivityUser(user);
    setLoadingSpecificLogs(true);
    try {
      const res = await api.get(`/auth/admin/user-activity/${user.id}/`);
      setSpecificLogs(res.data);
    } catch (err) {
      console.error("Error fetching specific logs!", err);
      alert("Error fetching specific logs!");
    } finally {
      setLoadingSpecificLogs(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchActivityData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      await api.delete(`/auth/admin/users/${id}/`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert("Failed to delete user: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.patch(`/auth/admin/users/${editingUser.id}/`, editingUser);
      setUsers(users.map(u => (u.id === editingUser.id ? { ...u, ...data } : u)));
      setEditingUser(null);
    } catch (err) {
      alert("Failed to update user: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
  };

  const { logout } = useAuth();

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '20px 40px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🎓</span>
          <h1 style={{ margin: 0, fontSize: 24, background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ExamAI Management System
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button 
            onClick={() => setActiveTab('users')}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '10px 24px' }}
          >
            Users
          </button>
          <button 
            onClick={() => { setActiveTab('activityLog'); setSelectedActivityUser(null); }}
            className={`btn ${activeTab === 'activityLog' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '10px 24px' }}
          >
            Activity Log
          </button>
          <button 
            onClick={() => setActiveTab('userActivity')}
            className={`btn ${activeTab === 'userActivity' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '10px 24px' }}
          >
            User Activity
          </button>
          <button onClick={logout} className="btn btn-danger" style={{ padding: '10px 24px' }}>
            Log Out
          </button>
        </div>
      </header>
      
      <main className="page-container animate-fade" style={{ margin: '0 auto', maxWidth: 1200, padding: 40, width: '100%' }}>
        <div className="page-header">
          <h1>👑 Admin Portal</h1>
          <p className="subtitle">Securely manage platform users and view system statistics</p>
        </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{users.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Admins</div>
          <div className="stat-value">{users.filter(u => u.is_staff).length}</div>
        </div>
      </div>

      {activeTab === 'users' && (
      <div className="dash-card">
        <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <h3>User Management</h3>
          {error && <div style={{ color: '#ef4444', padding: 12 }}>{error}</div>}
          
          {loading ? <p>Loading users...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: 16 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: 12 }}>ID</th>
                    <th style={{ padding: 12 }}>Name</th>
                    <th style={{ padding: 12 }}>Email</th>
                    <th style={{ padding: 12 }}>Role</th>
                    <th style={{ padding: 12 }}>Joined</th>
                    <th style={{ padding: 12 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 12 }}>#{u.id}</td>
                      <td style={{ padding: 12 }}>{u.full_name || 'No Name'}</td>
                      <td style={{ padding: 12 }}>{u.email}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ 
                          background: u.is_staff ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                          color: u.is_staff ? '#a5b4fc' : 'var(--text-secondary)',
                          padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 
                        }}>{u.is_staff ? 'Admin' : 'Student'}</span>
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                        {new Date(u.date_joined).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                        <button onClick={() => setEditingUser(u)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => handleDelete(u.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Delete</button>
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

      {activeTab === 'activityLog' && (
      <div className="dash-card">
        <div>
          <h3>System Activity Log</h3>
          <p>Recent platform events, user registrations, and examination activities.</p>
          <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 8, marginTop: 16, border: '1px solid var(--border)' }}>
            {logsLoading ? <p>Loading logs...</p> : activityLogs.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No logs available for the current period.</p> : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activityLogs.map((log, idx) => (
                  <li key={idx} style={{ padding: 16, borderLeft: `4px solid ${log.type === 'exam_completed' ? '#10b981' : log.type === 'user_joined' ? '#3b82f6' : '#f59e0b'}`, background: 'var(--bg-secondary)', borderRadius: '0 8px 8px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 16 }}>{log.message}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      )}

      {activeTab === 'userActivity' && (
      <div className="dash-card">
        {selectedActivityUser ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <button onClick={() => setSelectedActivityUser(null)} className="btn btn-secondary" style={{ padding: '8px 16px' }}>&larr; Back to Users</button>
              <h3 style={{ margin: 0 }}>Activity Log: {selectedActivityUser.name || selectedActivityUser.email}</h3>
            </div>
            {loadingSpecificLogs ? <p>Loading logs...</p> : specificLogs.length === 0 ? <p>No logs found.</p> : (
              (() => {
                try {
                  const barData = specificLogs
                    .filter(l => l.type === 'exam_completed')
                    .map((l, index) => ({
                      name: `Ex #${l.exam_id || index}`,
                      score: l.score !== undefined ? l.score : 0,
                      date: new Date(l.timestamp).toLocaleDateString()
                    }))
                    .reverse();

                  return (
                    <div>
                        <div style={{ display: 'flex', gap: 20, marginBottom: 30, flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 100%', background: 'var(--bg-secondary)', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
                            <h4 style={{ marginTop: 0, marginBottom: 16 }}>Score History</h4>
                            {barData.length > 0 ? (
                              <div style={{ height: 250, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                                    <YAxis stroke="var(--text-secondary)" fontSize={12} domain={[0, 100]} />
                                    <RechartsTooltip 
                                      contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8 }}
                                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="score" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            ) : <p style={{ color: 'var(--text-muted)' }}>No completed exams yet to show history.</p>}
                          </div>
                        </div>

                      <h3 style={{ marginBottom: 16 }}>Detailed Timeline</h3>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {specificLogs.map((log, idx) => (
                          <li key={idx} style={{ padding: 16, borderLeft: `4px solid ${log.type === 'exam_completed' ? '#10b981' : log.type === 'exam_started' ? '#f59e0b' : '#6366f1'}`, background: 'var(--bg-secondary)', borderRadius: '0 8px 8px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 16 }}>{log.message}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                } catch (err) {
                  return <div style={{ color: 'red', padding: 20 }}>Error generating charts: {err.message}</div>;
                }
              })()
            )}
          </div>
        ) : (
          <div>
            <h3>User Activity Tracking</h3>
            <p>Monitor individual user actions, login times, and exam sessions.</p>
            <div style={{ marginBottom: 16, marginTop: 16 }}>
              <input 
                type="text" 
                placeholder="Search by user name or email..." 
                value={userSearchText}
                onChange={e => setUserSearchText(e.target.value)}
                style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px' }}
              />
            </div>
            <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 8, marginTop: 16, border: '1px solid var(--border)', overflowX: 'auto' }}>
              {logsLoading ? <p>Loading data...</p> : userActivity.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No user activity data collected yet.</p> : (
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                       <th style={{ padding: 12 }}>User</th>
                       <th style={{ padding: 12 }}>Email</th>
                       <th style={{ padding: 12 }}>Joined</th>
                       <th style={{ padding: 12 }}>Exams Taken</th>
                       <th style={{ padding: 12 }}>Last Login</th>
                       <th style={{ padding: 12 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userActivity
                      .filter(ua => (ua.name || '').toLowerCase().includes(userSearchText.toLowerCase()) || ua.email.toLowerCase().includes(userSearchText.toLowerCase()))
                      .map(ua => (
                      <tr key={ua.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 12 }}>{ua.name}</td>
                        <td style={{ padding: 12 }}>{ua.email}</td>
                        <td style={{ padding: 12 }}>{new Date(ua.date_joined).toLocaleDateString()}</td>
                        <td style={{ padding: 12, fontWeight: 'bold', color: 'var(--accent)' }}>{ua.exam_count}</td>
                        <td style={{ padding: 12, fontSize: 13 }}>{ua.last_login ? new Date(ua.last_login).toLocaleString() : 'Never'}</td>
                        <td style={{ padding: 12 }}>
                          <button onClick={() => handleViewUserActivity(ua)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>View Log</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
      )}
      </main>

      {editingUser && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <div className="auth-card" style={{ width: 400, border: '1px solid var(--accent)' }}>
            <h2 style={{ marginBottom: 20 }}>Edit User</h2>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Full Name</label>
                <input value={editingUser.full_name || ''} onChange={e => setEditingUser({...editingUser, full_name: e.target.value})} style={{ background: 'var(--bg-primary)' }}/>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} required style={{ background: 'var(--bg-primary)' }} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, marginBottom: 20 }}>
                <input type="checkbox" id="is_staff" checked={editingUser.is_staff} onChange={e => setEditingUser({...editingUser, is_staff: e.target.checked})} style={{ width: 'auto' }} />
                <label htmlFor="is_staff" style={{ margin: 0 }}>Admin Privileges</label>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <input type="checkbox" id="is_active" checked={editingUser.is_active} onChange={e => setEditingUser({...editingUser, is_active: e.target.checked})} style={{ width: 'auto' }} />
                <label htmlFor="is_active" style={{ margin: 0 }}>Account Active (Can log in)</label>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
