import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [editingUser, setEditingUser] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [formData, setFormData] = useState({ email: '', full_name: '', password: '', is_staff: false, is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/admin/users/');
      setUsers(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch users. Ensure you have Admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`/auth/admin/users/${id}/`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert("Error deleting user: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch(`/auth/admin/users/${editingUser.id}/`, editingUser);
      setUsers(users.map(u => (u.id === editingUser.id ? { ...u, ...data } : u)));
      setEditingUser(null);
    } catch (err) {
      alert("Error updating user: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Use the registration endpoint to create new users handling passwords correctly
      const { data } = await api.post('/auth/register/', { 
        ...formData, 
        confirm_password: formData.password 
      });
      // Optionally patch if they checked standard admin flag
      if (formData.is_staff) {
        const adminData = await api.patch(`/auth/admin/users/${data.user ? data.user.id : data.id}/`, { is_staff: true });
        setUsers([adminData.data, ...users]);
      } else {
        setUsers([data.user || data, ...users]);
      }
      setCreatingUser(false);
      setFormData({ email: '', full_name: '', password: '', is_staff: false, is_active: true });
    } catch (err) {
      alert("Error creating user: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex bg-gray-900 min-h-screen font-sans text-gray-100">
      
      {/* ─── SIDEBAR ─── */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col justify-between sticky top-0 h-screen">
        <div>
          <div className="p-6 border-b border-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
              🎓
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">ExamAI</h1>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Admin Portal</p>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            {[
              { id: 'users', label: 'Manage Users', icon: '👥' },
              { id: 'exams', label: 'Manage Exams', icon: '📝' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ].map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    active 
                      ? 'bg-indigo-500/15 text-indigo-400 border-l-4 border-indigo-500' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-white/5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shrink-0">
              {(user?.full_name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-sm font-semibold text-white truncate">{user?.full_name || 'System Admin'}</div>
              <div className="text-xs text-indigo-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <span>🚪</span> Log Out
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="sticky top-0 z-10 px-8 py-5 flex items-center justify-between bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {activeTab === 'users' ? 'Manage Users' : activeTab === 'exams' ? 'Exam Sessions' : 'Platform Settings'}
            </h2>
          </div>
          <button 
            onClick={fetchUsers}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            🔄 Refresh
          </button>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          {/* ────── USERS TAB ────── */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fade-in-up">
              
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-6">
                <div>
                  <h3 className="text-lg font-bold text-white">System Users Database</h3>
                  <p className="text-sm text-gray-400 mt-1">Easily View, Add, Edit, or Remove users from the platform.</p>
                </div>
                <button 
                  onClick={() => setCreatingUser(true)}
                  className="px-6 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:-translate-y-0.5 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <span>➕</span> Add New User
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                {loading ? (
                  <div className="p-12 text-center text-gray-400">Loading user database...</div>
                ) : users.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">No users found in the system.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/5 text-xs uppercase tracking-wider text-gray-400 font-bold">
                          <th className="p-4 pl-6">ID</th>
                          <th className="p-4">User</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Joined On</th>
                          <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                            <td className="p-4 pl-6 text-sm text-gray-500 font-medium">#{u.id}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${u.is_staff ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gray-700'}`}>
                                  {(u.full_name || u.email || '?')[0].toUpperCase()}
                                </div>
                                <div className="leading-tight">
                                  <div className="text-sm font-semibold text-gray-100">{u.full_name || 'No Name'}</div>
                                  <div className="text-xs text-gray-400 mt-0.5">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                u.is_staff ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-gray-400 border border-white/5'
                              }`}>
                                {u.is_staff ? '🛡️ Admin' : '👤 Student'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                u.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {u.is_active ? '● Active' : '● Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-gray-400">
                              {new Date(u.date_joined).toLocaleDateString()}
                            </td>
                            <td className="p-4 pr-6 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setEditingUser({...u})}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors"
                              >
                                ✏️ Edit
                              </button>
                              <button 
                                onClick={() => handleDelete(u.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                              >
                                🗑️ Delete
                              </button>
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

          {/* ────── EXAMS & SETTINGS PLACEHOLDERS ────── */}
          {activeTab === 'exams' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-fade-in-up min-h-[400px]">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-white mb-2">Exam Session Management</h3>
              <p className="text-gray-400 max-w-md">The master exam session database is currently managed via the main interface. Administrative overrides for exams will be available here soon.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Platform Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Application Name</label>
                    <input type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" defaultValue="ExamAI Platform" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Support Email</label>
                    <input type="email" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" defaultValue={user?.email || "support@examai.com"} />
                  </div>
                  <button className="px-6 py-2.5 bg-white/10 border border-white/10 hover:bg-white/15 rounded-xl font-semibold text-white transition-colors mt-2">
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-400 mb-6">These actions are destructive and cannot be undone once executed.</p>
                <button 
                  onClick={() => alert('Not implemented in current scope.')}
                  className="px-6 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl font-semibold text-red-400 transition-colors w-full"
                >
                  Factory Reset Databases
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ─── MODALS FOR CRUD ─── */}
      
      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-indigo-500/30 rounded-2xl shadow-2xl shadow-black/80 w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">✏️ Edit System User</h2>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                <input required type="text" value={editingUser.full_name || ''} onChange={e => setEditingUser({...editingUser, full_name: e.target.value})} className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <input required type="email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors"/>
              </div>

              <div className="pt-2 border-t border-gray-800 space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-semibold text-gray-300">Admin Privileges</span>
                  <input type="checkbox" checked={editingUser.is_staff} onChange={e => setEditingUser({...editingUser, is_staff: e.target.checked})} className="w-5 h-5 rounded border-gray-700 text-indigo-500 bg-black/30 focus:ring-indigo-500 focus:ring-offset-gray-900" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-semibold text-gray-300">Account Active</span>
                  <input type="checkbox" checked={editingUser.is_active} onChange={e => setEditingUser({...editingUser, is_active: e.target.checked})} className="w-5 h-5 rounded border-gray-700 text-emerald-500 bg-black/30 focus:ring-emerald-500 focus:ring-offset-gray-900" />
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/10">Cancel</button>
                <button type="submit" disabled={saving} className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all ${saving ? 'bg-indigo-500/50' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/25 border border-indigo-400/50'}`}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {creatingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-indigo-500/30 rounded-2xl shadow-2xl shadow-black/80 w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">➕ Add New User</h2>
              <button onClick={() => setCreatingUser(false)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors" placeholder="John Doe"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors" placeholder="john@example.com"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Temporary Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} minLength={6} className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Minimum 6 characters"/>
              </div>

              <div className="pt-2">
                <label className="flex items-center justify-between cursor-pointer p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-sm font-semibold text-gray-300">Grant Admin Privileges</span>
                  <input type="checkbox" checked={formData.is_staff} onChange={e => setFormData({...formData, is_staff: e.target.checked})} className="w-5 h-5 rounded border-gray-700 text-indigo-500 bg-black/30 focus:ring-indigo-500 focus:ring-offset-gray-900" />
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setCreatingUser(false)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/10">Cancel</button>
                <button type="submit" disabled={saving} className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all ${saving ? 'bg-indigo-500/50' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/25 border border-indigo-400/50'}`}>
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Basic keyframes for minor animation built-in manually inside React */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

    </div>
  );
}
