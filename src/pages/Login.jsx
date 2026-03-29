import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login(form.email, form.password);
      // check the is_admin flag
      if (response?.user?.is_admin || response?.user?.is_staff) {
        navigate('/admin-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      // Extract the clearest possible error message from the response
      const data = err.response?.data;
      let msg = 'Invalid email or password. Please try again.';
      if (data) {
        if (typeof data === 'string') {
          msg = data;
        } else if (data.detail) {
          msg = data.detail;
        } else if (data.non_field_errors) {
          msg = Array.isArray(data.non_field_errors)
            ? data.non_field_errors.join(' ')
            : data.non_field_errors;
        } else if (data.email) {
          msg = Array.isArray(data.email) ? data.email.join(' ') : data.email;
        } else if (data.password) {
          msg = Array.isArray(data.password) ? data.password.join(' ') : data.password;
        } else {
          msg = JSON.stringify(data);
        }
      } else if (err.message) {
        if (err.message.includes('Network Error') || err.message.includes('ERR_CONNECTION')) {
          msg = '⚠️ Cannot connect to server. Is the backend running?';
        } else {
          msg = err.message;
        }
      }
      setError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className={`auth-card ${shake ? 'shake-anim' : ''}`}>
        <div className="auth-logo">
          <div className="logo-icon">🎓</div>
          <h1>Welcome back</h1>
          <p>Sign in to continue your exam prep</p>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className={error ? 'input-error' : ''}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className={error ? 'input-error' : ''}
            />
          </div>
          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner-sm"></span>
                Signing in…
              </span>
            ) : 'Sign In →'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create one free</Link>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        .shake-anim {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 14px;
          color: #fca5a5;
          margin-bottom: 20px;
          font-weight: 500;
          line-height: 1.4;
        }
        .error-icon { font-size: 16px; flex-shrink: 0; }
        .input-error {
          border-color: rgba(239, 68, 68, 0.5) !important;
          background: rgba(239, 68, 68, 0.04) !important;
        }
        .spinner-sm {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
