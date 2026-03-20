import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export default function ExamSetup() {
  const [topics, setTopics] = useState([]);
  const [selected, setSelected] = useState([]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`${import.meta.env.VITE_API_BASE_URL}/api/exams/topics/`)
      .then(({ data }) => setTopics(data))
      .catch(() => setError('Failed to load topics.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleTopic = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleStart = async () => {
    if (selected.length === 0) {
      setError('Please select at least one topic.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post(`${import.meta.env.VITE_API_BASE_URL}/api/exams/sessions/`, {
        topic_ids: selected,
        time_limit_minutes: timeLimit,
      });
      navigate(`/exam/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create exam session.');
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <>
      <main className="page-container animate-fade">
        <div className="page-header">
          <h1>Set Up Your Exam</h1>
          <p className="subtitle">Choose topics and set a time limit to begin</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="section-title">Select Topics</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading topics…
          </div>
        ) : (
          <div className="topics-grid">
            {topics.map((topic) => (
              <div
                key={topic.id}
                id={`topic-${topic.id}`}
                className={`topic-chip${selected.includes(topic.id) ? ' selected' : ''}`}
                onClick={() => toggleTopic(topic.id)}
                role="checkbox"
                aria-checked={selected.includes(topic.id)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleTopic(topic.id)}
              >
                <div className="topic-icon">{topic.icon}</div>
                <div className="topic-name">{topic.name}</div>
                <div className="topic-meta">
                  <span className={`badge badge-${topic.difficulty}`}>
                    {DIFFICULTY_LABELS[topic.difficulty]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="section-title">Time Limit</div>
        <div className="time-control">
          <label>Set your exam duration</label>
          <div className="time-display">
            {timeLimit}<span>min</span>
          </div>
          <input
            id="time-slider"
            type="range"
            min={5} max={120} step={5}
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>5 min</span><span>120 min</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            id="start-exam-btn"
            className="btn btn-primary"
            style={{ width: 'auto', padding: '15px 40px' }}
            onClick={handleStart}
            disabled={submitting || selected.length === 0}
          >
            {submitting ? 'Starting…' : `Start Exam (${selected.length} topic${selected.length !== 1 ? 's' : ''})`}
          </button>
          {selected.length > 0 && (
            <button className="btn btn-secondary" onClick={() => setSelected([])}>
              Clear selection
            </button>
          )}
        </div>
      </main>
    </>
  );
}
