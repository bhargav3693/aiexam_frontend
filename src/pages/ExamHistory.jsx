import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function ExamHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('exams/sessions/history/')
      .then((res) => {
        setHistory(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner" style={{ margin: '50px auto' }} />
      </div>
    );
  }

  return (
    <main className="page-container animate-fade">
      <div className="page-header">
        <h1>Your Exam History ⏳</h1>
        <p className="subtitle">Review your past performance and lockdown violations</p>
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 60, color: 'var(--text-muted)' }}>
          <p>You haven&apos;t taken any exams yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {history.map((session) => (
            <div
              key={session.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: 'var(--text-primary)' }}>
                  Session #{session.id} &mdash; {session.topics.map(t => t.name).join(', ')}
                </h3>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>📅 {new Date(session.started_at).toLocaleDateString()}</span>
                  <span>⏱️ {session.time_limit_minutes} min</span>
                  <span style={{ color: session.is_locked_out ? '#ef4444' : 'inherit' }}>
                    🚨 {session.violation_count} Violations
                  </span>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontSize: 24, 
                  fontWeight: 700, 
                  color: session.is_locked_out ? '#ef4444' : session.score >= 75 ? '#10b981' : session.score >= 50 ? '#f59e0b' : '#ef4444' 
                }}>
                  {session.status === 'completed' ? `${Math.round(session.score || 0)}%` : 'In Progress'}
                </div>
                {session.is_locked_out && (
                  <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>VOID</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
