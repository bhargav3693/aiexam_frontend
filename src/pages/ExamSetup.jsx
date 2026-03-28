import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export default function ExamSetup() {
  const [topics, setTopics] = useState([
    { id: 13, name: 'Quantitative Aptitude', difficulty: 'medium', icon: '🧮' }, 
    { id: 14, name: 'Logical Reasoning', difficulty: 'medium', icon: '🧩' }, 
    { id: 16, name: 'General Awareness', difficulty: 'easy', icon: '🌍' }
  ]);
  const [selected, setSelected] = useState([]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  // useEffect(() => {
  //   api.get('exams/topics/')
  //     .then(({ data }) => setTopics(data))
  //     .catch(() => setError('Failed to load topics.'))
  //     .finally(() => setLoading(false));
  // }, []);

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
      const { data } = await api.post('exams/sessions/', {
        topic_ids: selected,
        time_limit_minutes: timeLimit,
        language: language,
      });
      navigate(`/exam/${data.id}`);
    } catch (err) {
      if (err.response?.status === 429 || err.response?.data?.detail?.includes("429")) {
        setError('Server is busy or API quota reached. Please wait for 1 minute and try again.');
      } else {
        setError(err.response?.data?.detail || 'Failed to create exam session.');
      }
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
        <div className="topics-grid">
          {topics && topics.length > 0 ? (
            topics.map((topic) => (
              <div
                key={topic.id || topic.name}
                id={`topic-${topic.id || topic.name}`}
                className={`topic-chip${selected.includes(topic.id) ? ' selected' : ''}`}
                onClick={() => toggleTopic(topic.id)}
                role="checkbox"
                aria-checked={selected.includes(topic.id)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleTopic(topic.id)}
              >
                <div className="topic-icon">{topic.icon}</div>
                <div className="topic-name">{topic.name}</div>
                {topic.difficulty && (
                  <div className="topic-meta">
                    <span className={`badge badge-${topic.difficulty}`}>
                      {DIFFICULTY_LABELS[topic.difficulty]}
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>Loading topics...</p>
          )}
        </div>

        <div className="section-title">Exam Language</div>
        <div style={{ marginBottom: 30 }}>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: 16 }}
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi (हिंदी)</option>
            <option value="Telugu">Telugu (తెలుగు)</option>
            <option value="Tamil">Tamil (தமிழ்)</option>
            <option value="Marathi">Marathi (मराठी)</option>
            <option value="Bengali">Bengali (বাংলা)</option>
            <option value="Gujarati">Gujarati (ગુજરાતી)</option>
            <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
            <option value="Malayalam">Malayalam (മലയാളം)</option>
            <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
            <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
            <option value="Urdu">Urdu (اردو)</option>
          </select>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>The AI will generate all questions directly in this language.</p>
        </div>

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
