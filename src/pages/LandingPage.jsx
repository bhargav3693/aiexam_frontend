import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user, loading } = useAuth();

  // Dynamically bypass the landing page if the user is already authenticated
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (user) {
    return <Navigate to={user.is_staff ? "/admin" : "/dashboard"} replace />;
  }

  return (
    <div className="landing-layout animate-fade">
      {/* Navigation Bar */}
      <nav className="landing-nav">
        <div className="nav-brand">
          <div className="logo-icon-small">🎓</div>
          <span className="brand-text">ExamAI</span>
        </div>
        <div className="nav-links">
          <Link to="/login" className="nav-link">Log In</Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '14px', width: 'auto' }}>
            Get Started Free
          </Link>
        </div>
      </nav>

      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-badge">✨ Next-Generation Preparation</div>
          <h1 className="hero-title">
            AI POWER PROCTORING AND TRANSCRIPTION <br/>
          </h1>
          <p className="hero-subtitle">
            Instantly generate strictly-timed, multi-lingual practice exams tailored to any topic. Secure your learning environment with built-in anti-cheat technology.
          </p>
          
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary cta-btn">
              Start Your Journey →
            </Link>
            <Link to="/login" className="btn btn-secondary cta-btn">
              Sign In to Dashboard
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="features-section">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Instant Generation</h3>
              <p>Type any topic and our AI instantly crafts a comprehensive multiple-choice exam dynamically suited to your domain.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>12+ Languages</h3>
              <p>Break language barriers. Instantly translate complex questions into native Indian languages with a single click.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure Lockdown</h3>
              <p>True exam conditions. Built-in mechanisms prevent tab-switching, right-clicking, and enforce strictly monitored time limits.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <p>© 2026 ExamAI Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
